import type {
  Expression,
  UnaryExpression,
  BinaryExpression,
  LogicalExpression,
  MemberExpression,
  CallExpression,
  ObjectExpression,
  ArrayExpression,
  Identifier,
  Literal,
} from "esformula";
import {
  InvalidArgLengthError,
  InvalidOperatorError,
  InvalidTypeError,
  UnexpectedError,
  TypeNotFoundError,
} from "./error";
import type {
  ExpressionType,
  ExpressionTypeDictionary,
  FunctionArgType,
} from "./types";
import { toTypeIdentifier } from "./utils";

export type TraverseResult = {
  expression: Expression;
  returnType: ExpressionType;
};

function createCallExpression(
  name: string,
  args: CallExpression["arguments"]
): CallExpression {
  return {
    type: "CallExpression",
    callee: { type: "Identifier", name },
    arguments: args,
    optional: false,
  };
}

function createLiteral(value: string | number | boolean | null): Literal {
  return {
    type: "Literal",
    value,
    raw: String(value),
  };
}

function createArrayExpression(
  elements: ArrayExpression["elements"]
): ArrayExpression {
  return { type: "ArrayExpression", elements };
}

function annotateArgumentTypes(
  name: string,
  args: CallExpression["arguments"],
  argTypes: ExpressionType[]
) {
  const annotatedArgs = args.map((arg, i) => {
    const argType = argTypes[i];
    switch (argType.type) {
      case "number":
      case "currency":
      case "percent":
        return createArrayExpression([
          arg,
          createLiteral(argType.type),
          // createLiteral(argType.precision == null ? null : argType.precision),
          // createLiteral(argType.scale == null ? null : argType.scale),
        ]);
      default:
        return createArrayExpression([arg, createLiteral(argType.type)]);
    }
  });
  return createCallExpression(name, annotatedArgs);
}

function injectCallExpression(
  expression: CallExpression,
  argumentTypes: ExpressionType[]
): Expression {
  const { callee, arguments: args } = expression;
  if (callee.type === "Identifier") {
    switch (callee.name) {
      case "TEXT":
      case "HYPERLINK":
        return annotateArgumentTypes(callee.name, args, argumentTypes);
      default:
        break;
    }
  }
  return expression;
}

function idValue(expression: Expression): TraverseResult {
  return {
    expression: createCallExpression("$$CASEUNSAFEID$$", [expression]),
    returnType: { type: "string" },
  };
}

function nullValue(result: TraverseResult, blankAsZero: boolean) {
  const { expression, returnType } = result;
  let altValue: Literal | ObjectExpression | null = null;
  if (returnType.type === "string") {
    altValue = createLiteral("");
  } else if (returnType.type === "boolean") {
    altValue = createLiteral(false);
  } else if (
    returnType.type === "number" ||
    returnType.type === "currency" ||
    returnType.type === "percent"
  ) {
    altValue = createLiteral(blankAsZero ? 0 : null);
  }
  if (altValue) {
    return {
      expression: createCallExpression("NULLVALUE", [expression, altValue]),
      returnType,
    };
  }
  return result;
}

const UNARY_OPERATOR_FN = {
  "-": "$$MINUS_NUMBER$$",
  "+": "$$PLUS_NUMBER$$",
  "!": "NOT",
};

function traverseUnaryExpression(
  expression: UnaryExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const { operator } = expression;
  const { expression: argument, returnType: argumentType } = traverseExpression(
    expression.argument,
    typeDict,
    blankAsZero
  );
  const argumentTypeId = toTypeIdentifier(argumentType);
  if (operator !== "-" && operator !== "+" && operator !== "!") {
    throw new InvalidOperatorError(
      expression.argument,
      argumentTypeId,
      operator
    );
  }
  switch (argumentType.type) {
    case "number":
      if (operator !== "-" && operator !== "+") {
        throw new InvalidOperatorError(
          expression.argument,
          argumentTypeId,
          operator
        );
      }
      break;
    case "boolean":
      if (operator !== "!") {
        throw new InvalidOperatorError(
          expression.argument,
          argumentTypeId,
          operator
        );
      }
      break;
    default:
      throw new InvalidTypeError(expression.argument, argumentTypeId, [
        "number",
        "boolean",
      ]);
  }
  return {
    expression: createCallExpression(UNARY_OPERATOR_FN[operator], [argument]),
    returnType: argumentType,
  };
}

function traverseStringBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightTypeId = toTypeIdentifier(right.returnType);
  if (rightTypeId !== "string" && rightTypeId !== "any") {
    throw new InvalidTypeError(expression.right, rightTypeId, ["string"]);
  }
  switch (operator) {
    case "+":
      return {
        expression: createCallExpression("$$CONCAT_STRING$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "string" },
      };
    case "==":
    case "===":
      return {
        expression: createCallExpression("$$EQ_STRING$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    case "!=":
    case "!==":
      return {
        expression: createCallExpression("$$NEQ_STRING$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    default:
      throw new InvalidOperatorError(
        expression.left,
        toTypeIdentifier(left.returnType),
        operator
      );
  }
}

const NUMBER_OPERATOR_FN = {
  "+": "$$ADD_NUMBER$$",
  "-": "$$SUBTRACT_NUMBER$$",
  "*": "$$MULTIPLY_NUMBER$$",
  "/": "$$DIVIDE_NUMBER$$",
  "**": "$$POWER_NUMBER$$",
  "<": "$$LT_NUMBER$$",
  ">": "$$GT_NUMBER$$",
  "<=": "$$LTE_NUMBER$$",
  ">=": "$$GTE_NUMBER$$",
  "==": "$$EQ_NUMBER$$",
  "!=": "$$NEQ_NUMBER$$",
  "===": "$$EQ_NUMBER$$",
  "!==": "$$NEQ_NUMBER$$",
};

function convertCurrencyToNumber(expression: Expression): TraverseResult {
  return {
    expression,
    returnType: { type: "number" },
  };
}

function convertPercentToNumber(expression: Expression): TraverseResult {
  return {
    expression: createCallExpression("$$SHIFT_DECIMAL$$", [
      expression,
      createLiteral(2),
    ]),
    returnType: { type: "number" },
  };
}

function wrapValue(
  expression: Expression,
  returnType: ExpressionType,
  blankAsZero: boolean
): TraverseResult {
  let result: TraverseResult = { expression, returnType };
  if (returnType.type === "id") {
    result = idValue(expression);
  } else if (returnType.type === "currency") {
    result = convertCurrencyToNumber(expression);
  } else if (returnType.type === "percent") {
    result = convertPercentToNumber(expression);
  }
  return nullValue(result, blankAsZero);
}

function traverseNumberBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightType = right.returnType;
  const rightTypeId = toTypeIdentifier(rightType);
  if (rightTypeId !== "number" && rightTypeId !== "any") {
    throw new InvalidTypeError(expression.right, rightTypeId, ["number"]);
  }
  switch (operator) {
    case "+":
    case "-":
    case "*":
    case "/":
    case "**":
      return {
        expression: createCallExpression(NUMBER_OPERATOR_FN[operator], [
          left.expression,
          right.expression,
        ]),
        returnType: left.returnType,
      };
    case "<":
    case ">":
    case "<=":
    case ">=":
    case "==":
    case "!=":
    case "===":
    case "!==":
      return {
        expression: createCallExpression(NUMBER_OPERATOR_FN[operator], [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    default:
      throw new InvalidOperatorError(
        expression.left,
        toTypeIdentifier(left.returnType),
        operator
      );
  }
}

const BOOLEAN_OPERATOR_FN = {
  "==": "$$EQ_BOOLEAN$$",
  "!=": "$$NEQ_BOOLEAN$$",
  "===": "$$EQ_BOOLEAN$$",
  "!==": "$$NEQ_BOOLEAN$$",
};

function traverseBooleanBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightType = right.returnType;
  if (rightType.type !== "boolean" && rightType.type !== "any") {
    throw new InvalidTypeError(expression.right, rightType.type, ["boolean"]);
  }
  switch (operator) {
    case "==":
    case "!=":
    case "===":
    case "!==":
      return {
        expression: createCallExpression(BOOLEAN_OPERATOR_FN[operator], [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    default:
      throw new InvalidOperatorError(
        expression.left,
        toTypeIdentifier(left.returnType),
        operator
      );
  }
}

const DATE_OPERATOR_FN = {
  "<": "$$LT_DATE$$",
  "<=": "$$LTE_DATE$$",
  ">": "$$GT_DATE$$",
  ">=": "$$GTE_DATE$$",
  "==": "$$EQ_DATE$$",
  "!=": "$$NEQ_DATE$$",
  "===": "$$EQ_DATE$$",
  "!==": "$$NEQ_DATE$$",
};

function traverseDateBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightTypeId = toTypeIdentifier(right.returnType);
  switch (operator) {
    case "+":
      if (rightTypeId !== "number" && rightTypeId !== "any") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["number"]);
      }
      return {
        expression: createCallExpression("$$ADD_DATE$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "date" },
      };
    case "-":
      if (rightTypeId === "number") {
        return {
          expression: createCallExpression("$$SUBTRACT_DATE$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "date" },
        };
      } else if (rightTypeId === "date") {
        return {
          expression: createCallExpression("$$DIFF_DATE$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "number" },
        };
      } else {
        throw new InvalidTypeError(expression.right, rightTypeId, [
          "number",
          "date",
        ]);
      }
    case "<":
    case ">":
    case ">=":
    case "<=":
    case "==":
    case "!=":
    case "===":
    case "!==": {
      if (rightTypeId !== "date") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["date"]);
      }
      const name = DATE_OPERATOR_FN[operator];
      return {
        expression: createCallExpression(name, [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    }
    default:
      throw new InvalidOperatorError(
        expression.left,
        toTypeIdentifier(left.returnType),
        operator
      );
  }
}

const DATETIME_OPERATOR_FN = {
  "<": "$$LT_DATETIME$$",
  "<=": "$$LTE_DATETIME$$",
  ">": "$$GT_DATETIME$$",
  ">=": "$$GTE_DATETIME$$",
  "==": "$$EQ_DATETIME$$",
  "!=": "$$NEQ_DATETIME$$",
  "===": "$$EQ_DATETIME$$",
  "!==": "$$NEQ_DATETIME$$",
};

function traverseDatetimeBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightTypeId = toTypeIdentifier(right.returnType);
  switch (operator) {
    case "+":
      if (rightTypeId !== "number" && rightTypeId !== "any") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["number"]);
      }
      return {
        expression: createCallExpression("$$ADD_DATETIME$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "datetime" },
      };
    case "-":
      if (rightTypeId === "number") {
        return {
          expression: createCallExpression("$$SUBTRACT_DATETIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "datetime" },
        };
      } else if (rightTypeId === "datetime") {
        return {
          expression: createCallExpression("$$DIFF_DATETIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "number" },
        };
      } else {
        throw new InvalidTypeError(expression.right, rightTypeId, [
          "number",
          "datetime",
        ]);
      }
    case "<":
    case ">":
    case ">=":
    case "<=":
    case "==":
    case "!=":
    case "===":
    case "!==": {
      if (rightTypeId !== "datetime") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["datetime"]);
      }
      const name = DATETIME_OPERATOR_FN[operator];
      return {
        expression: createCallExpression(name, [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    }
    default:
      throw new InvalidOperatorError(
        expression.left,
        toTypeIdentifier(left.returnType),
        operator
      );
  }
}

const TIME_OPERATOR_FN = {
  "<": "$$LT_TIME$$",
  "<=": "$$LTE_TIME$$",
  ">": "$$GT_TIME$$",
  ">=": "$$GTE_TIME$$",
  "==": "$$EQ_TIME$$",
  "!=": "$$NEQ_TIME$$",
  "===": "$$EQ_TIME$$",
  "!==": "$$NEQ_TIME$$",
};

function traverseTimeBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightTypeId = toTypeIdentifier(right.returnType);
  switch (operator) {
    case "+":
      if (rightTypeId !== "number" && rightTypeId !== "any") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["number"]);
      }
      return {
        expression: createCallExpression("$$ADD_TIME$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "time" },
      };
    case "-":
      if (rightTypeId === "number") {
        return {
          expression: createCallExpression("$$SUBTRACT_TIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "time" },
        };
      } else if (rightTypeId === "time") {
        return {
          expression: createCallExpression("$$DIFF_TIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "number" },
        };
      } else {
        throw new InvalidTypeError(expression.right, rightTypeId, [
          "number",
          "time",
        ]);
      }
    case "<":
    case ">":
    case ">=":
    case "<=":
    case "==":
    case "!=":
    case "===":
    case "!==": {
      if (rightTypeId !== "time") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["time"]);
      }
      const name = TIME_OPERATOR_FN[operator];
      return {
        expression: createCallExpression(name, [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    }
    default:
      throw new InvalidOperatorError(
        expression.left,
        toTypeIdentifier(left.returnType),
        operator
      );
  }
}

function traverseBinaryExpression(
  expression: BinaryExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const left = traverseExpression(expression.left, typeDict, blankAsZero);
  const right = traverseExpression(expression.right, typeDict, blankAsZero);
  const leftTypeId = toTypeIdentifier(left.returnType);
  switch (leftTypeId) {
    case "string":
      return traverseStringBinaryExpression(expression, left, right);
    case "number":
      return traverseNumberBinaryExpression(expression, left, right);
    case "boolean":
      return traverseBooleanBinaryExpression(expression, left, right);
    case "date":
      return traverseDateBinaryExpression(expression, left, right);
    case "datetime":
      return traverseDatetimeBinaryExpression(expression, left, right);
    case "time":
      return traverseTimeBinaryExpression(expression, left, right);
    default:
      throw new InvalidTypeError(expression.left, leftTypeId, [
        "string",
        "number",
        "date",
        "datetime",
        "time",
      ]);
  }
}

const LOGICAL_OPERATOR_FN: { [op: string]: string } = {
  "&&": "AND",
  "||": "OR",
};

function traverseLogicalExpression(
  expression: LogicalExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const { operator } = expression;
  const left = traverseExpression(expression.left, typeDict, blankAsZero);
  const right = traverseExpression(expression.right, typeDict, blankAsZero);
  const leftTypeId = toTypeIdentifier(left.returnType);
  const rightTypeId = toTypeIdentifier(right.returnType);
  switch (leftTypeId) {
    case "boolean":
      if (rightTypeId !== "boolean" && rightTypeId !== "any") {
        throw new InvalidTypeError(expression.right, rightTypeId, ["boolean"]);
      }
      return {
        expression: createCallExpression(
          LOGICAL_OPERATOR_FN[operator as string],
          [left.expression, right.expression]
        ),
        returnType: { type: "boolean" },
      };
    default:
      throw new InvalidTypeError(expression.left, leftTypeId, ["boolean"]);
  }
}

function isExtendedType(targetType: ExpressionType, baseType: ExpressionType) {
  const targetTypeId = toTypeIdentifier(targetType);
  const baseTypeId = toTypeIdentifier(baseType);
  return (
    targetTypeId === "any" ||
    baseTypeId === "any" ||
    targetTypeId === baseTypeId ||
    (targetTypeId === "picklist" && baseTypeId === "string")
  );
}

type MatchTypeResult =
  | {
      matched: true;
      actual: string;
    }
  | {
      matched: false;
      actual: string;
      expected: string[];
    };

function matchArgTypes(
  argumentType: ExpressionType,
  expectedType: ExpressionType,
  templateTypes: Map<string, ExpressionType>
): MatchTypeResult {
  const argumentTypeId = toTypeIdentifier(argumentType);
  const expectedTypeId = toTypeIdentifier(expectedType);
  if (expectedType.type === "template") {
    const templateType = templateTypes.get(expectedType.ref);
    if (templateType) {
      if (!isExtendedType(templateType, argumentType)) {
        return {
          matched: false,
          actual: argumentTypeId,
          expected: [toTypeIdentifier(templateType)],
        };
      }
      if (templateType.type === "any" && argumentType.type !== "any") {
        templateTypes.set(expectedType.ref, argumentType);
      }
    } else {
      const anyOfTypeIds =
        expectedType.anyOf && expectedType.anyOf.map(toTypeIdentifier);
      if (
        anyOfTypeIds &&
        anyOfTypeIds.indexOf(argumentTypeId) < 0 &&
        argumentType.type !== "any"
      ) {
        return {
          matched: false,
          actual: argumentTypeId,
          expected: anyOfTypeIds,
        };
      }
      templateTypes.set(expectedType.ref, argumentType);
    }
    if (
      expectedType.typeParamRefs &&
      argumentType.type === "class" &&
      argumentType.typeParams
    ) {
      for (let i = 0; i < expectedType.typeParamRefs.length; i++) {
        const typeParamRef = expectedType.typeParamRefs[i];
        const argTypeParamType = argumentType.typeParams[i];
        const typeParamTemplateType = templateTypes.get(typeParamRef);
        if (typeParamTemplateType) {
          if (!isExtendedType(typeParamTemplateType, argTypeParamType)) {
            return {
              matched: false,
              actual: toTypeIdentifier(argTypeParamType),
              expected: [toTypeIdentifier(typeParamTemplateType)],
            };
          }
          if (
            typeParamTemplateType.type === "any" &&
            argTypeParamType.type !== "any"
          ) {
            templateTypes.set(typeParamRef, argTypeParamType);
          }
        } else {
          templateTypes.set(typeParamRef, argTypeParamType);
        }
      }
    }
  } else if (expectedTypeId !== "any" && expectedTypeId !== argumentTypeId) {
    return {
      matched: false,
      actual: argumentTypeId,
      expected: [expectedTypeId],
    };
  } else if (expectedType.type === "class" && argumentType.type === "class") {
    const argumentTypeParams = argumentType.typeParams ?? [];
    const expectedTypeParams = expectedType.typeParams ?? [];
    if (argumentTypeParams.length !== expectedTypeParams.length) {
      return {
        matched: false,
        actual: `${argumentTypeId}<${argumentTypeParams
          .map(() => "?")
          .join(",")}>`,
        expected: [
          `${expectedTypeId}<${expectedTypeParams.map(() => "?").join(",")}>`,
        ],
      };
    }
    let allmatched = true;
    const argumentParamTypeIds = [];
    const expectedParamTypeIds = [];
    for (let i = 0; i < expectedTypeParams.length; i++) {
      const argumentParamType = argumentTypeParams[i];
      const expectedParamType = expectedTypeParams[i];
      const result = matchArgTypes(
        argumentParamType,
        expectedParamType,
        templateTypes
      );
      argumentParamTypeIds.push(result.actual);
      if (result.matched) {
        expectedParamTypeIds.push(toTypeIdentifier(expectedParamType));
      } else {
        allmatched = false;
        expectedParamTypeIds.push(result.expected.join("|"));
      }
    }
    if (!allmatched) {
      return {
        matched: false,
        actual: `${argumentTypeId}<${argumentParamTypeIds.join(",")}>`,
        expected: [`${expectedTypeId}<${expectedParamTypeIds.join(",")}>`],
      };
    }
  }
  return { matched: true, actual: argumentTypeId };
}

function traverseCallExpression(
  expression: CallExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const { type, callee, arguments: args, ...rexpression } = expression;
  if (callee.type === "Super") {
    throw new UnexpectedError(expression, "callee cannot be a super type");
  }
  const { expression: callee_, returnType: calleeType } = traverseExpression(
    callee,
    typeDict,
    blankAsZero
  );
  if (calleeType.type !== "function") {
    throw new InvalidTypeError(callee, toTypeIdentifier(calleeType), [
      "function",
    ]);
  }
  const calleeArgTypes: FunctionArgType[] = Array.isArray(calleeType.arguments)
    ? calleeType.arguments
    : calleeType.arguments(args.length);
  const minArgLen = calleeArgTypes.filter((a) => !a.optional).length;
  const maxArgLen = calleeArgTypes.length;
  const argLen = args.length;
  if (argLen < minArgLen || maxArgLen < argLen) {
    throw new InvalidArgLengthError(callee, argLen, [minArgLen, maxArgLen]);
  }
  const args_ = [];
  const argumentTypes = [];
  const templateTypes: Map<string, ExpressionType> = new Map();
  for (const [i, arg] of args.entries()) {
    if (arg.type === "SpreadElement") {
      throw new UnexpectedError(
        expression,
        "argument cannot be a spread element type"
      );
    }
    const argument = traverseExpression(arg, typeDict, blankAsZero);
    const argumentType = argument.returnType;
    const expectedType = calleeArgTypes[i].argument;
    const result = matchArgTypes(argumentType, expectedType, templateTypes);
    if (!result.matched) {
      throw new InvalidTypeError(arg, result.actual, result.expected);
    }
    args_.push(argument.expression);
    argumentTypes.push(argumentType);
  }
  const returnType =
    calleeType.returns.type === "template"
      ? (templateTypes.get(calleeType.returns.ref) ?? { type: "any" })
      : calleeType.returns;
  return {
    expression: injectCallExpression(
      {
        type: "CallExpression",
        callee: callee_,
        arguments: args_,
        optional: false,
        ...rexpression,
      },
      argumentTypes
    ),
    returnType,
  };
}

function traverseMemberExpression(
  expression: MemberExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const { type, object, property, ...rexpression } = expression;
  if (object.type === "Super") {
    throw new UnexpectedError(expression, "object cannot be a super type");
  }
  const objectResult = traverseExpression(object, typeDict, blankAsZero);
  const objectType = objectResult.returnType;
  if (objectType.type !== "object") {
    throw new InvalidTypeError(object, toTypeIdentifier(objectType), [
      "object",
    ]);
  }
  if (property.type !== "Identifier") {
    throw new UnexpectedError(property, "property must be an identifier");
  }
  const returnType = objectType.properties[property.name];
  if (!returnType) {
    throw new UnexpectedError(
      property,
      `property ${property.name} is not found in object`
    );
  }
  return wrapValue(
    {
      type: "MemberExpression",
      object: objectResult.expression,
      property,
      ...rexpression,
    },
    returnType,
    blankAsZero
  );
}

function traverseIdentifier(
  expression: Identifier,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
) {
  const returnType = typeDict[expression.name];
  if (!returnType) {
    throw new TypeNotFoundError(expression, expression.name);
  }
  return wrapValue(expression, returnType, blankAsZero);
}

function traverseLiteral(expression: Literal): TraverseResult {
  const returnType: ExpressionType =
    typeof expression.value === "number"
      ? { type: "number" }
      : typeof expression.value === "string"
        ? { type: "string" }
        : typeof expression.value === "boolean"
          ? { type: "boolean" }
          : { type: "any" };
  return { expression, returnType };
}

/**
 *
 */
export function traverseExpression(
  expression: Expression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  switch (expression.type) {
    case "UnaryExpression":
      return traverseUnaryExpression(expression, typeDict, blankAsZero);
    case "BinaryExpression":
      return traverseBinaryExpression(expression, typeDict, blankAsZero);
    case "LogicalExpression":
      return traverseLogicalExpression(expression, typeDict, blankAsZero);
    case "CallExpression":
      return traverseCallExpression(expression, typeDict, blankAsZero);
    case "MemberExpression":
      return traverseMemberExpression(expression, typeDict, blankAsZero);
    case "Identifier":
      return traverseIdentifier(expression, typeDict, blankAsZero);
    case "Literal":
      return traverseLiteral(expression);
    default:
      throw new UnexpectedError(
        expression,
        `unexpected expression type found: ${expression.type}`
      );
  }
}

export function traverse(
  expression: Expression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const result = traverseExpression(expression, typeDict, blankAsZero);
  const { expression: expression_, returnType } = result;
  if (returnType.type === "string") {
    return {
      expression: createCallExpression("BLANKVALUE", [
        expression_,
        createLiteral(null),
      ]),
      returnType,
    };
  }
  return result;
}
