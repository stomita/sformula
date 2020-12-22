import assert from "assert";
import { parseSync, parse } from "..";
import { DescribeSObjectResult } from "../src/types";
import { describe } from "./utils/schema";

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

const ACCOUNT_DESC: DescribeSObjectResult = {
  label: "Account",
  name: "Account",
  fields: [
    {
      name: "Name",
      type: "string",
      label: "Name",
      precision: 0,
      scale: 0,
      relationshipName: null,
      referenceTo: [],
      picklistValues: [],
    },
  ],
};

test("should describe only fields that are not in given types", async () => {
  const formula = "$User.Id + ': ' + Name";
  const described: { [name: string]: boolean } = {};
  const fml = await parse(formula, {
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
    sobject: "Account",
    describe: async (sobject: string) => {
      described[sobject] = true;
      return process.env.MOCK_DESCRIBE_REMOTE
        ? describe(sobject)
        : ACCOUNT_DESC;
    },
    returnType: "string",
  });
  const ret = fml.evaluate({ $User: { Id: "u001" }, Name: "Account #1" });
  assert(described["Account"]);
  assert(ret === "u001: Account #1");
});

test("should parse CASE() funciton with Picklist field value", async () => {
  const formula = "CASE(Picklist__c, 'A', 'a', 'B', 'b', '-')";
  const fml = await parseSync(formula, {
    inputTypes: {
      Picklist__c: {
        type: "picklist",
        picklistValues: [
          {
            label: "A",
            value: "A",
          },
          {
            label: "B",
            value: "B",
          },
        ],
      },
    },
    returnType: "string",
  });
  const ret = fml.evaluate({ Picklist__c: "A" });
  assert(ret === "a");
});

test("should compare boolean field value", async () => {
  const formula1 = "Checkbox1__c = Checkbox2__c";
  const fml1 = await parseSync(formula1, {
    inputTypes: {
      Checkbox1__c: {
        type: "boolean",
      },
      Checkbox2__c: {
        type: "boolean",
      },
    },
    returnType: "boolean",
  });
  const ret11 = fml1.evaluate({ Checkbox1__c: true, Checkbox2__c: false });
  assert(ret11 === false);
  const ret12 = fml1.evaluate({ Checkbox1__c: false, Checkbox2__c: false });
  assert(ret12 === true);
  const formula2 = "Checkbox1__c != Checkbox2__c";
  const fml2 = await parseSync(formula2, {
    inputTypes: {
      Checkbox1__c: {
        type: "boolean",
      },
      Checkbox2__c: {
        type: "boolean",
      },
    },
    returnType: "boolean",
  });
  const ret21 = fml2.evaluate({ Checkbox1__c: true, Checkbox2__c: false });
  assert(ret21 === true);
  const ret22 = fml2.evaluate({ Checkbox1__c: false, Checkbox2__c: false });
  assert(ret22 === false);
});
