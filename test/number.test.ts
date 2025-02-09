import assert from "assert";
import { parseSync } from "../src";

/**
 *
 */
describe("number calculations", () => {
  test("should handle floating point calculations without rounding errors", () => {
    const cases = [
      { formula: "0.1 + 0.2", expected: 0.3 },
      { formula: "0.3 - 0.1", expected: 0.2 },
      { formula: "0.7 * 0.1", expected: 0.07 },
      { formula: "0.3 / 0.1", expected: 3 },
      { formula: "1.0 - 0.9", expected: 0.1 },
      { formula: "0.1 * 0.1", expected: 0.01 },
    ];

    for (const { formula, expected } of cases) {
      const fml = parseSync(formula, { returnType: "number" as const });
      const result = fml.evaluate({});
      assert.strictEqual(result, expected, `Failed for ${formula}`);
    }
  });

  test("should handle percentage calculations correctly", () => {
    const cases: Array<{
      formula: string;
      inputs: Record<string, number>;
      expected: number;
      returnType: "number" | "percent";
      scale?: number;
    }> = [
      {
        formula: "Number01__c / Number02__c",
        inputs: { Number01__c: 1, Number02__c: 3 },
        expected: 0.3333333333,
        returnType: "number",
        scale: 10,
      },
      {
        formula: "Percent01__c",
        inputs: { Percent01__c: 25 },
        expected: 25,
        returnType: "percent",
      },
      {
        formula: "Percent01__c + Percent02__c",
        inputs: { Percent01__c: 25, Percent02__c: 75 },
        expected: 100,
        returnType: "percent",
      },
      {
        formula: "Percent01__c * Number01__c",
        inputs: { Percent01__c: 25, Number01__c: 200 },
        expected: 50,
        returnType: "number",
      },
    ];

    for (const { formula, inputs, expected, scale, returnType } of cases) {
      const fml = parseSync(formula, {
        inputTypes: {
          Number01__c: { type: "number" },
          Number02__c: { type: "number" },
          Percent01__c: { type: "percent" },
          Percent02__c: { type: "percent" },
        },
        scale,
        returnType,
      });
      const result = fml.evaluate(inputs);
      assert.strictEqual(result, expected, `Failed for ${formula}`);
    }
  });
});
