import type {
  Expression,
  UnaryExpression,
  UnaryOperator,
  BinaryExpression,
  BinaryOperator,
  LogicalExpression,
  LogicalOperator,
  CallExpression,
  MemberExpression,
  Identifier,
  Literal,
  SourceLocation,
} from "esformula";

/* ------------------------------------------------------------------------- */

let _bracketIdentifierHolder: string | undefined = undefined;

export function setBracketIdentifierHolder(name: string) {
  _bracketIdentifierHolder = name;
}

export function resetBracketIdentifierHolder() {
  _bracketIdentifierHolder = undefined;
}

/* ------------------------------------------------------------------------- */

export function isReserved(id: string) {
  return /^(TRUE|FALSE|NULL)$/i.test(id);
}

export function concatinateLogicalExpressions(
  head: Expression,
  tail: Array<[LogicalOperator, Expression]>,
  loc: SourceLocation
): Expression {
  if (tail.length === 0) {
    return head;
  }
  const [[op, tail1], ...rtail] = tail;
  const expr = createLogicalExpression(op, head, tail1, loc);
  return concatinateLogicalExpressions(expr, rtail, loc);
}

export function concatinateBinaryExpressions(
  head: Expression,
  tail: Array<[BinaryOperator, Expression]>,
  loc: SourceLocation
): Expression {
  if (tail.length === 0) {
    return head;
  }
  const [[op, tail1], ...rtail] = tail;
  const expr = createBinaryExpression(op, head, tail1, loc);
  return concatinateBinaryExpressions(expr, rtail, loc);
}

export function createUnaryExpression(
  operator: UnaryOperator,
  argument: Expression,
  loc: SourceLocation
): UnaryExpression {
  return {
    type: "UnaryExpression",
    operator,
    argument,
    prefix: true,
    loc,
  };
}

export function createBinaryExpression(
  operator: BinaryOperator,
  left: Expression,
  right: Expression,
  loc: SourceLocation
): BinaryExpression {
  return {
    type: "BinaryExpression",
    operator,
    left,
    right,
    loc,
  };
}

export function createLogicalExpression(
  operator: LogicalOperator,
  left: Expression,
  right: Expression,
  loc: SourceLocation
): LogicalExpression {
  return {
    type: "LogicalExpression",
    operator,
    left,
    right,
    loc,
  };
}

export function createCallExpression(
  callee: Identifier,
  args: Expression[],
  loc: SourceLocation
): CallExpression {
  return {
    type: "CallExpression",
    callee,
    arguments: args,
    optional: false,
    loc,
  };
}

export function createFieldExpression(
  fieldPaths: Identifier[],
  loc: SourceLocation
): Identifier | MemberExpression {
  if (fieldPaths.length < 2) {
    return fieldPaths[0];
  }
  const [object, property, ...fpaths] = fieldPaths;
  let expression: MemberExpression = {
    type: "MemberExpression",
    computed: false,
    object,
    property,
    optional: false,
    loc,
  };
  for (const field of fpaths) {
    expression = {
      type: "MemberExpression",
      computed: false,
      object: expression,
      property: field,
      optional: false,
      loc,
    };
  }
  return expression;
}

export function createBracketFieldPath(
  name: string,
  loc: SourceLocation
): Identifier[] {
  const id = createIdentifier(name, loc);
  if (_bracketIdentifierHolder) {
    return [createIdentifier(_bracketIdentifierHolder, loc), id];
  }
  return [id];
}

export function createIdentifier(
  name: string,
  loc: SourceLocation
): Identifier {
  return {
    type: "Identifier",
    name,
    loc,
  };
}

export function createNumberLiteral(n: string, loc: SourceLocation): Literal {
  const value = parseFloat(n);
  return {
    type: "Literal",
    value,
    raw: n,
    loc,
  };
}

export function createStringLiteral(s: string, loc: SourceLocation) {
  return {
    type: "Literal",
    value: s,
    raw: s,
    loc,
  };
}

export function createBooleanLiteral(b: string, loc: SourceLocation) {
  const value = b.toUpperCase() === "TRUE";
  return {
    type: "Literal",
    value,
    raw: b,
    loc,
  };
}

export function createNullLiteral(n: string, loc: SourceLocation) {
  return {
    type: "Literal",
    value: null,
    raw: n,
    loc,
  };
}
