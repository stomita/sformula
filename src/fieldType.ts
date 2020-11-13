import {} from "./error";
import type {
  Describer,
  ExpressionType,
  ExpressionTypeDictionary,
} from "./types";

async function describeFieldType(
  field: string,
  describer: Describer
): Promise<ExpressionType | null> {
  let so;
  try {
    so = await describer.describe(describer.sobject);
  } catch (e) {
    console.error(`failed to describe sobject: ${describer.sobject}`);
    console.error(e.message);
    return null;
  }
  const fieldDef = so.fields.find(
    (f) => f.name === field || f.relationshipName === field
  );
  if (!fieldDef) {
    return null;
  }
  switch (fieldDef.type) {
    case "string":
    case "textarea":
    case "url":
    case "phone":
      return { type: "string" };
    case "id":
      return { type: "id" };
    case "int":
    case "integer":
    case "double":
      return {
        type: "number",
      };
    case "boolean":
    case "date":
    case "datetime":
    case "time":
    case "percent":
    case "currency":
      return { type: fieldDef.type };
    case "picklist":
      return {
        type: "picklist",
        picklistValues: fieldDef.picklistValues ?? undefined,
      };
    case "multipicklist":
      return {
        type: "multipicklist",
        picklistValues: fieldDef.picklistValues ?? undefined,
      };
    case "reference":
      return fieldDef.name === field
        ? { type: "id" }
        : fieldDef.relationshipName === field &&
          fieldDef.referenceTo &&
          fieldDef.referenceTo.length === 1
        ? { type: "object", sobject: fieldDef.referenceTo[0], properties: {} }
        : { type: "object", sobject: "Name", properties: {} };
    default:
      return null;
  }
}

async function applyFieldTypePath(
  dictionary: ExpressionTypeDictionary,
  fieldPath: string[],
  describer: Describer | null
): Promise<ExpressionTypeDictionary> {
  const dict = { ...dictionary };
  let target: typeof dict | null = dict;
  for (const field of fieldPath) {
    if (!target) {
      return dict; // quit describe
    }
    const fieldType: ExpressionType | null =
      target[field] ??
      (describer ? await describeFieldType(field, describer) : null);
    if (fieldType) {
      target[field] = fieldType;
    }
    if (fieldType?.type === "object") {
      target = fieldType.properties;
      describer =
        describer && fieldType.sobject
          ? { ...describer, sobject: fieldType.sobject }
          : null;
    } else {
      target = null;
    }
  }
  return dict;
}

export async function createFieldTypeDictionary(
  dictionary: ExpressionTypeDictionary,
  fields: string[],
  describer: Describer
): Promise<ExpressionTypeDictionary> {
  let dict = dictionary;
  for (const field of fields) {
    dict = await applyFieldTypePath(dict, field.split("."), describer);
  }
  return dict;
}
