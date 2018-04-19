/* @flow */
import test from 'ava';
import { parse } from '..'; 
import { loadFormulaDefs } from './utils/formulaDef';
import { describe, createFormulaSchema, resetFormulaSchema, createAndFetchRecord } from './utils/schema';


const FORMULA_TEST_OBJECT = 'FormulaTest__c';

/**
 * 
 */
test('formula definition test', async (t) => {
  const formulaDefs = await loadFormulaDefs();
  if (!process.env.SKIP_REBUILD_FORMULA_SCHEMA) {
    await resetFormulaSchema(FORMULA_TEST_OBJECT);
    await createFormulaSchema(FORMULA_TEST_OBJECT, formulaDefs);
  }
  const describer = { sobject: FORMULA_TEST_OBJECT, describe };
  for (const [i, formulaDef] of formulaDefs.entries()) {
    const { name, formula, tests } = formulaDef;
    console.log('===============================');
    console.log('formula:    ', formula);
    let fml;
    try {
      fml = await parse(formula, describer);
      console.log('returnType: ', fml.returnType);
    } catch (err) {
      console.error(err.message, err.location);
    }
    for (const testRec of tests) {
      console.log('--------------------');
      console.log('record:     ', testRec);
      const record = await createAndFetchRecord(testRec);
      const expected = record[name];
      console.log('expected:   ', expected);
      /*
      if (fml) {
        t.true(fml.evaluate(testRec) === expected);
      }
      */
    }
  }
  t.pass();
});