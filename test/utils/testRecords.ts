import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import { zeropad } from ".";
import { getConnection } from "./connection";
import { createFormulaSchema, resetFormulaSchema } from "./schema";
import type { FormulaDef } from "./formulaDef";

export type Record = {
  Key__c: string;
  Parent__r?: { $ref?: string };
  [field: string]: any;
};

let keySeq = 1;
function genKey() {
  return `${zeropad(keySeq++)}`;
}

/**
 *
 */
export function loadTestRecords(): Record[] {
  const data = fs.readFileSync(
    path.join(__dirname, "../fixtures/test-records.yml"),
    "utf8"
  );
  const records: any[] = yaml.safeLoad(data) as any;
  return records.map((rec) => ({
    Key__c: genKey(),
    ...rec,
  }));
}

/**
 *
 */
export async function truncateAllTestRecords(sobject: string): Promise<void> {
  const conn = await getConnection();
  await conn.sobject(sobject).find().destroy();
  console.log("truncated all test records in the table");
}

/**
 *
 */
export async function insertTestRecords(sobject: string, records: Record[]) {
  const conn = await getConnection();
  const refIds: { [ref: string]: string } = {};
  const insertRecords = async (records: Record[]) => {
    const insertings: Record[] = [];
    const waitings: Record[] = [];
    const filterRecordEntry = (record: Record) => {
      if (record.Parent__r) {
        const ref = record.Parent__r?.$ref;
        record = { ...record };
        if (ref) {
          if (refIds[ref]) {
            record.Parent__c = refIds[ref];
            delete record.Parent__r;
            insertings.push(record);
          } else {
            waitings.push(record);
          }
        } else {
          const $ref = Math.random().toString(16).substring(2);
          const parentRec = {
            Key__c: genKey(),
            $ref,
            ...record.Parent__r,
          };
          filterRecordEntry(parentRec);
          record.Parent__r = { $ref };
          waitings.push(record);
        }
      } else {
        insertings.push(record);
      }
    };
    for (const record of records) {
      filterRecordEntry(record);
    }
    const rets: any[] = await conn.requestPost("/composite/sobjects", {
      records: insertings.map((record) => {
        const { $ref, ...rec } = record;
        return {
          attributes: { type: sobject },
          ...rec,
        };
      }),
    });
    rets.forEach((ret, i) => {
      const record = insertings[i];
      if (record.$ref) {
        refIds[record.$ref] = ret.id;
      }
    });
    if (waitings.length > 0) {
      await insertRecords(waitings);
    }
  };
  await insertRecords(records);
  console.log("inserted test records to server");
}

/**
 *
 */
export async function getExpectedRecords(
  sobject: string,
  testRecords: Record[]
) {
  console.log("fetching expected record values");
  const conn = await getConnection();
  const recs = await conn.sobject(sobject).find({}, "*,Parent__r.*");
  const keyMap = recs.reduce(
    (map, rec) => ({ ...map, [rec.Key__c]: rec }),
    {} as { [key: string]: Record }
  );
  const expectedRecs = testRecords.map((rec) => keyMap[rec.Key__c]);
  console.log("got expected record values from server");
  return expectedRecs;
}

type FormulaObjectSetupOptions = {
  skipLoadingTestRecords?: boolean;
  skipRebuildFormulaSchdema?: boolean;
};

export async function setupFormulaObjectAndRecords(
  sobject: string,
  formulaDefs: FormulaDef[],
  {
    skipLoadingTestRecords,
    skipRebuildFormulaSchdema,
  }: FormulaObjectSetupOptions = {}
) {
  if (!skipLoadingTestRecords && !skipRebuildFormulaSchdema) {
    await resetFormulaSchema(sobject);
    await createFormulaSchema(sobject, formulaDefs);
  }
  const testRecords = loadTestRecords();
  if (!skipLoadingTestRecords) {
    await truncateAllTestRecords(sobject);
    await insertTestRecords(sobject, testRecords);
  }
  const expectedRecords = await getExpectedRecords(sobject, testRecords);
  return { testRecords, expectedRecords };
}
