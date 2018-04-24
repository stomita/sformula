/* @flow */
import test from 'ava';
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
  const { type, name, formula, scale, blankAsZero } = formulaDef;
  /**
   * 
   */
  test.serial(`formula#${zeropad(i + 1)}: ${formula}${ blankAsZero ? ' (blank as zero) ' : ''}`, async (t) => {
    const returnType = toReturnType(type);
    const fml = await parse(formula, { ...describer, returnType, scale, blankAsZero });
    for (const [i, record] of testRecords.entries()) {
      const expected = expectedRecords[i][name];
      t.true(
        expected === fml.evaluate(record),
        'evaluated value is not equals to the expected'
      );
    }
    t.pass();
  });
}