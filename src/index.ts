import { build as buildFormula } from "esformula";
import type { Expression } from "esformula";
import type {
  Context,
  PrimitiveExpressionType,
  ExpressionTypeDictionary,
  DescribeSObjectResult,
} from "./types";
import { parseFormula } from "./formula";
import { context as builtins, types as builtinTypeDict } from "./builtin";
import { extractFields } from "./fieldExtraction";
import { createFieldTypeDictionary } from "./fieldType";
import { traverse, invalidTypeError } from "./traverse";
import { isCastableType, castValue } from "./cast";

export type CalculatedType = PrimitiveExpressionType["type"];

export type FormulaReturnType = Exclude<CalculatedType, "id">;

export type Formula = {
  compiled: CompiledFormula;
  returnType: FormulaReturnType;
  evaluate(context?: Context): any;
};

export type CompiledFormula = {
  expression: Expression;
  fields: string[];
  returnType: FormulaReturnType;
  scale: number | undefined;
  calculatedType: CalculatedType;
};

export type SyncParseOptions = {
  fieldTypes?: ExpressionTypeDictionary;
  returnType?: FormulaReturnType;
  scale?: number;
  blankAsZero?: boolean;
};

export type ParseOptions = {
  sobject: string;
  describe: (sobject: string) => Promise<DescribeSObjectResult>;
  returnType?: FormulaReturnType;
  scale?: number;
  blankAsZero?: boolean;
};

/**
 *
 */
export function create(compiled: CompiledFormula): Formula {
  const esformula = buildFormula(compiled.expression);
  const { returnType, scale, calculatedType } = compiled;
  return {
    compiled,
    returnType,
    evaluate(context: Context = {}) {
      const value = esformula.evaluate({ ...context, ...builtins });
      return castValue(value, calculatedType, returnType, scale);
    },
  };
}

function traverseAndCreateFormula(
  expression: Expression,
  fieldTypes: ExpressionTypeDictionary,
  fields: string[],
  options: {
    returnType: FormulaReturnType | undefined;
    scale: number | undefined;
    blankAsZero: boolean;
  }
) {
  const { returnType, scale, blankAsZero } = options;
  const { expression: expression_, returnType: calculatedType } = traverse(
    expression,
    { ...fieldTypes, ...builtinTypeDict },
    blankAsZero
  );
  if (
    calculatedType.type === "picklist" ||
    calculatedType.type === "object" ||
    calculatedType.type === "function" ||
    calculatedType.type === "template"
  ) {
    throw invalidTypeError(expression, calculatedType.type, [
      "string",
      "number",
      "currency",
      "percent",
      "date",
      "datetime",
      "boolean",
    ]);
  }
  if (returnType && !isCastableType(calculatedType.type, returnType)) {
    throw invalidTypeError(expression, calculatedType.type, [returnType]);
  }
  return create({
    expression: expression_,
    fields,
    returnType:
      returnType && returnType !== "any"
        ? returnType
        : calculatedType.type === "id"
        ? "string"
        : calculatedType.type,
    scale,
    calculatedType: calculatedType.type,
  });
}

/**
 *
 */
export function parseSync(
  formula: string,
  options: SyncParseOptions = {}
): Formula {
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const { returnType, fieldTypes = {}, scale, blankAsZero = false } = options;
  try {
    return traverseAndCreateFormula(expression, fieldTypes, fields, {
      returnType,
      scale,
      blankAsZero,
    });
  } catch (e) {
    console.log(e.stack);
    console.log({ returnType });
    console.log(expression);
    throw e;
  }
}

/**
 *
 */
export async function parse(
  formula: string,
  options: ParseOptions
): Promise<Formula> {
  const { returnType, scale, blankAsZero = false, ...describer } = options;
  const expression: Expression = parseFormula(formula);
  const fields = extractFields(expression);
  const fieldTypes = await createFieldTypeDictionary(fields, describer);
  try {
    return traverseAndCreateFormula(expression, fieldTypes, fields, {
      returnType,
      scale,
      blankAsZero,
    });
  } catch (e) {
    console.log(e.stack);
    console.log({ returnType });
    console.log(expression);
    throw e;
  }
}

export { builtins };
