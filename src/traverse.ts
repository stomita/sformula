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
  } else if (returnType.type === "object") {
    altValue = {
      type: "ObjectExpression",
      properties: [],
    };
  } else if (returnType.type !== "function") {
    altValue = createLiteral(null);
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
  if (operator !== "-" && operator !== "+" && operator !== "!") {
    throw new InvalidOperatorError(
      expression.argument,
      argumentType.type,
      operator
    );
  }
  switch (argumentType.type) {
    case "number":
      if (operator !== "-" && operator === "+") {
        throw new InvalidOperatorError(
          expression.argument,
          argumentType.type,
          operator
        );
      }
      break;
    case "boolean":
      if (operator !== "!") {
        throw new InvalidOperatorError(
          expression.argument,
          argumentType.type,
          operator
        );
      }
      break;
    default:
      throw new InvalidTypeError(expression.argument, argumentType.type, [
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
  const rightType = right.returnType.type;
  if (rightType !== "string" && rightType !== "any") {
    throw new InvalidTypeError(expression.right, rightType, ["string"]);
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
        left.returnType.type,
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

function traverseNumberBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightType = right.returnType;
  if (rightType.type !== "number" && rightType.type !== "any") {
    throw new InvalidTypeError(expression.right, rightType.type, ["number"]);
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
        left.returnType.type,
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
        left.returnType.type,
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
  const rightType = right.returnType.type;
  switch (operator) {
    case "+":
      if (rightType !== "number" && rightType !== "any") {
        throw new InvalidTypeError(expression.right, rightType, ["number"]);
      }
      return {
        expression: createCallExpression("$$ADD_DATE$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "date" },
      };
    case "-":
      if (rightType === "number") {
        return {
          expression: createCallExpression("$$SUBTRACT_DATE$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "date" },
        };
      } else if (rightType === "date") {
        return {
          expression: createCallExpression("$$DIFF_DATE$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "number" },
        };
      } else {
        throw new InvalidTypeError(expression.right, rightType, [
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
      if (rightType !== "date") {
        throw new InvalidTypeError(expression.right, rightType, ["date"]);
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
        left.returnType.type,
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
  const rightType = right.returnType.type;
  switch (operator) {
    case "+":
      if (rightType !== "number" && rightType !== "any") {
        throw new InvalidTypeError(expression.right, rightType, ["number"]);
      }
      return {
        expression: createCallExpression("$$ADD_DATETIME$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "datetime" },
      };
    case "-":
      if (rightType === "number") {
        return {
          expression: createCallExpression("$$SUBTRACT_DATETIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "datetime" },
        };
      } else if (rightType === "datetime") {
        return {
          expression: createCallExpression("$$DIFF_DATETIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "number" },
        };
      } else {
        throw new InvalidTypeError(expression.right, rightType, [
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
      if (rightType !== "datetime") {
        throw new InvalidTypeError(expression.right, rightType, ["datetime"]);
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
        left.returnType.type,
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
  const rightType = right.returnType.type;
  switch (operator) {
    case "+":
      if (rightType !== "number" && rightType !== "any") {
        throw new InvalidTypeError(expression.right, rightType, ["number"]);
      }
      return {
        expression: createCallExpression("$$ADD_TIME$$", [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "time" },
      };
    case "-":
      if (rightType === "number") {
        return {
          expression: createCallExpression("$$SUBTRACT_TIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "time" },
        };
      } else if (rightType === "time") {
        return {
          expression: createCallExpression("$$DIFF_TIME$$", [
            left.expression,
            right.expression,
          ]),
          returnType: { type: "number" },
        };
      } else {
        throw new InvalidTypeError(expression.right, rightType, [
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
      if (rightType !== "time") {
        throw new InvalidTypeError(expression.right, rightType, ["time"]);
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
        left.returnType.type,
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
  const leftType = left.returnType.type;
  switch (leftType) {
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
      throw new InvalidTypeError(expression.left, leftType, [
        "string",
        "number",
        "date",
        "datetime",
        "time",
      ]);
  }
}

const LOGICAL_OPERATOR_FN = {
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
  const leftType = left.returnType.type;
  const rightType = right.returnType.type;
  switch (leftType) {
    case "boolean":
      if (rightType !== "boolean" && rightType !== "any") {
        throw new InvalidTypeError(expression.right, rightType, ["boolean"]);
      }
      return {
        expression: createCallExpression(LOGICAL_OPERATOR_FN[operator], [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    default:
      throw new InvalidTypeError(expression.left, leftType, ["boolean"]);
  }
}

function isExtendedType(targetType: ExpressionType, baseType: ExpressionType) {
  return (
    targetType.type === "any" ||
    baseType.type === "any" ||
    targetType.type === baseType.type ||
    (targetType.type === "picklist" && baseType.type === "string")
  );
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
    throw new InvalidTypeError(callee, calleeType.type, ["function"]);
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
  const templateTypes: { [name: string]: ExpressionType | undefined } = {};
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
    if (expectedType.type === "template") {
      const templateType = templateTypes[expectedType.ref];
      if (templateType) {
        if (!isExtendedType(templateType, argumentType)) {
          throw new InvalidTypeError(arg, argumentType.type, [
            templateType.type,
          ]);
        }
        if (templateType.type === "any" && argumentType.type !== "any") {
          templateTypes[expectedType.ref] = argumentType;
        }
      } else {
        const anyOfTypes =
          expectedType.anyOf && expectedType.anyOf.map((t) => t.type);
        if (
          anyOfTypes &&
          anyOfTypes.indexOf(argumentType.type) < 0 &&
          argumentType.type !== "any"
        ) {
          throw new InvalidTypeError(arg, argumentType.type, anyOfTypes);
        }
        templateTypes[expectedType.ref] = argumentType;
      }
    } else if (
      expectedType.type !== "any" &&
      argumentType.type !== expectedType.type
    ) {
      throw new InvalidTypeError(arg, argumentType.type, [expectedType.type]);
    }
    args_.push(argument.expression);
    argumentTypes.push(argumentType);
  }
  const returnType =
    calleeType.returns.type === "template"
      ? templateTypes[calleeType.returns.ref] || { type: "any" }
      : calleeType.returns;
  return {
    expression: injectCallExpression(
      {
        type: "CallExpression",
        callee: callee_,
        arguments: args_,
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
    throw new InvalidTypeError(object, objectType.type, ["object"]);
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
  return nullValue(
    {
      expression: {
        type: "MemberExpression",
        object: objectResult.expression,
        property,
        ...rexpression,
      },
      returnType,
    },
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
