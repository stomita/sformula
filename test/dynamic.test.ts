import assert from "assert";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { parse, FormulaReturnType } from "..";
import { loadFormulaDefs } from "./utils/formulaDef";
import {
  describe as describeSObject,
  createFormulaSchema,
  resetFormulaSchema,
} from "./utils/schema";
import {
  loadTestRecords,
  truncateAllTestRecords,
  insertTestRecords,
  getExpectedRecords,
  Record,
} from "./utils/testRecords";

//
dayjs.extend(utc);
//

function zeropad(n: number) {
  return (n < 10 ? "00" : n < 100 ? "0" : "") + String(n);
}

function toReturnType(type: string): FormulaReturnType {
  return (type === "Checkbox"
    ? "boolean"
    : type === "Text"
    ? "string"
    : type.toLowerCase()) as FormulaReturnType;
}

const ISO8601_DATETIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ss.SSSZZZ";

const SALESFORCE_TIME_OUTPUT_FORMAT = "HH:mm:ss.SSS[Z]";

function calcFluctuatedValue(
  value: string | number | null,
  fluctuation: number,
  returnType: FormulaReturnType
) {
  if (
    (returnType === "number" ||
      returnType === "currency" ||
      returnType === "percent") &&
    typeof value === "number"
  ) {
    return [value - fluctuation, value + fluctuation] as [number, number];
  }
  if (returnType === "datetime" && typeof value === "string") {
    const dt = dayjs(value);
    return [
      dt.add(-fluctuation, "millisecond").utc().format(ISO8601_DATETIME_FORMAT),
      dt.add(fluctuation, "millisecond").utc().format(ISO8601_DATETIME_FORMAT),
    ] as [string, string];
  }
  if (returnType === "time" && typeof value === "string") {
    const dt = dayjs.utc(value, SALESFORCE_TIME_OUTPUT_FORMAT, true);
    return [
      dt
        .add(-fluctuation, "millisecond")
        .utc()
        .format(SALESFORCE_TIME_OUTPUT_FORMAT),
      dt
        .add(fluctuation, "millisecond")
        .utc()
        .format(SALESFORCE_TIME_OUTPUT_FORMAT),
    ] as [string, string];
  }
  return [value, value] as [typeof value, typeof value];
}

function between(value: any, lower: any, upper: any) {
  return (
    (value == null && lower == null && upper === null) ||
    (value >= lower && value <= upper)
  );
}

const FORMULA_TEST_OBJECT = "FormulaTest__c";

const formulaDefs = loadFormulaDefs();

const describer = { sobject: FORMULA_TEST_OBJECT, describe: describeSObject };

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
  if (
    !process.env.SKIP_LOADING_TEST_RECORDS &&
    !process.env.SKIP_REBUILD_FORMULA_SCHEMA
  ) {
    await resetFormulaSchema(FORMULA_TEST_OBJECT);
    await createFormulaSchema(FORMULA_TEST_OBJECT, formulaDefs);
  }
  testRecords = loadTestRecords();
  if (!process.env.SKIP_LOADING_TEST_RECORDS) {
    await truncateAllTestRecords(FORMULA_TEST_OBJECT);
    await insertTestRecords(FORMULA_TEST_OBJECT, testRecords);
  }
  expectedRecords = await getExpectedRecords(FORMULA_TEST_OBJECT, testRecords);
});

/**
 *
 */
for (const [i, formulaDef] of formulaDefs.entries()) {
  const {
    type,
    name,
    formula,
    scale,
    blankAsZero,
    fluctuation = 0,
  } = formulaDef;
  /**
   *
   */
  test(`formula#${zeropad(i + 1)}: ${formula}${
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
