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

test("should correctly calculate WEEKDAY()", () => {
  const formula = "WEEKDAY(Date__c)";
  const fml = parseSync(formula, {
    inputTypes: {
      Date__c: { type: "date" },
    },
    returnType: "number",
  });
  const ret0 = fml.evaluate({ Date__c: "2015-02-28" });
  const ret1 = fml.evaluate({ Date__c: "2015-03-01" });
  const ret2 = fml.evaluate({ Date__c: "2015-03-02" });
  const ret3 = fml.evaluate({ Date__c: "2015-03-03" });
  const ret4 = fml.evaluate({ Date__c: "2015-03-04" });
  const ret5 = fml.evaluate({ Date__c: "2015-03-05" });
  const ret6 = fml.evaluate({ Date__c: "2015-03-06" });
  const ret7 = fml.evaluate({ Date__c: "2015-03-07" });
  assert(ret0 === 7);
  assert(ret1 === 1);
  assert(ret2 === 2);
  assert(ret3 === 3);
  assert(ret4 === 4);
  assert(ret5 === 5);
  assert(ret6 === 6);
  assert(ret7 === 7);
});