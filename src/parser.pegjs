{
  const {
    createUnaryExpression,
    createBinaryExpression,
    createLogicalExpression,
    createCallExpression,
    createFieldPathExpression,
    createIdentifier,
    createNumberLiteral,
    createStringLiteral,
    createBooleanLiteral,
    createNullLiteral,
    isReserved,
  } = require('./parserUtils');
}

/**
 * Root
 */
Expression = LogicalExpression

/**
 * Logical Exprssion (AND | OR)
 */
LogicalExpression = OrExpression

OrExpression =
  left:AndExpression _ op:OrOperator _ right:OrExpression {
    return createLogicalExpression(op, left, right);
  }
/ AndExpression

OrOperator = '||' { return text(); }

AndExpression =
  left:BinaryExpression _ op:AndOperator _ right:AndExpression {
    return createLogicalExpression(op, left, right);
  }
/ BinaryExpression

AndOperator = '&&' { return text(); }

/**
 * Binary Expression (==, !=, <, >, +, -, *, /, ...etc)
 */
BinaryExpression = ComparisonExpression

ComparisonExpression = 
  left:AdditiveExpression _ op:ComparisonOperator _ right:ComparisonExpression {
    return createBinaryExpression(op, left, right);
  }
/ AdditiveExpression

ComparisonOperator =
  '==' { return '==='; }
/ '='  { return '==='; }
/ '<>' { return '!=='; }
/ '!=' { return text(); }
/ '<=' { return text(); }
/ '>=' { return text(); }
/ '<'  { return text(); }
/ '>'  { return text(); }

AdditiveOperator =
  '+' / '-'
/ '&' { return '+'; }

AdditiveExpression = 
  left:MultiplicativeExpression _ op:AdditiveOperator _ right:AdditiveExpression {
    return createBinaryExpression(op, left, right);
  }
/ MultiplicativeExpression

MultiplicativeExpression = 
  left:ExponentialExpression _ op:MultiplicativeOperator _ right:MultiplicativeExpression {
    return createBinaryExpression(op, left, right);
  }
/ ExponentialExpression

MultiplicativeOperator =
  '*' / '/'

ExponentialExpression =
  left:UnaryExpression _ op:ExponentialOperator _ right:ExponentialExpression {
    return createBinaryExpression(op, left, right);
  }
/ UnaryExpression

ExponentialOperator = '^' { return '**'; }

/**
 * Unary Expression (!, -, +)
 */
UnaryOperator =
  '-' / '+' / '!' { return text(); }

UnaryExpression =
  op:UnaryOperator _ expr:UnaryExpression {
    return createUnaryExpression(op, expr);
  }
/ CallExpression

/**
 * Call Expression (e.g. foo(a, b))
 */
CallExpression =
  callee:Identifier _ LPAREN _ args:CallArgumentList? _ RPAREN {
    return createCallExpression(callee, args || []);
  }
/ FieldPathExpression

CallArgumentList =
  arg:Expression _ COMMA _ rest:CallArgumentList {
    return [arg].concat(rest);
  }
/ arg:Expression {
    return [arg];
  }

/**
 * Field Path Expression (e.g. Account.Owner.Username)
 */
FieldPathExpression =
  fpath:FieldPath {
    return createFieldPathExpression(fpath);
  }
/ ParenExpression

FieldPath =
  field:Identifier _ DOT _ fields:FieldPath {
    return [ field, ...fields ];
  }
/ field:Identifier { return [ field ]; }

/**
 * Paren Expression (....)
 */
ParenExpression =
  LPAREN _ expression:Expression _ RPAREN {
    return expression;
  }
/ Identifier

/**
 * Identifier
 */
Identifier =
  id:([a-zA-Z][0-9a-zA-Z_]* { return text() }) & { return !isReserved(id) } {
    return createIdentifier(id);
  }
/ Literal

/**
 * Literal
 */
Literal =
  NumberLiteral
/ StringLiteral
/ BooleanLiteral
/ NullLiteral

NumberLiteral =
  n:Number {
    return createNumberLiteral(n)
  }

Number =
  int_:Int frac:Frac         { return int_ + frac; }
/ int_:Int                   { return int_; }

Int
  = digit19:Digit19 digits:Digits { return digit19 + digits; }
  / digit:Digit

Frac
  = "." digits:Digits { return "." + digits; }

Digits
  = digits:Digit+ { return digits.join(""); }

Digit   = [0-9]
Digit19 = [1-9]

StringLiteral =
  QUOTE ca:(SingleChar*) QUOTE {
    return createStringLiteral(ca.join(''));
  }
/ DQUOTE ca:(SingleChar*) DQUOTE {
    return createStringLiteral(ca.join(''));
  }

SingleChar =
  [^'"\\\0-\x1F\x7f]
/ EscapeChar

EscapeChar =
  "\\'"  { return "'"; }
/ '\\"'  { return '"'; }
/ "\\\\" { return "\\"; }

BooleanLiteral =
  TRUE {
    return createBooleanLiteral(text());
  }
/ FALSE {
    return createBooleanLiteral(text());
  }

NullLiteral =
  NULL { return createNullLiteral(text()); }

/**
 * 
 */
_ "spacer" =
  [ \t\n\r]*

__ "whitespaces" =
  [ \t\n\r]+

COMMA  = ","
DOT    = "."
LPAREN = "("
RPAREN = ")"
QUOTE  = "'"
DQUOTE = '"'
NULL   = "NULL"i
TRUE   = "TRUE"i
FALSE  = "FALSE"i