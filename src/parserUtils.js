/* @flow */
import type {
  Program, Expression, ExpressionStatement,
  UnaryExpression, UnaryOperator,
  BinaryExpression, BinaryOperator,
  LogicalExpression, LogicalOperator,
  CallExpression,
  MemberExpression,
  Identifier, Literal,
  SpreadElement,
} from 'acorn';

export function isReserved(id: string) {
  return /^(TRUE|FALSE|NULL)$/i.test(id);
}

export function concatinateLogicalExpressions(head: Expression, tail: Array<[BinaryOperator, Expression]>): Expression {
  if (tail.length === 0) { return head; }
  const [[op, tail1], ...rtail] = tail;
  const expr = createLogicalExpression(op, head, tail1);
  return concatinateLogicalExpressions(expr, rtail);
}

export function concatinateBinaryExpressions(head: Expression, tail: Array<[BinaryOperator, Expression]>): Expression {
  if (tail.length === 0) { return head; }
  const [[op, tail1], ...rtail] = tail;
  const expr = createBinaryExpression(op, head, tail1);
  return concatinateBinaryExpressions(expr, rtail);
}

export function createUnaryExpression(operator: UnaryOperator, argument: Expression): UnaryExpression {
  return {
    type: 'UnaryExpression',
    operator,
    argument,
    prefix: true,
  };
}

export function createBinaryExpression(operator: BinaryOperator, left: Expression, right: Expression): BinaryExpression {
  return {
    type: 'BinaryExpression',
    operator,
    left,
    right,
  };
}

export function createLogicalExpression(operator: LogicalOperator, left: Expression, right: Expression): LogicalExpression {
  return {
    type: 'LogicalExpression',
    operator,
    left,
    right,
  };
}

export function createCallExpression(callee: Identifier, args: Expression[]): CallExpression {
  return {
    type: 'CallExpression',
    callee,
    arguments: ((args: any): Array<Expression | SpreadElement>),
  };
}

export function createFieldExpression(fieldPaths: Identifier[]): Identifier | MemberExpression {
  if (fieldPaths.length < 2) {
    return fieldPaths[0];
  }
  const [ object, property, ...fpaths ] = fieldPaths;
  let expression: MemberExpression = {
    type: 'MemberExpression',
    computed: false,
    object,
    property,
  };
  for (const field of fpaths) {
    expression = {
      type: 'MemberExpression',
      computed: false,
      object: expression,
      property: field,
    }
  }
  return expression;
}

export function createIdentifier(name: string): Identifier {
  return {
    type: 'Identifier',
    name,
  };
}

export function createNumberLiteral(n: string): Literal {
  const value = parseFloat(n);
  return {
    type: 'Literal',
    value,
    raw: n,
  };
}

export function createStringLiteral(s: string) {
  return {
    type: 'Literal',
    value: s,
    raw: s,
  };
}

export function createBooleanLiteral(b: string) {
  const value = b.toUpperCase() === "TRUE";
  return {
    type: 'Literal',
    value,
    raw: b,
  };
}

export function createNullLiteral(n: string) {
  return {
    type: 'Literal',
    value: null,
    raw: n,
  };
}
