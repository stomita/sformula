/* @flow */
import type {
  Expression, UnaryExpression, BinaryExpression, LogicalExpression,
  MemberExpression, CallExpression,
  ObjectExpression, Identifier, Literal,
} from 'esformula';
import type { ExpressionType, ExpressionTypeDictionary } from './types';

export type TraverseResult = {
  expression: Expression,
  returnType: ExpressionType,
};

export function validationError(expression: Expression, name: string, message: string) {
  const err = new Error(message);
  err.name = name;
  if (expression.loc) {
    err.lineNumber = expression.loc.start.line;
    err.columnNumber = expression.loc.start.column;
  }
  return err;
}

export function invalidArgLengthError(expression: Expression, argLen: number, argRange: [number, number]) {
  const message =
    `arguments num for the call is too small (expected ${
      argRange[0] === argRange[1] ? argRange[0] : `${argRange[0]}-${argRange[1]}`
    }, found ${argLen})`;
  return validationError(expression, 'INVALID_ARGUMENT_LENGTH', message);
}

export function invalidTypeError(expression: Expression, type: string, expected: string[]) {
  const message = `expected a ${expected.map(e => `'${e}'`).join(' or ')} type value, but '${type}' type found`
  return validationError(expression, 'INVALID_TYPE', message);
}

export function invalidOperatorError(expression: Expression, type: string, operator: string) {
  const message = `operator ${operator} cannot be applied to '${type}' type value`;
  return validationError(expression, 'INVALID_OPERATOR', message);
}

export function unexpectedError(expression: Expression, message: string) {
  return validationError(expression, 'UNEXPECTED_ERROR', message);
}

function createCallExpression(name: string, args: $PropertyType<CallExpression, 'arguments'>) {
  return {
    type: 'CallExpression',
    callee: { type: 'Identifier', name },
    arguments: args,
  };
}

function createLiteral(value: string | number | boolean | null): Literal {
  return {
    type: 'Literal',
    value,
    raw: String(value),
  };
}

function nullValue(result: TraverseResult, blankAsZero: boolean) {
  const { expression, returnType } = result;
  let nullValue: Literal | ObjectExpression;
  if (returnType.type === 'string') {
    nullValue = createLiteral('');
  } else if (returnType.type === 'boolean') {
    nullValue = createLiteral(false);
  } else if (returnType.type === 'number' || returnType.type === 'currency') {
    nullValue = createLiteral(blankAsZero ? 0 : null);
  } else if (returnType.type === 'object') {
    nullValue = {
      type: 'ObjectExpression',
      properties: [],
    };
  } else {
    nullValue = createLiteral(null);
  }
  return {
    expression: createCallExpression('NULLVALUE', [ expression, nullValue ]),
    returnType,
  };
}

function traverseUnaryExpression(
  expression: UnaryExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  const { type, operator, ...rexpression } = expression;
  const { expression: argument, returnType: argumentType } =
    traverseExpression(expression.argument, typeDict, blankAsZero);
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

function traverseStringBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult,
): TraverseResult {
  const { type, operator, ...rexpression } = expression;
  const rightType = right.returnType.type;
  if (rightType !== 'string' && rightType !== 'any') {
    throw invalidTypeError(expression.right, rightType, ['string']);
  }
  switch (operator) {
    case '+':
      return {
        expression: createCallExpression('$$CONCAT_STRING$$', [left.expression, right.expression]),
        returnType: { type: 'string' },
      };
    case '==':
    case '!=':
    case '===':
    case '!==':
      return {
        expression: {
          type: 'BinaryExpression',
          operator,
          ...rexpression,
          left: left.expression,
          right: right.expression,
        },
        returnType: { type: 'boolean' },
      };
    default:
      throw invalidOperatorError(expression.left, left.returnType.type, operator);
  }
}

const NUMBER_OPERATOR_FN = {
  '+': '$$ADD_NUMBER$$',
  '-': '$$SUBTRACT_NUMBER$$',
  '*': '$$MULTIPLY_NUMBER$$',
  '/': '$$DIVIDE_NUMBER$$',
  '**': '$$POWER_NUMBER$$',
  '<': '$$LT_NUMBER$$',
  '>': '$$GT_NUMBER$$',
  '<=': '$$LTE_NUMBER$$',
  '>=': '$$GTE_NUMBER$$',
  '==': '$$EQ_NUMBER$$',
  '!=': '$$NEQ_NUMBER$$',
  '===': '$$EQ_NUMBER$$',
  '!==': '$$NEQ_NUMBER$$',
};

function traverseNumberBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult,
): TraverseResult {
  const { type, operator, ...rexpression } = expression;
  const rightType = right.returnType.type;
  if (rightType !== 'number' && rightType !== 'currency' && rightType !== 'any') {
    throw invalidTypeError(expression.right, rightType, ['number', 'currency']);
  }
  switch (operator) {
    case '+':
    case '-':
    case '*':
    case '/':
    case '**':
      return {
        expression: createCallExpression(NUMBER_OPERATOR_FN[operator], [left.expression, right.expression]),
        returnType: left.returnType,
      };
    case '<':
    case '>':
    case '<=':
    case '>=':
    case '==':
    case '!=':
    case '===':
    case '!==':
      return {
        expression: createCallExpression(NUMBER_OPERATOR_FN[operator], [left.expression, right.expression]),
        returnType: { type: 'boolean' },
      };
    default:
      throw invalidOperatorError(expression.left, left.returnType.type, operator);
  }
}

