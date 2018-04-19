/* @flow */
import type {
  Expression, UnaryExpression, BinaryExpression, LogicalExpression,
  MemberExpression, CallExpression,
  Identifier, Literal,
} from 'esformula';
import type { ExpressionType, ExpressionTypeDictionary } from './types';

export type TypeCalculatedResult = {
  expression: Expression,
  returnType: ExpressionType,
};

function validationError(expression: Expression, name: string, message: string) {
  const err = new Error(message);
  err.name = name;
  if (expression.loc) {
    err.lineNumber = expression.loc.start.line;
    err.columnNumber = expression.loc.start.column;
  }
  return err;
}

function invalidArgLengthError(expression: Expression, argLen: number, argRange: [number, number]) {
  const message =
    `arguments num for the call is too small (expected ${
      argRange[0] === argRange[1] ? argRange[0] : `${argRange[0]}-${argRange[1]}`
    }, found ${argLen}`;
  return validationError(expression, 'INVALID_ARGUMENT_LENGTH', message);
}

function invalidTypeError(expression: Expression, type: string, expected: string[]) {
  const message = `expected a ${expected.map(e => `'${e}'`).join(' or ')} type value, but '${type}' type found`
  return validationError(expression, 'INVALID_TYPE', message);
}

function invalidOperatorError(expression: Expression, type: string, operator: string) {
  const message = `operator ${operator} cannot be applied to '${type}' type value`;
  return validationError(expression, 'INVALID_TYPE', message);
}

function unexpectedError(expression: Expression, message: string) {
  return validationError(expression, 'UNEXPECTED_ERROR', message);
}

function createCallExpression(name: string, args: $PropertyType<CallExpression, 'arguments'>) {
  return {
    type: 'CallExpression',
    callee: { type: 'Identifier', name },
    arguments: args,
  };
}

function calculateUnaryExpressionReturnType(
  expression: UnaryExpression,
  typeDict: ExpressionTypeDictionary,
): TypeCalculatedResult {
  const { type, operator, ...rexpression } = expression;
  const { expression: argument, returnType: argumentType } = calculateReturnType(expression.argument, typeDict);
  switch (argumentType.type) {
    case 'number':
      if (operator !== '-' && operator === '+') {
        throw invalidOperatorError(expression.argument, argumentType.type, operator);
      }
      break;
    case 'boolean':
      if (operator !== '!') {
        throw invalidOperatorError(expression.argument, argumentType.type, operator);
      }
      break;
    default:
      throw invalidTypeError(expression.argument, argumentType.type, ['boolean']);
  }
  return {
    expression: { type: 'UnaryExpression', operator, argument, ...rexpression },
    returnType: argumentType,
  };
}

function calculateBinaryExpressionReturnType(
  expression: BinaryExpression,
  typeDict: ExpressionTypeDictionary,
): TypeCalculatedResult {
  const { type, operator, ...rexpression } = expression;
  const { expression: left, returnType: leftType } = calculateReturnType(expression.left, typeDict);
  const { expression: right, returnType: rightType } = calculateReturnType(expression.right, typeDict);
  let returnType = leftType;
  switch (leftType.type) {
    case 'string':
      if (rightType.type !== 'string' && rightType.type !== 'any') {
        throw invalidTypeError(expression.right, rightType.type, ['string']);
      }
      break;
    case 'number':
      if (rightType.type !== 'number' && rightType.type !== 'currency' && rightType.type !== 'any') {
        throw invalidTypeError(expression.right, rightType.type, ['number', 'currency']);
      }
      break;
    case 'date':
      if (operator === '+') {
        if (rightType.type !== 'number' && rightType.type !== 'any') {
          throw invalidTypeError(expression.right, rightType.type, ['number']);
        }
        return {
          expression: createCallExpression('$$ADD_DATE$$', [expression.left, expression.right]),
          returnType: { type: 'date' },
        };
      } else if (operator === '-') {
        if (rightType.type === 'number') {
          return {
            expression: createCallExpression('$$SUBTRACT_DATE$$', [expression.left, expression.right]),
            returnType: { type: 'date' },
          };
        } else if (rightType.type === 'date') {
          return {
            expression: createCallExpression('$$DIFF_DATE$$', [expression.left, expression.right]),
            returnType: { type: 'number', precision: -1, scale: -1 },
          };
        } else {
          throw invalidTypeError(expression.right, rightType.type, ['number', 'date']);
        }
      } else {
        throw invalidOperatorError(expression.left, leftType.type, operator);
      }
    case 'datetime':
      if (operator === '+') {
        if (rightType.type !== 'number' && rightType.type !== 'any') {
          throw invalidTypeError(expression.right, rightType.type, ['number']);
        }
        return {
          expression: createCallExpression('$$ADD_DATETIME$$', [expression.left, expression.right]),
          returnType: { type: 'datetime' },
        };
      } else if (operator === '-') {
        if (rightType.type === 'number') {
          return {
            expression: createCallExpression('$$SUBTRACT_DATETIME$$', [expression.left, expression.right]),
            returnType: { type: 'datetime' },
          };
        } else if (rightType.type === 'datetime') {
          return {
            expression: createCallExpression('$$DIFF_DATETIME$$', [expression.left, expression.right]),
            returnType: { type: 'number', precision: -1, scale: -1 },
          };
        } else {
          throw invalidTypeError(expression.right, rightType.type, ['number', 'datetime']);
        }
      } else {
        throw invalidOperatorError(expression.left, leftType.type, operator);
      }
    default:
      throw invalidTypeError(expression.left, leftType.type, ['string', 'number', 'date', 'datetime']);
  }
  return {
    expression: { type: 'BinaryExpression', operator, left, right, ...rexpression },
    returnType: leftType,
  };
}

