import { build as buildFormula } from "esformula";
import type { Expression } from "esformula";
import type {
  Context,
  PrimitiveExpressionType,
  ExpressionTypeDictionary,
  DescribeSObjectResult,
} from "./types";
import { parseFormula } from "./formula";
import { context as builtins, types as builtinTypes } from "./builtin";
import { extractFields } from "./fieldExtraction";
import { createFieldTypeDictionary } from "./fieldType";
import { traverse } from "./traverse";
import { isCastableType, castValue } from "./cast";
import {
  InvalidArgLengthError,
  InvalidOperatorError,
  InvalidTypeError,
  SyntaxError,
  TypeNotFoundError,
  UnexpectedError,
  ValidationError,
} from "./error";

export {
  InvalidArgLengthError,
  InvalidOperatorError,
  InvalidTypeError,
  SyntaxError,
  TypeNotFoundError,
  UnexpectedError,
  ValidationError,
};

export type FormulaReturnType = PrimitiveExpressionType["type"];

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
  calculatedType: FormulaReturnType;
};

export type SyncParseOptions = {
  inputTypes?: ExpressionTypeDictionary;
  /** @deprecated */
  fieldTypes?: ExpressionTypeDictionary;
  returnType?: FormulaReturnType;
  scale?: number;
  blankAsZero?: boolean;
};

export type ParseOptions = {
  sobject: string;
  inputTypes?: ExpressionTypeDictionary;
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
  inputTypes: ExpressionTypeDictionary,
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
    { ...inputTypes, ...builtinTypes },
    blankAsZero
  );
  if (
    calculatedType.type === "id" ||
    calculatedType.type === "picklist" ||
    calculatedType.type === "multipicklist" ||
    calculatedType.type === "object" ||
    calculatedType.type === "function" ||
    calculatedType.type === "template"
  ) {
    throw new InvalidTypeError(expression, calculatedType.type, [
      "string",
      "number",
      "currency",
      "percent",
      "date",
      "datetime",
      "time",
      "boolean",
    ]);
  }
  if (returnType && !isCastableType(calculatedType.type, returnType)) {
    throw new InvalidTypeError(expression, calculatedType.type, [returnType]);
  }
  return create({
    expression: expression_,
    fields,
    returnType:
      returnType && returnType !== "any" ? returnType : calculatedType.type,
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
  const {
    returnType,
    inputTypes: types = options.fieldTypes ?? {},
    scale,
    blankAsZero = false,
  } = options;
  return traverseAndCreateFormula(expression, types, fields, {
    returnType,
    scale,
    blankAsZero,
  });
}

/**
 *
 */
export async function parse(
  formula: string,
  options: ParseOptions
): Promise<Formula> {
  const {
    inputTypes = {},
    returnType,
    scale,
    blankAsZero = false,
    ...describer
  } = options;
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const fieldTypes = await createFieldTypeDictionary(
    inputTypes,
    fields,
    describer
  );
  return traverseAndCreateFormula(
    expression,
    { ...inputTypes, ...fieldTypes },
    fields,
    {
      returnType,
      scale,
      blankAsZero,
    }
  );
}

export { builtins };
