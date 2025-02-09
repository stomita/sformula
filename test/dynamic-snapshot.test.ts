import assert from "assert";
import { create } from "../src";
import { setupFormulaObjectAndRecords, type Record } from "./utils/testRecords";
import { FORMULA_TEST_OBJECT } from "./utils/constant";
import { between, calcFluctuatedValue, toReturnType, zeropad } from "./utils";
import { loadCompiledFormulaFromSnapshots } from "./utils/precompile";

/**
 *
 */
jest.setTimeout(300000);

/**
 *
 */
const compiledFormulaSnapshots = loadCompiledFormulaFromSnapshots();

for (const snapshotName of Object.keys(compiledFormulaSnapshots)) {
  const compiledResults = compiledFormulaSnapshots[snapshotName];
  const formulaDefs = compiledResults.map(({ definition }) => definition);

  /**
   *
   */
  describe(`dynamic-snapshot: ${snapshotName}`, () => {
    const formulaSObject = `${FORMULA_TEST_OBJECT}_Snapshot_${snapshotName}__c`;

    /**
     *
     */
    let testRecords: Record[];
    let expectedRecords: Record[];

    /**
     *
     */
    beforeAll(async () => {
      const ret = await setupFormulaObjectAndRecords(
        formulaSObject,
        formulaDefs,
        {
          skipLoadingTestRecords: !!process.env.SKIP_LOADING_TEST_RECORDS,
          skipRebuildFormulaSchdema: !!process.env.SKIP_REBUILD_FORMULA_SCHEMA,
        }
      );
      testRecords = ret.testRecords;
      expectedRecords = ret.expectedRecords;
    });

    /**
     *
     */
    for (const [i, { definition, compiled }] of compiledResults.entries()) {
      const { type, name, formula, blankAsZero, fluctuation = 0 } = definition;
      /**
       *
       */
      test(`formula#${zeropad(i + 1)}: ${formula}${
        blankAsZero ? " (blank as zero) " : ""
      }`, async () => {
        if (expectedRecords?.length !== testRecords?.length) {
          throw new Error(
            "test records and expected records size does not match."
          );
        }
        const returnType = toReturnType(type);
        const fml = create(compiled);
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
  });
}