function calculateLogicalExpressionReturnType(
  expression: LogicalExpression,
  typeDict: ExpressionTypeDictionary,
): TypeCalculatedResult {
  const { type, operator, ...rexpression } = expression;
  const { expression: left, returnType: leftType } = calculateReturnType(expression.left, typeDict);
  const { expression: right, returnType: rightType } = calculateReturnType(expression.right, typeDict);
  switch (leftType.type) {
    case 'boolean':
      if (rightType.type !== 'boolean' && rightType.type !== 'any') {
        throw invalidTypeError(expression.right, rightType.type, ['string']);
      }
      break;
    default:
      throw invalidTypeError(expression.left, leftType.type, ['boolean']);
  }
  return {
    expression: { type: 'LogicalExpression', operator, left, right, ...rexpression },
    returnType: leftType,
  };
}

function calculateCallExpressionReturnType(
  expression: CallExpression,
  typeDict: ExpressionTypeDictionary,
): TypeCalculatedResult {
  const { type, callee, arguments: args, ...rexpression } = expression;
  if (callee.type === 'Super') {
    throw unexpectedError(expression, 'callee cannot be a super type');
  }
  const { expression: callee_, returnType: calleeType } = calculateReturnType(callee, typeDict);
  if (calleeType.type !== 'function') {
    throw invalidTypeError(callee, calleeType.type, ['function']);
  }
  const minArgLen = calleeType.arguments.filter(a => !a.optional).length;
  const maxArgLen = calleeType.arguments.length;
  const argLen = args.length;
  if (argLen < minArgLen || maxArgLen < argLen) {
    throw invalidArgLengthError(callee, argLen, [minArgLen, maxArgLen]);
  }
  const args_ = [];
  for (const [i, arg] of args.entries()) {
    if (arg.type === 'SpreadElement') {
      throw unexpectedError(expression, 'argument cannot be a spread element type');
    }
    const { expression: arg_, returnType } = calculateReturnType(arg, typeDict);
    const expectedArgType = calleeType.arguments[i].argument.type;
    if (expectedArgType !== 'any' && returnType.type !== expectedArgType) {
      throw invalidTypeError(arg, returnType.type, [expectedArgType]);
    }
    args_.push(arg_);
  }
  return {
    expression: {
      type: 'CallExpression',
      callee: callee_,
      arguments: args_,
      ...rexpression,
    },
    returnType: calleeType.returns,
  };
}

function calculateIdentifierReturnType(
  expression: Identifier,
  typeDict: ExpressionTypeDictionary,
) {
  const returnType = typeDict[expression.name];
  if (!returnType) {
    throw new Error(`identifier type information is not found: ${expression.name}`);
  }
  return { expression, returnType };
}

function calculateLiteralReturnType(expression: Literal) {
  const returnType =
    typeof expression.value === 'number' ?
      { type: 'number', precision: -1, scale: -1 } :
    typeof expression.value === 'string' ?
      { type: 'string' } :
    typeof expression.value === 'boolean' ?
      { type: 'boolean' } :
      { type: 'any' }
  return { expression, returnType };
}

/**
 * 
 */
export function calculateReturnType(expression: Expression, typeDict: ExpressionTypeDictionary): TypeCalculatedResult {
  switch (expression.type) {
    case 'UnaryExpression':
      return calculateUnaryExpressionReturnType(expression, typeDict);
    case 'BinaryExpression':
      return calculateBinaryExpressionReturnType(expression, typeDict);
    case 'LogicalExpression':
      return calculateLogicalExpressionReturnType(expression, typeDict);
    case 'CallExpression':
      return calculateCallExpressionReturnType(expression, typeDict);
    case 'Identifier':
      return calculateIdentifierReturnType(expression, typeDict);
    case 'Literal':
      return calculateLiteralReturnType(expression);
    default:
      throw new Error(`error on caluculating field type: ${expression.type} is not supported`);
  }
}
