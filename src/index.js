/* @flow */
import { build as buildFormula } from 'esformula';
import type { Expression } from 'esformula';
import type { Context, ExpressionType, ExpressionTypeDictionary, DescribeSObjectResult } from './types'; 
import { parseFormula } from './formula';
import { context as builtins, types as builtinTypeDict } from './builtin';
import { extractFields } from './fieldExtraction';
import { createFieldTypeDictionary } from './fieldType';
import { calculateReturnType, isCompatibleType, invalidTypeError } from './typeCalculation';

export type ReturnType = $PropertyType<ExpressionType, 'type'>;

export type Formula = {
  _ast: Expression,
  formula: string,
  fields: string[],
  returnType?: ReturnType,
  evaluate(context?: Context): any
};

type SyncParseOptions = {
  fieldTypes?: ExpressionTypeDictionary,
  returnType?: ReturnType,
};

type ParseOptions = {
  sobject: string,
  describe: (string) => Promise<DescribeSObjectResult>,
  returnType?: ReturnType,
};

/**
 * 
 */
function createFormulaInstance(params: {
  expression: Expression,
  formula: string,
  fields: string[],
  returnType?: ReturnType,
  calculatedType: ReturnType,
}): Formula {
  const {
    expression,
    formula,
    fields,
    returnType,
    calculatedType,
  } = params;
  const esformula = buildFormula(expression);
  return {
    _ast: expression,
    formula,
    fields,
    returnType,
    evaluate(context?: Context = {}) {
      const ret = esformula.evaluate({ ...context, ...builtins });
      if (returnType === 'date' && calculatedType === 'datetime') {
        return ret && ret.substring(0, 10);
      }
      return ret;
    },
  };
}

/**
 *
 */
export function parseSync(formula: string, options: SyncParseOptions = {}): Formula {
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const { returnType, fieldTypes = {} } = options;
  try {
    const { expression: expression_, returnType: calculatedType } = calculateReturnType(expression, { ...fieldTypes, ...builtinTypeDict });
    if (returnType && !isCompatibleType(calculatedType.type, returnType)) {
      throw invalidTypeError(expression, calculatedType.type, [returnType]);
    }
    return createFormulaInstance({
      formula,
      expression: expression_,
      fields,
      returnType: returnType && returnType !== 'any' ? returnType : calculatedType.type,
      calculatedType: calculatedType.type,
    });
  } catch(e) {
    console.log(expression);
    throw e;
  }
}

/**
 *
 */
export async function parse(formula: string, options: ParseOptions): Promise<Formula> {
  const { returnType, ...describer } = options;
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const fieldTypes = await createFieldTypeDictionary(fields, describer);
  try {
    const { expression: expression_, returnType: calculatedType } = calculateReturnType(expression, { ...fieldTypes, ...builtinTypeDict });
    if (returnType && !isCompatibleType(calculatedType.type, returnType)) {
      throw invalidTypeError(expression, calculatedType.type, [returnType]);
    }
    return createFormulaInstance({
      formula,
      expression: expression_,
      fields,
      returnType: returnType && returnType !== 'any' ? returnType : calculatedType.type,
      calculatedType: calculatedType.type,
    });
  } catch(e) {
    console.log(expression);
    throw e;
  }
}