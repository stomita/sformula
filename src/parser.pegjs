{
  const {
    concatinateLogicalExpressions,
    concatinateBinaryExpressions,
    createLogicalExpression,
    createBinaryExpression,
    createUnaryExpression,
    createCallExpression,
    createFieldExpression,
    createBracketFieldPath,
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
Expression =
  _ expr:LogicalExpression _ {
    return expr;
  }

/**
 * Logical Exprssion (&&, ||)
 */
LogicalExpression = OrExpression

OrExpression =
  head:AndExpression tail:OrExpressionTail* {
    return concatinateLogicalExpressions(head, tail, location());
  }

OrExpressionTail =
  _ op:OrOperator _ expression:AndExpression {
    return [op, expression];
  }

OrOperator = '||' { return text(); }

AndExpression =
  head:BinaryExpression tail:AndExpressionTail* {
    return concatinateLogicalExpressions(head, tail, location());
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
    return concatinateBinaryExpressions(head, tail, location());
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
    return concatinateBinaryExpressions(head, tail, location());
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
    return concatinateBinaryExpressions(head, tail, location());
  } 

MultiplicativeExpressionTail =  
  _ op:MultiplicativeOperator _ expression:ExponentialExpression {
    return [op, expression];
  }

MultiplicativeOperator =
  '*' / '/'

ExponentialExpression =
  head:UnaryExpression tail:ExponentialExpressionTail* {
    return concatinateBinaryExpressions(head, tail, location());
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
    return createUnaryExpression(op, expr, location());
  }
/ CallExpression

UnaryOperator =
  '-' / '+' / '!' { return text(); }

/**
 * Call Expression (e.g. foo(a, b))
 */
CallExpression =
  callee:Identifier _ LPAREN _ args:CallArgumentList? _ RPAREN {
    return createCallExpression(callee, args || [], location());
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
    return createFieldExpression(fpath, location());
  }
/ ParenExpression

FieldPath =
  head:BracketFieldPath _ DOT _ tail:FieldPath {
    return [ ...head, ...tail ];
  }
/ head:BracketFieldPath { return head; }

BracketFieldPath =
  LBRACKET id:(BracketIdentifierChar* { return text(); }) RBRACKET {
    return createBracketFieldPath(id, location());
  }
/ id:Identifier {
    return [id];
  }

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
  id:([a-zA-Z_$][0-9a-zA-Z_$]* { return text(); }) & { return !isReserved(id); } {
    return createIdentifier(id, location());
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
    return createNumberLiteral(n, location())
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
    return createStringLiteral(ca.join(''), location());
  }
/ DQUOTE ca:(SingleChar*) DQUOTE {
    return createStringLiteral(ca.join(''), location());
  }

SingleChar =
  [^'"\\\0-\x1F\x7f]
/ EscapeChar

EscapeChar =
  "\\'"  { return "'"; }
/ '\\"'  { return '"'; }
/ "\\\\" { return "\\"; }

BracketIdentifierChar =
  [^\[\]\\\0-\x1F\x7f]
/ EscapeBracketIdentifierChar

EscapeBracketIdentifierChar =
  "\\["  { return "["; }
/ '\\]'  { return "["; }
/ "\\\\" { return "\\"; }

BooleanLiteral =
  TRUE {
    return createBooleanLiteral(text(), location());
  }
/ FALSE {
    return createBooleanLiteral(text(), location());
  }

NullLiteral =
  NULL { return createNullLiteral(text(), location()); }

/**
 *
 */
Comment =
  COMMENTSTART comment:((!"*/" .)*) COMMENTEND

_ "spacer" =
  __ Comment _
/ __

__ "space" =
  [ \t\n\r]*

COMMENTSTART = "/*"
COMMENTEND   = "*/"

COMMA  = ","
DOT    = "."
LPAREN = "("
RPAREN = ")"
LBRACKET = "["
RBRACKET = "]"
QUOTE  = "'"
DQUOTE = '"'
NULL   = "NULL"i
TRUE   = "TRUE"i
FALSE  = "FALSE"i