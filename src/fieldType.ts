/* @flow */
import type {
  Describer,
  ExpressionType,
  ExpressionTypeDictionary,
} from "./types";

async function describeFieldType(
  field: string,
  describer: Describer
): Promise<ExpressionType> {
  const so = await describer.describe(describer.sobject);
  const fieldDef = so.fields.find(
    (f) => f.name === field || f.relationshipName === field
  );
  if (!fieldDef) {
    throw new Error(`cannot describe field ${field} on ${describer.sobject}`);
  }
  switch (fieldDef.type) {
    case "id":
    case "string":
    case "textarea":
    case "url":
    case "phone":
      return { type: "string" };
    case "int":
    case "integer":
    case "double":
      return {
        type: "number",
        precision: fieldDef.precision,
        scale: fieldDef.scale,
      };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "date" };
    case "datetime":
      return { type: "datetime" };
    case "time":
      return { type: "time" };
    case "percent":
      return {
        type: "percent",
        precision: fieldDef.precision,
        scale: fieldDef.scale,
      };
    case "currency":
      return {
        type: "currency",
        precision: fieldDef.precision,
        scale: fieldDef.scale,
      };
    case "picklist":
      return {
        type: "picklist",
        picklistValues: fieldDef.picklistValues ?? undefined,
      };
    case "reference":
      return fieldDef.name === field
        ? { type: "string" }
        : fieldDef.relationshipName === field &&
          fieldDef.referenceTo &&
          fieldDef.referenceTo.length === 1
        ? { type: "object", sobject: fieldDef.referenceTo[0], properties: {} }
        : { type: "object", sobject: "Name", properties: {} };
    default:
      throw new Error(
        `describe field ${field} on ${describer.sobject} is not supported`
      );
  }
}

async function applyFieldTypePath(
  dictionary: ExpressionTypeDictionary,
  fieldPath: string[],
  describer: Describer
): Promise<ExpressionTypeDictionary> {
  const dict = { ...dictionary };
  let target: typeof dict | null = dict;
  for (const field of fieldPath) {
    if (!target) {
      throw new Error(`cannot access to field path ${fieldPath.join(".")}`);
    }
    const fieldType: ExpressionType =
      target[field] || (await describeFieldType(field, describer));
    target[field] = fieldType;
    if (fieldType.type === "object" && fieldType.sobject) {
      target = fieldType.properties;
      describer = { ...describer, sobject: fieldType.sobject };
    } else {
      target = null;
    }
  }
  return dict;
}

export async function createFieldTypeDictionary(
  fields: string[],
  describer: Describer
): Promise<ExpressionTypeDictionary> {
  let dict = {};
  for (const field of fields) {
    dict = await applyFieldTypePath(dict, field.split("."), describer);
  }
  return dict;
}
