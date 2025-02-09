import path from "node:path";
import dayjs from "dayjs";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { type CompiledFormula, parse } from "../../src";
import { toReturnType } from ".";
import { FORMULA_TEST_OBJECT } from "./constant";
import { type FormulaDef, loadFormulaDefs } from "./formulaDef";
import { describe as describeSObject } from "./schema";

type CompileResult = {
  definition: FormulaDef;
  compiled: CompiledFormula;
};

const SNAPSHOT_DIR = path.join(__dirname, "../fixtures/compiled-snapshots");

const formulaSObject = `${FORMULA_TEST_OBJECT}__c`;
const describer = { sobject: formulaSObject, describe: describeSObject };

export async function compileFormulaDefs() {
  const compiledResults: CompileResult[] = [];
  const formulaDefs = loadFormulaDefs();
  for (const formulaDef of formulaDefs) {
    const fml = await parse(formulaDef.formula, {
      ...describer,
      returnType: toReturnType(formulaDef.type),
      scale: formulaDef.scale,
      blankAsZero: formulaDef.blankAsZero,
    });
    const result: CompileResult = {
      definition: formulaDef,
      compiled: fml.compiled,
    };
    compiledResults.push(result);
  }
  writeFileSync(
    path.join(SNAPSHOT_DIR, `${dayjs().format("YYYYMMDD")}.json`),
    JSON.stringify(compiledResults, null, 2)
  );
  console.log("Compiled formula definition and stored to file.");
}

export function loadCompiledFormulaFromSnapshots() {
  const files = readdirSync(SNAPSHOT_DIR);
  const snapshots: { [fname: string]: CompileResult[] } = {};
  for (const file of files) {
    if (file.endsWith(".json")) {
      const fname = file.replace(/\.json$/, "");
      const data = readFileSync(path.join(SNAPSHOT_DIR, file), "utf8");
      const compiledResults: CompileResult[] = JSON.parse(data);
      snapshots[fname] = compiledResults;
    }
  }
  return snapshots;
}

// run only when this script is executed directly
if (require.main === module) {
  compileFormulaDefs();
}
