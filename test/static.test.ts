import assert from "assert";
import { parseSync } from "..";

test("should yield null value if the result is empty or space", () => {
  const formula = "Text__c & ' ' & Text__c";
  const fml = parseSync(formula, {
    inputTypes: {
      Text__c: { type: "string" },
    },
    returnType: "string",
  });
  const ret1 = fml.evaluate({ Text__c: "" });
  assert(ret1 === null);
});

test("should evaluate global reference (with $-prefixed variable)", () => {
  const formula = "$User.Id";
  const fml = parseSync(formula, {
    inputTypes: {
      $User: {
        type: "object",
        properties: {
          Id: {
            type: "string",
          },
        },
      },
    },
    returnType: "string",
  });
  const ret1 = fml.evaluate({ $User: { Id: "u01" } });
  assert(ret1 === "u01");
});
