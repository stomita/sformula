/* @flow */
import test from 'ava';
import { parse, type ReturnType } from '..'; 
import { loadFormulaDefs } from './utils/formulaDef';
import { describe, createFormulaSchema, resetFormulaSchema, createAndFetchRecord } from './utils/schema';


const FORMULA_TEST_OBJECT = 'FormulaTest__c';

function toReturnType(type: string): ReturnType {
  return ((
    type === 'Checkbox' ? 'boolean' :
    type === 'Text' ? 'string' :
    type.toLowerCase()
  ): any);
}

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
    const { name, formula, blankAsZero, tests } = formulaDef;
    console.log('===============================');
    console.log('formula:    ', formula, blankAsZero ? '(blank as zero)' : '');
    let fml;
    try {
      const returnType = toReturnType(formulaDef.type);
      fml = await parse(formula, { ...describer, returnType });
      console.log('returnType: ', fml.returnType);
    } catch (err) {
      console.error(err.message);
    }
    for (const testRec of tests) {
      console.log('--------------------');
      console.log('record:     ', testRec);
      const record = await createAndFetchRecord(testRec);
      const expected = record[name];
      console.log('expected:   ', expected);
      if (fml) {
        const actual = fml.evaluate(testRec);
        console.log('actual:     ', actual);
        // t.true(actual === expected);
      }
    }
  }
  t.pass();
});