const DATE_OPERATOR_FN = {
  '<': '$$LT_DATE$$',
  '<=': '$$LTE_DATE$$',
  '>': '$$GT_DATE$$',
  '>=': '$$GTE_DATE$$',
  '==': '$$EQ_DATE$$',
  '!=': '$$NEQ_DATE$$',
  '===': '$$EQ_DATE$$',
  '!==': '$$NEQ_DATE$$',
};


function traverseDateBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult,
): TraverseResult {
  const { type, operator, ...rexpression } = expression;
  const rightType = right.returnType.type;
  switch (operator) {
    case '+':
      if (rightType !== 'number' && rightType !== 'any') {
        throw invalidTypeError(expression.right, rightType, ['number']);
      }
      return {
        expression: createCallExpression('$$ADD_DATE$$', [left.expression, right.expression]),
        returnType: { type: 'date' },
      };
    case '-':
      if (rightType === 'number') {
        return {
          expression: createCallExpression('$$SUBTRACT_DATE$$', [left.expression, right.expression]),
          returnType: { type: 'date' },
        };
      } else if (rightType === 'date') {
        return {
          expression: createCallExpression('$$DIFF_DATE$$', [left.expression, right.expression]),
          returnType: { type: 'number' },
        };
      } else {
        throw invalidTypeError(expression.right, rightType, ['number', 'date']);
      }
    case '<':
    case '>':
    case '>=':
    case '<=':
    case '==':
    case '!=':
    case '===':
    case '!==':
      if (rightType !== 'date') {
        throw invalidTypeError(expression.right, rightType, ['date']);
      }
      const name = DATE_OPERATOR_FN[operator];
      return {
        expression: createCallExpression(name, [left.expression, right.expression]),
        returnType: { type: 'boolean' },
      };
    default:
      throw invalidOperatorError(expression.left, left.returnType.type, operator);
  }
}

const DATETIME_OPERATOR_FN = {
  '<': '$$LT_DATETIME$$',
  '<=': '$$LTE_DATETIME$$',
  '>': '$$GT_DATETIME$$',
  '>=': '$$GTE_DATETIME$$',
  '==': '$$EQ_DATETIME$$',
  '!=': '$$NEQ_DATETIME$$',
  '===': '$$EQ_DATETIME$$',
  '!==': '$$NEQ_DATETIME$$',
};

function traverseDatetimeBinaryExpression(
  expression: BinaryExpression,
  left: TraverseResult,
  right: TraverseResult,
): TraverseResult {
  const { type, operator, ...rexpression } = expression;
  const rightType = right.returnType.type;
  switch (operator) {
    case '+':
      if (rightType !== 'number' && rightType !== 'any') {
        throw invalidTypeError(expression.right, rightType, ['number']);
      }
      return {
        expression: createCallExpression('$$ADD_DATETIME$$', [left.expression, right.expression]),
        returnType: { type: 'datetime' },
      };
    case '-':
      if (rightType === 'number') {
        return {
          expression: createCallExpression('$$SUBTRACT_DATETIME$$', [left.expression, right.expression]),
          returnType: { type: 'datetime' },
        };
      } else if (rightType === 'datetime') {
        return {
          expression: createCallExpression('$$DIFF_DATETIME$$', [left.expression, right.expression]),
          returnType: { type: 'number' },
        };
      } else {
        throw invalidTypeError(expression.right, rightType, ['number', 'datetime']);
      }
    case '<':
    case '>':
    case '>=':
    case '<=':
    case '===':
    case '!==':
      return {
        expression: {
          type: 'BinaryExpression',
          operator,
          ...rexpression,
          left: left.expression,
          right: right.expression,
        },
        returnType: { type: 'boolean' },
      };
    default:
      throw invalidOperatorError(expression.left, left.returnType.type, operator);
  }
}


function traverseBinaryExpression(
  expression: BinaryExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  const left = traverseExpression(expression.left, typeDict, blankAsZero);
  const right = traverseExpression(expression.right, typeDict, blankAsZero);
  const leftType = left.returnType.type;
  switch (leftType) {
    case 'string':
      return traverseStringBinaryExpression(expression, left, right);
    case 'number':
      return traverseNumberBinaryExpression(expression, left, right);
    case 'date':
      return traverseDateBinaryExpression(expression, left, right);
    case 'datetime':
      return traverseDatetimeBinaryExpression(expression, left, right);
    default:
      throw invalidTypeError(expression.left, leftType, ['string', 'number', 'date', 'datetime']);
  }
}

