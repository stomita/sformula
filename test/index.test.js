/* @flow */
import test from 'ava';
import { parse, type ReturnType } from '..'; 
import { loadFormulaDefs } from './utils/formulaDef';
import { describe, createFormulaSchema, resetFormulaSchema, createAndFetchRecord } from './utils/schema';


const FORMULA_TEST_OBJECT = 'FormulaTest__c';

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

const formulaDefs = loadFormulaDefs();

const describer = { sobject: FORMULA_TEST_OBJECT, describe };

/**
 * 
 */
test.before(async () => {
  if (!process.env.SKIP_REBUILD_FORMULA_SCHEMA) {
    await resetFormulaSchema(FORMULA_TEST_OBJECT);
    await createFormulaSchema(FORMULA_TEST_OBJECT, formulaDefs);
  }
});

for (const [i, formulaDef] of formulaDefs.entries()) {
  const { type, name, formula, blankAsZero, tests } = formulaDef;
  /**
   * 
   */
  test.serial(`formula#${zeropad(i + 1)}: ${formula}${ blankAsZero ? ' (blank as zero) ' : ''}`, async (t) => {
    const returnType = toReturnType(type);
    const fml = await parse(formula, { ...describer, returnType, blankAsZero });
    const { expression } = fml.compiled;
    for (const record of tests) {
      const fetched = await createAndFetchRecord(record);
      const expected = fetched[name];
      const actual = fml.evaluate(record);
      t.truthy(actual === expected && { formula, expression, returnType, record });
    }
    t.pass();
  });
}