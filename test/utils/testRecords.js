/* @flow */
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { getConnection } from './connection';

export type Record = { [field: string]: any };
/**
 * 
 */
export function loadTestRecords(): Record[] {
  const data = fs.readFileSync(path.join(__dirname, '../fixtures/test-records.yml'));
  const records = yaml.safeLoad(data);
  return records;
}

export async function truncateAllTestRecords(sobject: string): Promise<void> {
  const conn = await getConnection();
  await conn.sobject(sobject).find().destroy();
  console.log('truncated all test records in the table');
}

export async function getExpectedRecords(sobject: string, records: Record[]) {
  const conn = await getConnection();
  const ids: { [index: number]: string } = {};
  const refIds: { [ref: string]: string } = {};
  const insert = async (entries: Array<[number, Record]>) => {
    const insertings: Array<[number, Record]> = [];
    const waitings: Array<[number, Record]> = [];
    const filterRecordEntry = (entry: [number, Record]) => {
      let [index, record] = entry;
      if (record.Parent__r) {
        const ref = record.Parent__r.$ref;
        record = { ...record };
        if (ref) {
          if (refIds[ref]) {
            record.Parent__c = refIds[ref];
            delete record.Parent__r;
            insertings.push([index, record]);
          } else {
            waitings.push([index, record]);
          }
        } else {
          const $ref = Math.random().toString(16).substring(2);
          const parentRec = { $ref, ...record.Parent__r };
          filterRecordEntry([-1, parentRec]);
          record.Parent__r = { $ref };
          waitings.push([index, record]);
        }
      } else {
        insertings.push([index, record]);
      }
    }
    for (let entry of entries) {
      filterRecordEntry(entry)
    }
    const rets = await conn.requestPost('/composite/sobjects', {
      records: insertings.map(([index, record]) => {
        const { $ref, ...rec } = record;
        return {
          attributes: { type: sobject },
          ...rec,
        };
      }),
    });
    rets.forEach((ret, i) => {
      const [index, record] = insertings[i];
      if (index >= 0) {
        ids[index] = ret.id;
      }
      if (record.$ref) {
        refIds[record.$ref] = ret.id;
      }
    });
    if (waitings.length > 0) {
      await insert(waitings);
    }
  };
  await insert(Array.from(records.entries()));
  const recs = await conn.sobject(sobject).find({}, '*,Parent__r.*,Parent__r.Parent__r.*');
  const recMap = recs.reduce((map, rec) => ({ ...map, [rec.Id]: rec }), {});
  const expectedRecs = records.map((rec, index) => {
    const id = ids[index];
    return recMap[id];
  });
  console.log('got expected record values from server');
  return expectedRecs;
}
