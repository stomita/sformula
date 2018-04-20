/* @flow */
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { zeropad } from '.';

/**
 * 
 */
export type FormulaDef = {
  name: string,
  formula: string,
  type: string,
  blankAsZero: boolean,
  precision?: number,
  scale?: number,
  tests: Array<{ [name: string]: any }>,
};


export function loadFormulaDefs(): FormulaDef[] {
  const data = fs.readFileSync(path.join(__dirname, '../fixtures/formula-defs.yml'));
  const defs = yaml.safeLoad(data);
  return defs.map((def, i) => ({
    name: `Formula${zeropad(i + 1)}__c`,
    ...def,
  }));
}