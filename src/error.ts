import { Expression } from "esformula";

/**
 *
 */
type Location = {
  start: { line: number; column: number };
  end: { line: number; column: number };
};

/**
 *
 */
export class SyntaxError extends Error {
  expected: string[];
  found: string;
  location: Location;

  constructor(
    message: string,
    expected: string[],
    found: string,
    location: Location
  ) {
    super(message);
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.location = location;
  }
}

/**
 *
 */
export class ValidationError extends Error {
  location?: Location;

  constructor(expression: Expression, name: string, message: string) {
    super(message);
    this.name = name;
    if (expression.loc) {
      this.location = expression.loc;
    }
  }
}

/**
 *
 */
export class InvalidArgLengthError extends ValidationError {
  argLen: number;
  argRange: [number, number];
  constructor(
    expression: Expression,
    argLen: number,
    argRange: [number, number]
  ) {
    const message = `arguments num for the call is not valid (expected ${
      argRange[0] === argRange[1]
        ? argRange[0]
        : `${argRange[0]}-${argRange[1]}`
    }, found ${argLen})`;
    super(expression, "InvalidArgLengthError", message);
    this.argLen = argLen;
    this.argRange = argRange;
  }
}

/**
 *
 */
export class InvalidTypeError extends ValidationError {
  type: string;
  expected: string[];

  constructor(expression: Expression, type: string, expected: string[]) {
    const message = `expected a ${expected
      .map((e) => `'${e}'`)
      .join(" or ")} type value, but '${type}' type found`;
    super(expression, "InvalidTypeError", message);
    this.type = type;
    this.expected = expected;
  }
}

/**
 *
 */
export class InvalidOperatorError extends ValidationError {
  type: string;
  operator: string;
  constructor(expression: Expression, type: string, operator: string) {
    const message = `operator ${operator} cannot be applied to '${type}' type value`;
    super(expression, "InvalidOperatorError", message);
    this.type = type;
    this.operator = operator;
  }
}

/**
 *
 */
export class TypeNotFoundError extends ValidationError {
  identifier: string;

  constructor(expression: Expression, identifier: string) {
    const message = `type information is not found: ${identifier}`;
    super(expression, "TypeNotFoundError", message);
    this.identifier = identifier;
  }
}

/**
 *
 */
export class UnexpectedError extends ValidationError {
  constructor(expression: Expression, message: string) {
    super(expression, "UnexpectedError", message);
  }
}