function traverseLogicalExpression(
  expression: LogicalExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  const { type, operator, ...rexpression } = expression;
  const left = traverseExpression(expression.left, typeDict, blankAsZero);
  const right = traverseExpression(expression.right, typeDict, blankAsZero);
  const leftType = left.returnType.type;
  const rightType = right.returnType.type;
  switch (leftType) {
    case 'boolean':
      if (rightType !== 'boolean' && rightType !== 'any') {
        throw invalidTypeError(expression.right, rightType, ['boolean']);
      }
      return {
        expression: {
          type: 'LogicalExpression',
          operator,
          ...rexpression,
          left: left.expression,
          right: right.expression,
        },
        returnType: left.returnType,
      };
    default:
      throw invalidTypeError(expression.left, leftType, ['boolean']);
  }
}

function traverseCallExpression(
  expression: CallExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  const { type, callee, arguments: args, ...rexpression } = expression;
  if (callee.type === 'Super') {
    throw unexpectedError(expression, 'callee cannot be a super type');
  }
  const { expression: callee_, returnType: calleeType } = traverseExpression(callee, typeDict, blankAsZero);
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
  const templateTypes: { [name: string]: ?ExpressionType } = {};
  for (const [i, arg] of args.entries()) {
    if (arg.type === 'SpreadElement') {
      throw unexpectedError(expression, 'argument cannot be a spread element type');
    }
    const argument = traverseExpression(arg, typeDict, blankAsZero);
    const argumentType = argument.returnType;
    const expectedType = calleeType.arguments[i].argument;
    if (expectedType.type === 'template') {
      let templateType = templateTypes[expectedType.ref];
      if (templateType) {
        if (templateType.type !== 'any' && argumentType.type !== templateType.type) {
          throw invalidTypeError(arg, argumentType.type, [templateType.type]);
        }
      } else {
        templateTypes[expectedType.ref] = argumentType;
      }
    } else if (expectedType.type !== 'any' && argumentType.type !== expectedType.type) {
      throw invalidTypeError(arg, argumentType.type, [expectedType.type]);
    }
    args_.push(argument.expression);
  }
  const returnType = (
    calleeType.returns.type === 'template' ?
    templateTypes[calleeType.returns.ref] || { type: 'any' } :
    calleeType.returns
  );
  return {
    expression: {
      type: 'CallExpression',
      callee: callee_,
      arguments: args_,
      ...rexpression,
    },
    returnType,
  };
}

function traverseMemberExpression(
  expression: MemberExpression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  const { type, object, property, ...rexpression } = expression;
  if (object.type === 'Super') {
    throw unexpectedError(expression, 'object cannot be a super type');
  }
  const objectResult = traverseExpression(object, typeDict, blankAsZero);
  const objectType = objectResult.returnType;
  if (objectType.type !== 'object') {
    throw invalidTypeError(object, objectType.type, ['object']);
  }
  if (property.type !== 'Identifier') {
    throw unexpectedError(property, 'property must be an identifier');
  }
  const returnType = objectType.properties[property.name];
  if (!returnType) {
    throw unexpectedError(property, `property ${property.name} is not found in object`);
  }
  return nullValue({
    expression: {
      type: 'MemberExpression',
      object: objectResult.expression,
      property,
      ...rexpression,
    },
    returnType,
  }, blankAsZero);
}

function traverseIdentifier(
  expression: Identifier,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
) {
  const returnType = typeDict[expression.name];
  if (!returnType) {
    throw new Error(`identifier type information is not found: ${expression.name}`);
  }
  return nullValue({ expression, returnType }, blankAsZero);
}

function traverseLiteral(expression: Literal) {
  const returnType =
    typeof expression.value === 'number' ?
      { type: 'number' } :
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
export function traverseExpression(
  expression: Expression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  switch (expression.type) {
    case 'UnaryExpression':
      return traverseUnaryExpression(expression, typeDict, blankAsZero);
    case 'BinaryExpression':
      return traverseBinaryExpression(expression, typeDict, blankAsZero);
    case 'LogicalExpression':
      return traverseLogicalExpression(expression, typeDict, blankAsZero);
    case 'CallExpression':
      return traverseCallExpression(expression, typeDict, blankAsZero);
    case 'MemberExpression':
      return traverseMemberExpression(expression, typeDict, blankAsZero);
    case 'Identifier':
      return traverseIdentifier(expression, typeDict, blankAsZero);
    case 'Literal':
      return traverseLiteral(expression);
    default:
      throw unexpectedError(expression, `unexpected expression type found: ${expression.type}`);
  }
}

export function traverse(
  expression: Expression,
  typeDict: ExpressionTypeDictionary,
  blankAsZero: boolean,
): TraverseResult {
  const result = traverseExpression(expression, typeDict, blankAsZero);
  if (result.expression.type === 'CallExpression') {
    const { callee } = result.expression; 
    if (callee.type === 'Identifier' && callee.name === 'NULLVALUE') {
      return result;
    }
  }
  return nullValue(result, false);
}

/**
 * 
 */
export function isCompatibleType(srcType: string, dstType: string) {
  if (srcType === dstType) {
    return true;
  }
  if (srcType === 'datetime' && dstType === 'date') {
    return true;
  }
  return false;
}