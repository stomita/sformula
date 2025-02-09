import assert from "assert";
import { parse } from "../src";
import { loadFormulaDefs } from "./utils/formulaDef";
import { describe as describeSObject } from "./utils/schema";
import { Record, setupFormulaObjectAndRecords } from "./utils/testRecords";
import { FORMULA_TEST_OBJECT } from "./utils/constant";
import { between, calcFluctuatedValue, toReturnType, zeropad } from "./utils";

const formulaSObject = `${FORMULA_TEST_OBJECT}__c`;
const formulaDefs = loadFormulaDefs();

const describer = { sobject: formulaSObject, describe: describeSObject };

/**
 *
 */
jest.setTimeout(300000);

/**
 *
 */
let testRecords: Record[];
let expectedRecords: Record[];

/**
 *
 */
beforeAll(async () => {
  const ret = await setupFormulaObjectAndRecords(formulaSObject, formulaDefs, {
    skipLoadingTestRecords: !!process.env.SKIP_LOADING_TEST_RECORDS,
    skipRebuildFormulaSchdema: !!process.env.SKIP_REBUILD_FORMULA_SCHEMA,
  });
  testRecords = ret.testRecords;
  expectedRecords = ret.expectedRecords;
});

/**
 *
 */
const targetFormulaNo = process.env.TEST_FORMULA_NO
  ? parseInt(process.env.TEST_FORMULA_NO, 10)
  : null;

for (const [i, formulaDef] of formulaDefs.entries()) {
  const {
    type,
    name,
    formula,
    scale,
    blankAsZero,
    fluctuation = 0,
  } = formulaDef;

  const formulaNo = i + 1;
  if (targetFormulaNo && formulaNo !== targetFormulaNo) {
    continue;
  }

  test(`formula#${zeropad(formulaNo)}: ${formula}${
    blankAsZero ? " (blank as zero) " : ""
  }`, async () => {
    if (expectedRecords?.length !== testRecords?.length) {
      throw new Error("test records and expected records size does not match.");
    }
    const returnType = toReturnType(type);
    const fml = await parse(formula, {
      ...describer,
      returnType,
      scale,
      blankAsZero,
    });
    for (const [i, rec] of testRecords.entries()) {
      const fetchedRecord = expectedRecords[i];
      const { Id, Parent__c, Parent__r, [name]: expected } = fetchedRecord;
      const record = {
        ...rec,
        Id,
        Parent__c,
        Parent__r: Parent__r ? { ...Parent__r } : null,
      };
      // Test result may differ from expected if relative datetime values are included in the formula (e.g. "NOW()").
      // So applying fluctuation value to the expected value and assert the result is in the range.
      if (fluctuation > 0) {
        const [expectedLower, expectedUpper] = calcFluctuatedValue(
          expected,
          fluctuation,
          returnType
        );
        assert.ok(
          between(fml.evaluate(record), expectedLower, expectedUpper),
          "evaluated value is not considered to be matching expected in fluctuation range"
        );
      } else {
        assert.ok(
          expected === fml.evaluate(record),
          "evaluated value does not equal to the expected"
        );
      }
    }
  });
}
