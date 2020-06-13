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
import type {
  ExpressionType,
  ExpressionTypeDictionary,
  FunctionArgType,
} from "./types";

export type TraverseResult = {
  expression: Expression;
  returnType: ExpressionType;
};

export function validationError(
  expression: Expression,
  name: string,
  message: string
) {
  const err = new Error(message);
  err.name = name;
  if (expression.loc) {
    (err as any).lineNumber = expression.loc.start.line;
    (err as any).columnNumber = expression.loc.start.column;
  }
  return err;
}

export function invalidArgLengthError(
  expression: Expression,
  argLen: number,
  argRange: [number, number]
) {
  const message = `arguments num for the call is too small (expected ${
    argRange[0] === argRange[1] ? argRange[0] : `${argRange[0]}-${argRange[1]}`
  }, found ${argLen})`;
  return validationError(expression, "INVALID_ARGUMENT_LENGTH", message);
}

export function invalidTypeError(
  expression: Expression,
  type: string,
  expected: string[]
) {
  const message = `expected a ${expected
    .map((e) => `'${e}'`)
    .join(" or ")} type value, but '${type}' type found`;
  return validationError(expression, "INVALID_TYPE", message);
}

export function invalidOperatorError(
  expression: Expression,
  type: string,
  operator: string
) {
  const message = `operator ${operator} cannot be applied to '${type}' type value`;
  return validationError(expression, "INVALID_OPERATOR", message);
}

