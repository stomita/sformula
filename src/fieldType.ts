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
      throw new Error(
        `describe field ${field} on ${describer.sobject} is not supported`
      );
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
      throw new Error(`cannot access to field path ${fieldPath.join(".")}`);
    }
    const fieldType: ExpressionType | null =
      target[field] ??
      (describer ? await describeFieldType(field, describer) : null);
    target[field] = fieldType;
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
