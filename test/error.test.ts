import assert from "assert";
import {
  parseSync,
  SyntaxError,
  TypeNotFoundError,
  InvalidTypeError,
  InvalidArgLengthError,
  InvalidOperatorError,
} from "../src";

test("should raise parse error", () => {
  const formula = "Text__c !";
  try {
    parseSync(formula, {
      inputTypes: {
        Text__c: { type: "string" },
      },
      returnType: "string",
    });
    assert.fail("should not reach here");
  } catch (e) {
    assert(typeof e === "object" && e != null && "name" in e);
    assert(e.name === "SyntaxError");
    assert(e instanceof SyntaxError);
    assert(e.found === "!");
    assert(e.location.start.line === 1);
    assert(e.location.start.column === 9);
  }
});

test("should raise invalid type error", () => {
  const formula = "MOD(Text__c, 6)";
  try {
    parseSync(formula, {
      inputTypes: {
        Text__c: { type: "string" },
      },
      returnType: "number",
    });
    assert.fail("should not reach here");
  } catch (e) {
    assert(typeof e === "object" && e != null && "name" in e);
    assert(e.name === "InvalidTypeError");
    assert(e instanceof InvalidTypeError);
    assert.deepStrictEqual(e.expected, ["number"]);
    assert(e.type === "string");
    assert(e.location?.start.line === 1);
    assert(e.location?.start.column === 5);
  }
});

test("should raise invalid argument length error", () => {
  const formula = "MAX(LOG(1, 2), 3)";
  try {
    parseSync(formula, {
      returnType: "number",
    });
    assert.fail("should not reach here");
  } catch (e) {
    assert(typeof e === "object" && e != null && "name" in e);
    assert(e.name === "InvalidArgLengthError");
    assert(e instanceof InvalidArgLengthError);
    assert(e.location?.start.line === 1);
    assert(e.location?.start.column === 5);
  }
});

test("should raise invalid operator error", () => {
  const formula = "- Checkbox__c";
  try {
    parseSync(formula, {
      inputTypes: {
        Checkbox__c: { type: "boolean" },
      },
      returnType: "number",
    });
    assert.fail("should not reach here");
  } catch (e) {
    assert(typeof e === "object" && e != null && "name" in e);
    assert(e.name === "InvalidOperatorError");
    assert(e instanceof InvalidOperatorError);
    assert(e.location?.start.line === 1);
    assert(e.location?.start.column === 3);
  }
});

test("should raise type not found error", () => {
  const formula = "3 * Field__c";
  try {
    parseSync(formula, {
      returnType: "number",
    });
    assert.fail("should not reach here");
  } catch (e) {
    assert(typeof e === "object" && e != null && "name" in e);
    assert(e.name === "TypeNotFoundError");
    assert(e instanceof TypeNotFoundError);
    assert(e.identifier === "Field__c");
    assert(e.location?.start.line === 1);
    assert(e.location?.start.column === 5);
  }
});
