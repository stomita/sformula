import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import { zeropad } from ".";

/**
 *
 */
export type FormulaDef = {
  name: string;
  description?: string;
  formula: string;
  type: string;
  blankAsZero?: boolean;
  precision?: number;
  scale?: number;
  fluctuation?: number;
};

export function loadFormulaDefs(): FormulaDef[] {
  const data = fs.readFileSync(
    path.join(__dirname, "../fixtures/formula-defs.yml"),
    "utf8"
  );
  const defs: any[] = yaml.safeLoad(data);
  return defs.map((def, i) => ({
    name: `Formula${zeropad(i + 1)}__c`,
    ...def,
  }));
}
