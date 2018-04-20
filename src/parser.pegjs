{
  const {
    concatinateLogicalExpressions,
    concatinateBinaryExpressions,
    createLogicalExpression,
    createBinaryExpression,
    createUnaryExpression,
    createCallExpression,
    createFieldExpression,
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
 * Logical Exprssion (&&, ||)
 */
LogicalExpression = OrExpression

OrExpression =
  head:AndExpression tail:OrExpressionTail* {
    return concatinateLogicalExpressions(head, tail);
  }

OrExpressionTail =
  _ op:OrOperator _ expression:AndExpression {
    return [op, expression];
  }

OrOperator = '||' { return text(); }

AndExpression =
  head:BinaryExpression tail:AndExpressionTail* {
    return concatinateLogicalExpressions(head, tail);
  }

AndExpressionTail =
  _ op:AndOperator _ expression:BinaryExpression {
    return [op, expression];
  }

AndOperator = '&&' { return text(); }

/**
 * Binary Expression (==, !=, <, >, +, -, *, /, ...etc)
 */
BinaryExpression = ComparisonExpression

ComparisonExpression = 
  head:AdditiveExpression tail:ComparisonExpressionTail* {
    return concatinateBinaryExpressions(head, tail);
  }

ComparisonExpressionTail =
  _ op:ComparisonOperator _ expression:AdditiveExpression {
    return [op, expression];
  }

ComparisonOperator =
  '==' { return '==='; }
/ '='  { return '==='; }
/ '<>' { return '!=='; }
/ '!=' { return text(); }
/ '<=' { return text(); }
/ '>=' { return text(); }
/ '<'  { return text(); }
/ '>'  { return text(); }

AdditiveExpression = 
  head:MultiplicativeExpression tail:AdditiveExpressionTail* {
    return concatinateBinaryExpressions(head, tail);
  }

AdditiveExpressionTail =
  _ op:AdditiveOperator _ expression:MultiplicativeExpression {
    return [op, expression];
  }

AdditiveOperator =
  '+' / '-'
/ '&' { return '+'; }

MultiplicativeExpression = 
  head:ExponentialExpression tail:MultiplicativeExpressionTail* {
    return concatinateBinaryExpressions(head, tail);
  } 

MultiplicativeExpressionTail =  
  _ op:MultiplicativeOperator _ expression:ExponentialExpression {
    return [op, expression];
  }

MultiplicativeOperator =
  '*' / '/'

ExponentialExpression =
  head:UnaryExpression tail:ExponentialExpressionTail* {
    return concatinateBinaryExpressions(head, tail);
  }

ExponentialExpressionTail =
  _ op:ExponentialOperator _ expression:UnaryExpression {
    return [op, expression];
  }

ExponentialOperator = '^' { return '**'; }

/**
 * Unary Expression (!, -, +)
 */
UnaryExpression =
  op:UnaryOperator _ expr:UnaryExpression {
    return createUnaryExpression(op, expr);
  }
/ CallExpression

UnaryOperator =
  '-' / '+' / '!' { return text(); }

/**
 * Call Expression (e.g. foo(a, b))
 */
CallExpression =
  callee:Identifier _ LPAREN _ args:CallArgumentList? _ RPAREN {
    return createCallExpression(callee, args || []);
  }
/ FieldExpression

CallArgumentList =
  arg:Expression _ COMMA _ args:CallArgumentList {
    return [ arg, ...args ];
  }
/ arg:Expression { return [ arg ]; }

/**
 * Field Expression (e.g. Account.Owner.Username)
 */
FieldExpression =
  fpath:FieldPath {
    return createFieldExpression(fpath);
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