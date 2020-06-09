import AdmZip from "adm-zip";
import metadata from "salesforce-metadata-xml-builder";
import { getConnection } from "./connection";
import type { FormulaDef } from "./formulaDef";
import { zeropad, escapeXml } from ".";

/**
 *
 */
export async function describe(sobject: string) {
  const conn = await getConnection();
  return conn.describe$(sobject);
}

/**
 *
 */
export async function resetFormulaSchema(sobject: string) {
  const conn = await getConnection();
  const packageXml = metadata.Package({
    version: "42.0",
  });
  const destructiveChangesXml = metadata.Package({
    types: [
      {
        name: "CustomObject",
        members: [sobject],
      },
    ],
    version: "42.0",
  });
  const zip = new AdmZip();
  zip.addFile("src/package.xml", Buffer.from(packageXml));
  zip.addFile("src/destructiveChanges.xml", Buffer.from(destructiveChangesXml));
  await conn.metadata
    .deploy(zip.toBuffer(), { purgeOnDelete: true })
    .complete(true);
  console.log("Deleted existing formula test schema");
}

export async function createFormulaObjectFields(
  sobject: string,
  fields: Array<{ fullName: string }>
) {
  const conn = await getConnection();
  const label = sobject.replace(/__c$/, "");
  const objectXml = metadata.CustomObject({
    fullName: sobject,
    fields,
    label,
    pluralLabel: label,
    nameField: {
      type: "AutoNumber",
      fullName: "Name",
      label: "#",
    },
    deploymentStatus: "Deployed",
    sharingModel: "ReadWrite",
  });
  const packageXml = metadata.Package({
    types: [
      {
        name: "CustomObject",
        members: [sobject],
      },
      {
        name: "CustomField",
        members: fields.map((fd) => `${sobject}.${fd.fullName}`),
      },
    ],
    version: "42.0",
  });
  const zip = new AdmZip();
  zip.addFile("src/package.xml", Buffer.from(packageXml));
  zip.addFile(`src/objects/${sobject}.object`, Buffer.from(objectXml));
  const res = await conn.metadata.deploy(zip.toBuffer()).complete(true);
  if (res.status !== "Succeeded") {
    console.error(res.details);
    throw new Error("Schema creation failed");
  }
}

