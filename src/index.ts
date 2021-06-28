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
import { toTypeIdentifier } from "./utils";

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

type CompiledFormulaV1 = {
  expression: Expression; // ecmascript expression
  fields: string[];
  returnType: FormulaReturnType;
  scale: number | undefined;
  calculatedType: FormulaReturnType;
};

type CompiledFormulaV2 = {
  version: 2;
  ast: Expression; // salesforce formula ast
} & CompiledFormulaV1;

export type CompiledFormula = CompiledFormulaV2 | CompiledFormulaV1;

export type Formula = {
  compiled: CompiledFormula;
  returnType: FormulaReturnType;
  evaluate(context?: Context): any;
};

export type SyncParseOptions = {
  inputTypes?: ExpressionTypeDictionary;
  /** @deprecated */
  fieldTypes?: ExpressionTypeDictionary;
  returnType?: FormulaReturnType;
  scale?: number;
  blankAsZero?: boolean;
  bracketIdentifierHolder?: string;
};

export type Describer = {
  sobject: string;
  describe: (sobject: string) => Promise<DescribeSObjectResult>;
};

export type ParseOptions = SyncParseOptions & Describer;

/**
 *
 */
export function create(compiled: CompiledFormula): Formula {
  const { expression, returnType, scale, calculatedType } = compiled;
  const esformula = buildFormula(expression);
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
  ast: Expression,
  inputTypes: ExpressionTypeDictionary,
  fields: string[],
  options: {
    returnType: FormulaReturnType | undefined;
    scale: number | undefined;
    blankAsZero: boolean;
  }
) {
  const { returnType, scale, blankAsZero } = options;
  const { expression, returnType: calculatedType } = traverse(
    ast,
    { ...inputTypes, ...builtinTypes },
    blankAsZero
  );
  if (
    calculatedType.type === "id" ||
    calculatedType.type === "picklist" ||
    calculatedType.type === "multipicklist" ||
    calculatedType.type === "object" ||
    calculatedType.type === "function" ||
    calculatedType.type === "class" ||
    calculatedType.type === "template"
  ) {
    throw new InvalidTypeError(ast, toTypeIdentifier(calculatedType), [
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
    throw new InvalidTypeError(ast, calculatedType.type, [returnType]);
  }
  return create({
    version: 2,
    ast,
    expression,
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
export function compileSync(ast: Expression, options: SyncParseOptions) {
  const fields = extractFields(ast);
  const {
    returnType,
    inputTypes: types = options.fieldTypes ?? {},
    scale,
    blankAsZero = false,
  } = options;
  return traverseAndCreateFormula(ast, types, fields, {
    returnType,
    scale,
    blankAsZero,
  });
}

/**
 *
 */
export function parseSync(
  formula: string,
  options: SyncParseOptions = {}
): Formula {
  const ast = parseFormula(formula, options);
  return compileSync(ast, options);
}

/**
 *
 */
export async function compile(ast: Expression, options: ParseOptions) {
  const {
    inputTypes = {},
    returnType,
    scale,
    blankAsZero = false,
    ...describer
  } = options;
  const fields = extractFields(ast);
  const fieldTypes = await createFieldTypeDictionary(
    inputTypes,
    fields,
    describer
  );
  return traverseAndCreateFormula(
    ast,
    { ...inputTypes, ...fieldTypes },
    fields,
    {
      returnType,
      scale,
      blankAsZero,
    }
  );
}

/**
 *
 */
export async function parse(
  formula: string,
  options: ParseOptions
): Promise<Formula> {
  const ast = parseFormula(formula, options);
  return compile(ast, options);
}

export { builtins };
