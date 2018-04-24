/* @flow */
import test from 'ava';
import { DateTime } from 'luxon';
import { parse, type ReturnType } from '..'; 
import { loadFormulaDefs } from './utils/formulaDef';
import { describe, createFormulaSchema, resetFormulaSchema } from './utils/schema';
import { loadTestRecords, truncateAllTestRecords, insertTestRecords, getExpectedRecords } from './utils/testRecords';


function zeropad(n: number) {
  return (n < 10 ? '00' : n < 100 ? '0' : '') + String(n);
}

function toReturnType(type: string): ReturnType {
  return ((
    type === 'Checkbox' ? 'boolean' :
    type === 'Text' ? 'string' :
    type.toLowerCase()
  ): any);
}

const ISO8601_DATETIME_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSZZZ';

function calcFluctuatedValue(
  value: string | number | null,
  fluctuation: number,
  returnType: ReturnType
) {
  if ((returnType === 'number' || returnType === 'currency' || returnType === 'percent') && typeof value === 'number') {
    return ([ value - fluctuation, value + fluctuation ] : [ number, number ]);
  }
  if ((returnType === 'datetime') && typeof value === 'string') {
    const dt = DateTime.fromISO(value);
    return ([
      dt.plus(-fluctuation).toUTC().toFormat(ISO8601_DATETIME_FORMAT),
      dt.plus(fluctuation).toUTC().toFormat(ISO8601_DATETIME_FORMAT),
    ] : [string, string]);
  }
  return ([value, value] : [typeof value, typeof value]);
}

function between(value: any, lower: any, upper: any) {
  return (
    (value == null && lower == null && upper === null) ||
    (value >= lower && value <= upper)
  );
}

const FORMULA_TEST_OBJECT = 'FormulaTest__c';

const formulaDefs = loadFormulaDefs();

const describer = { sobject: FORMULA_TEST_OBJECT, describe };

let testRecords;
let expectedRecords;

/**
 * 
 */
test.before(async () => {
  if (!process.env.SKIP_LOADING_TEST_RECORDS && !process.env.SKIP_REBUILD_FORMULA_SCHEMA) {
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

for (const [i, formulaDef] of formulaDefs.entries()) {
  const { type, name, formula, scale, blankAsZero, fluctuation = 0 } = formulaDef;
  /**
   * 
   */
  test.serial(`formula#${zeropad(i + 1)}: ${formula}${ blankAsZero ? ' (blank as zero) ' : ''}`, async (t) => {
    const returnType = toReturnType(type);
    const fml = await parse(formula, { ...describer, returnType, scale, blankAsZero });
    for (const [i, record] of testRecords.entries()) {
      const expected = expectedRecords[i][name];
      // Test result may differ from expected if relative datetime values are included in the formula (e.g. "NOW()").
      // So applying fluctuation value to the expected value and assert the result is in the range.
      if (fluctuation > 0) {
        const [expectedLower, expectedUpper] = calcFluctuatedValue(expected, fluctuation, returnType);
        t.true(
          between(fml.evaluate(record), expectedLower, expectedUpper),
          'evaluated value is not considered to be matching expected in fluctuation range'
        );
      } else {
        t.true(
          expected === fml.evaluate(record),
          'evaluated value is not equals to the expected'
        );
      }
    }
    t.pass();
  });
}