export async function createFormulaSchema(
  sobject: string,
  formulaDefs: FormulaDef[]
) {
  const conn = await getConnection();

  const fields = [
    {
      fullName: "Key__c",
      externalId: true,
      label: "Key",
      length: 50,
      required: true,
      trackTrending: false,
      type: "Text",
      unique: true,
    },
    {
      type: "Checkbox",
      fullName: "Checkbox01__c",
      defaultValue: false,
      externalId: false,
      label: "Checkbox #01",
      trackTrending: false,
    },
    {
      type: "Checkbox",
      fullName: "Checkbox02__c",
      defaultValue: false,
      externalId: false,
      label: "Checkbox #02",
      trackTrending: false,
    },
    {
      fullName: "Number01__c",
      externalId: false,
      label: "Number #01",
      precision: 18,
      required: false,
      scale: 0,
      trackTrending: false,
      type: "Number",
      unique: false,
    },
    {
      fullName: "Number02__c",
      externalId: false,
      label: "Number #02",
      precision: 18,
      required: false,
      scale: 4,
      trackTrending: false,
      type: "Number",
      unique: false,
    },
    {
      fullName: "Currency01__c",
      externalId: false,
      label: "Currency #01",
      precision: 18,
      required: false,
      scale: 0,
      trackTrending: false,
      type: "Currency",
      unique: false,
    },
    {
      fullName: "Currency02__c",
      externalId: false,
      label: "Currency #02",
      precision: 18,
      required: false,
      scale: 2,
      trackTrending: false,
      type: "Currency",
      unique: false,
    },
    {
      fullName: "Percent01__c",
      externalId: false,
      label: "Percent #01",
      precision: 18,
      required: false,
      scale: 0,
      trackTrending: false,
      type: "Percent",
      unique: false,
    },
    {
      fullName: "Percent02__c",
      externalId: false,
      label: "Percent #02",
      precision: 18,
      required: false,
      scale: 4,
      trackTrending: false,
      type: "Percent",
      unique: false,
    },
    {
      fullName: "Text01__c",
      externalId: false,
      label: "Text #01",
      length: 255,
      required: false,
      trackTrending: false,
      type: "Text",
      unique: false,
    },
    {
      fullName: "Text02__c",
      externalId: false,
      label: "Text #02",
      length: 255,
      required: false,
      trackTrending: false,
      type: "Text",
      unique: false,
    },
    {
      fullName: "Textarea01__c",
      externalId: false,
      label: "Textarea #01",
      required: false,
      trackTrending: false,
      type: "TextArea",
    },
    {
      fullName: "Textarea02__c",
      externalId: false,
      label: "Textarea #02",
      required: false,
      trackTrending: false,
      type: "TextArea",
    },
    {
      fullName: "Picklist01__c",
      externalId: false,
      label: "Picklist #01",
      required: false,
      trackTrending: false,
      type: "Picklist",
      valueSet: {
        restricted: false,
        valueSetDefinition: {
          sorted: false,
          value: [
            {
              fullName: "1",
              default: false,
              label: "Yes",
            },
            {
              fullName: "2",
              default: false,
              label: "No",
            },
          ],
        },
      },
    },
    {
      fullName: "Picklist02__c",
      externalId: false,
      label: "Picklist #02",
      required: false,
      trackTrending: false,
      type: "Picklist",
      valueSet: {
        restricted: false,
        valueSetDefinition: {
          sorted: false,
          value: [
            {
              fullName: "0",
              default: false,
              label: "Not Known",
            },
            {
              fullName: "1",
              default: false,
              label: "Male",
            },
            {
              fullName: "2",
              default: false,
              label: "Female",
            },
            {
              fullName: "9",
              default: false,
              label: "Not Applicable",
            },
          ],
        },
      },
    },
    {
      fullName: "Date01__c",
      externalId: false,
      label: "Date #01",
      required: false,
      trackTrending: false,
      type: "Date",
    },
    {
      fullName: "Date02__c",
      externalId: false,
      label: "Date #02",
      required: false,
      trackTrending: false,
      type: "Date",
    },
    {
      fullName: "Datetime01__c",
      externalId: false,
      label: "Datetime #01",
      required: false,
      trackTrending: false,
      type: "DateTime",
    },
    {
      fullName: "Datetime02__c",
      externalId: false,
      label: "Datetime #02",
      required: false,
      trackTrending: false,
      type: "DateTime",
    },
    {
      fullName: "Parent__c",
      externalId: false,
      label: "Parent",
      referenceTo: sobject,
      relationshipLabel: "Children",
      relationshipName: "Children",
      required: false,
      trackTrending: false,
      type: "Lookup",
    },
  ];

  await createFormulaObjectFields(sobject, fields);

  const formulaFields = formulaDefs.map((fd, i) => ({
    fullName: `Formula${zeropad(i + 1)}__c`,
    externalId: false,
    formula: escapeXml(fd.formula),
    formulaTreatBlanksAs: fd.blankAsZero ? "BlankAsZero" : "BlankAsBlank",
    label: `Formula #${zeropad(i + 1)}`,
    required: false,
    trackTrending: false,
    ...(typeof fd.precision !== "undefined" && typeof fd.scale !== "undefined"
      ? { precision: fd.precision, scale: fd.scale }
      : {}),
    ...(fd.type !== "Currency" && fd.type !== "Checkbox"
      ? { unique: false }
      : {}),
    type: fd.type,
  }));

  // request field definition in serveral batches
  // in order to avoid 'unexpected error' in server
  // when creating many formula fields at once
  const MAX_BATCH_FIELD_NUM = 30;
  for (let i = 0; i < formulaFields.length; i += MAX_BATCH_FIELD_NUM) {
    await createFormulaObjectFields(
      sobject,
      formulaFields.slice(i, i + MAX_BATCH_FIELD_NUM)
    );
  }

  console.log("Created formula test schema");
  const profile = await conn.metadata.read("Profile", "Admin");
  await conn.metadata.update("Profile", {
    fullName: "Admin",
    fieldPermissions: profile.fieldPermissions.map((fp) =>
      fp.field.indexOf(`${sobject}.`) === 0
        ? {
            ...fp,
            readable: true,
            editable:
              fp.field.indexOf(`${sobject}.Formula`) === 0 ? false : true,
          }
        : fp
    ),
  });
  console.log("Update field permissions");
}