export function unexpectedError(expression: Expression, message: string) {
  return validationError(expression, "UNEXPECTED_ERROR", message);
}

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
          createLiteral(argType.precision == null ? null : argType.precision),
          createLiteral(argType.scale == null ? null : argType.scale),
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
      case "MAX":
      case "MIN":
      case "MOD":
      case "CEILING":
      case "FLOOR":
      case "ROUND":
      case "MCEILING":
      case "MFLOOR":
        return annotateArgumentTypes(callee.name, args, argumentTypes);
      default:
        break;
    }
  }
  return expression;
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
    throw invalidOperatorError(
      expression.argument,
      argumentType.type,
      operator
    );
  }
  switch (argumentType.type) {
    case "number":
      if (operator !== "-" && operator === "+") {
        throw invalidOperatorError(
          expression.argument,
          argumentType.type,
          operator
        );
      }
      break;
    case "boolean":
      if (operator !== "!") {
        throw invalidOperatorError(
          expression.argument,
          argumentType.type,
          operator
        );
      }
      break;
    default:
      throw invalidTypeError(expression.argument, argumentType.type, [
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
    throw invalidTypeError(expression.right, rightType, ["string"]);
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
      throw invalidOperatorError(
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

function convertPercentToNumber(
  expression: Expression,
  precision?: number,
  scale?: number
): TraverseResult {
  return {
    expression: createCallExpression("$$MULTIPLY_NUMBER$$", [
      createLiteral(0.01),
      expression,
    ]),
    returnType: { type: "number", precision, scale },
  };
}

function traverseNumberBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { operator } = expression;
  const rightType = right.returnType;
  if (rightType.type === "percent") {
    const numRight = convertPercentToNumber(
      right.expression,
      rightType.precision,
      rightType.scale
    );
    return traverseNumberBinaryExpression(expression, left, numRight);
  }
  if (
    rightType.type !== "number" &&
    rightType.type !== "currency" &&
    rightType.type !== "any"
  ) {
    throw invalidTypeError(expression.right, rightType.type, [
      "number",
      "currency",
    ]);
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
      throw invalidOperatorError(
        expression.left,
        left.returnType.type,
        operator
      );
  }
}

function traversePercentBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult
): TraverseResult {
  const { returnType: leftType } = left;
  if (leftType.type !== "percent") {
    throw unexpectedError(expression, "could not be reached here");
  }
  const numLeft = convertPercentToNumber(
    left.expression,
    leftType.precision,
    leftType.scale
  );
  return traverseNumberBinaryExpression(expression, numLeft, right);
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
        throw invalidTypeError(expression.right, rightType, ["number"]);
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
        throw invalidTypeError(expression.right, rightType, ["number", "date"]);
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
        throw invalidTypeError(expression.right, rightType, ["date"]);
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
      throw invalidOperatorError(
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
        throw invalidTypeError(expression.right, rightType, ["number"]);
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
        throw invalidTypeError(expression.right, rightType, [
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
        throw invalidTypeError(expression.right, rightType, ["datetime"]);
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
      throw invalidOperatorError(
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
        throw invalidTypeError(expression.right, rightType, ["number"]);
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
        throw invalidTypeError(expression.right, rightType, ["number", "time"]);
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
        throw invalidTypeError(expression.right, rightType, ["time"]);
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
      throw invalidOperatorError(
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
    case "currency":
      return traverseNumberBinaryExpression(expression, left, right);
    case "percent":
      return traversePercentBinaryExpression(expression, left, right);
    case "date":
      return traverseDateBinaryExpression(expression, left, right);
    case "datetime":
      return traverseDatetimeBinaryExpression(expression, left, right);
    case "time":
      return traverseTimeBinaryExpression(expression, left, right);
    default:
      throw invalidTypeError(expression.left, leftType, [
        "string",
        "number",
        "date",
        "datetime",
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
        throw invalidTypeError(expression.right, rightType, ["boolean"]);
      }
      return {
        expression: createCallExpression(LOGICAL_OPERATOR_FN[operator], [
          left.expression,
          right.expression,
        ]),
        returnType: { type: "boolean" },
      };
    default:
      throw invalidTypeError(expression.left, leftType, ["boolean"]);
  }
}

function traverseCallExpression(
  expression: CallExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean
): TraverseResult {
  const { type, callee, arguments: args, ...rexpression } = expression;
  if (callee.type === "Super") {
    throw unexpectedError(expression, "callee cannot be a super type");
  }
  const { expression: callee_, returnType: calleeType } = traverseExpression(
    callee,
    typeDict,
    blankAsZero
  );
  if (calleeType.type !== "function") {
    throw invalidTypeError(callee, calleeType.type, ["function"]);
  }
  const calleeArgTypes: FunctionArgType[] = Array.isArray(calleeType.arguments)
    ? calleeType.arguments
    : calleeType.arguments(args.length);
  const minArgLen = calleeArgTypes.filter((a) => !a.optional).length;
  const maxArgLen = calleeArgTypes.length;
  const argLen = args.length;
  if (argLen < minArgLen || maxArgLen < argLen) {
    throw invalidArgLengthError(callee, argLen, [minArgLen, maxArgLen]);
  }
  const args_ = [];
  const argumentTypes = [];
  const templateTypes: { [name: string]: ExpressionType | undefined } = {};
  for (const [i, arg] of args.entries()) {
    if (arg.type === "SpreadElement") {
      throw unexpectedError(
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
        if (
          templateType.type !== "any" &&
          argumentType.type !== "any" &&
          argumentType.type !== templateType.type
        ) {
          throw invalidTypeError(arg, argumentType.type, [templateType.type]);
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
          throw invalidTypeError(arg, argumentType.type, anyOfTypes);
        }
        templateTypes[expectedType.ref] = argumentType;
      }
    } else if (
      expectedType.type !== "any" &&
      argumentType.type !== expectedType.type
    ) {
      throw invalidTypeError(arg, argumentType.type, [expectedType.type]);
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
    throw unexpectedError(expression, "object cannot be a super type");
  }
  const objectResult = traverseExpression(object, typeDict, blankAsZero);
  const objectType = objectResult.returnType;
  if (objectType.type !== "object") {
    throw invalidTypeError(object, objectType.type, ["object"]);
  }
  if (property.type !== "Identifier") {
    throw unexpectedError(property, "property must be an identifier");
  }
  const returnType = objectType.properties[property.name];
  if (!returnType) {
    throw unexpectedError(
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
    throw new Error(
      `identifier type information is not found: ${expression.name}`
    );
  }
  return nullValue({ expression, returnType }, blankAsZero);
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
      throw unexpectedError(
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
