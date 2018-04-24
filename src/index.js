/* @flow */
import { build as buildFormula } from 'esformula';
import type { Expression } from 'esformula';
import type {
  Context, PrimitiveExpressionType, ExpressionType, ExpressionTypeDictionary, DescribeSObjectResult,
} from './types'; 
import { parseFormula } from './formula';
import { context as builtins, types as builtinTypeDict } from './builtin';
import { extractFields } from './fieldExtraction';
import { createFieldTypeDictionary } from './fieldType';
import { traverse, isCompatibleType, validationError, invalidTypeError } from './traverse';

export type ReturnType = $PropertyType<PrimitiveExpressionType, 'type'>;

export type Formula = {
  compiled: CompiledFormula,
  returnType: ReturnType,
  evaluate(context?: Context): any
};

export type CompiledFormula = {
  expression: Expression,
  fields: string[],
  returnType: ReturnType,
  scale: ?number,
  calculatedType: ReturnType,
};

export type SyncParseOptions = {
  fieldTypes?: ExpressionTypeDictionary,
  returnType?: ReturnType,
  scale?: number,
  blankAsZero?: boolean,
};

export type ParseOptions = {
  sobject: string,
  describe: (string) => Promise<DescribeSObjectResult>,
  returnType?: ReturnType,
  scale?: number,
  blankAsZero?: boolean,
};

function applyScale(n: number, scale: number) {
  const power = 10 ** scale;
  return Math.round(n * power) / power;
}

/**
 * 
 */
export function create(compiled: CompiledFormula): Formula {
  const esformula = buildFormula(compiled.expression);
  const { returnType, scale, calculatedType } = compiled;
  return {
    compiled,
    returnType,
    evaluate(context?: Context = {}) {
      let ret = esformula.evaluate({ ...context, ...builtins });
      if (returnType === 'date' && calculatedType === 'datetime') {
        return ret && ret.substring(0, 10);
      }
      if (returnType === 'number' && typeof scale === 'number') {
        ret = ret != null ? applyScale(ret, scale) : ret;
      }
      return ret;
    },
  };
}

function traverseAndCreateFormula(expression, fieldTypes, fields, options) {
  const { returnType, scale, blankAsZero } = options;
  const { expression: expression_, returnType: calculatedType } =
    traverse(expression, { ...fieldTypes, ...builtinTypeDict }, blankAsZero);
  if (calculatedType.type === 'object' || calculatedType.type === 'function' || calculatedType.type === 'template') {
    throw invalidTypeError(expression, calculatedType.type, ['string', 'number', 'currency', 'date', 'datetime', 'boolean']);
  }
  if (returnType && !isCompatibleType(calculatedType.type, returnType)) {
    throw invalidTypeError(expression, calculatedType.type, [returnType]);
  }
  return create({
    expression: expression_,
    fields,
    returnType: returnType && returnType !== 'any' ? returnType : calculatedType.type,
    scale,
    calculatedType: calculatedType.type,
  });
}

/**
 *
 */
export function parseSync(formula: string, options: SyncParseOptions = {}): Formula {
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const { returnType, fieldTypes = {}, scale, blankAsZero = false } = options;
  try {
    return traverseAndCreateFormula(expression, fieldTypes, fields, { returnType, scale, blankAsZero });
  } catch(e) {
    console.log(e.stack);
    console.log({ returnType });
    console.log(expression);
    throw e;
  }
}

/**
 *
 */
export async function parse(formula: string, options: ParseOptions): Promise<Formula> {
  const { returnType, scale, blankAsZero = false, ...describer } = options;
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const fieldTypes = await createFieldTypeDictionary(fields, describer);
  try {
    return traverseAndCreateFormula(expression, fieldTypes, fields, { returnType, scale, blankAsZero });
  } catch(e) {
    console.log(e.stack);
    console.log({ returnType });
    console.log(expression);
    throw e;
  }
}

export { builtins };