/* @flow */
import jsforce from 'jsforce';
import AdmZip from 'adm-zip';
import metadata from 'salesforce-metadata-xml-builder';
import type { FormulaDef } from './formulaDef';
import { zeropad, escapeXml } from '.';

/**
 * 
 */
const _conn =
  process.env.SF_CONNECTION_NAME ?
  jsforce.registry.getConnection(process.env.SF_CONNECTION_NAME) :
  new jsforce.Connection();

_conn.metadata.pollInterval = 5000;
_conn.metadata.pollTimeout = 60000;

let _loggedIn
if (process.env.SF_USERNAME && process.env.SF_PASSWORD) {
  _loggedIn = _conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);
} else {
  _loggedIn = _conn.identity();
}

/**
 * 
 */
export async function describe(sobject: string) {
  await _loggedIn;
  return new Promise((resolve, reject) => {
    _conn.describe$(sobject, (err, ret) => err ? reject(err) : resolve(ret));
  });
}

/**
 * 
 */
export async function resetFormulaSchema(sobject: string) {
  await _loggedIn;
  const packageXml = metadata.Package({
    version: '42.0',
  });
  const destructiveChangesXml = metadata.Package({
    types: [{
      name: 'CustomObject', members: [sobject]
    }],
    version: '42.0',
  });
  const zip = new AdmZip();
  zip.addFile('src/package.xml', new Buffer(packageXml));
  zip.addFile('src/destructiveChanges.xml', new Buffer(destructiveChangesXml));
  const res = await _conn.metadata.deploy(zip.toBuffer(), { purgeOnDelete: true }).complete({ details: true });
  console.log('Deleted existing formula test schema');
}

export async function createFormulaSchema(sobject: string, formulaDefs: FormulaDef[]) {
  await _loggedIn;
  const fields = [{
    type: 'Checkbox',
    fullName: 'Checkbox01__c',
    defaultValue: false,
    externalId: false,
    label: 'Checkbox #01',
    trackTrending: false,
  }, {
    type: 'Checkbox',
    fullName: 'Checkbox02__c',
    defaultValue: false,
    externalId: false,
    label: 'Checkbox #02',
    trackTrending: false,
  }, {
    fullName: 'Number01__c',
    externalId: false,
    label: 'Number #01',
    precision: 18,
    required: false,
    scale: 0,
    trackTrending: false,
    type: 'Number',
    unique: false,
  }, {
    fullName: 'Number02__c',
    externalId: false,
    label: 'Number #02',
    precision: 18,
    required: false,
    scale: 0,
    trackTrending: false,
    type: 'Number',
    unique: false,
  }, {
    fullName: 'Text01__c',
    externalId: false,
    label: 'Text #01',
    length: 255,
    required: false,
    trackTrending: false,
    type: 'Text',
    unique: false,
  }, {
    fullName: 'Text02__c',
    externalId: false,
    label: 'Text #02',
    length: 255,
    required: false,
    trackTrending: false,
    type: 'Text',
    unique: false,
  }, {
    fullName: 'Textarea01__c',
    externalId: false,
    label: 'Textarea #01',
    required: false,
    trackTrending: false,
    type: 'TextArea',
  }, {
    fullName: 'Textarea02__c',
    externalId: false,
    label: 'Textarea #02',
    required: false,
    trackTrending: false,
    type: 'TextArea',
  }, {
    fullName: 'Date01__c',
    externalId: false,
    label: 'Date #01',
    required: false,
    trackTrending: false,
    type: 'Date',
  }, {
    fullName: 'Date02__c',
    externalId: false,
    label: 'Date #02',
    required: false,
    trackTrending: false,
    type: 'Date',
  }, {
    fullName: 'Datetime01__c',
    externalId: false,
    label: 'Datetime #01',
    required: false,
    trackTrending: false,
    type: 'DateTime',
  }, {
    fullName: 'Datetime02__c',
    externalId: false,
    label: 'Datetime #02',
    required: false,
    trackTrending: false,
    type: 'DateTime',
  }, {
    fullName: 'Parent__c',
    externalId: false,
    label: 'Parent',
    referenceTo: sobject,
    relationshipLabel: 'Children',
    relationshipName: 'Children',
    required: false,
    trackTrending: false,
    type: 'Lookup',
  }];

  const formulaFields = formulaDefs.map((fd, i) => ({
    fullName: `Formula${zeropad(i + 1)}__c`, 
    externalId: false,
    formula: escapeXml(fd.formula),
    formulaTreatBlanksAs: fd.blankAsZero ? 'BlankAsZero' : 'BlankAsBlank',
    label: `Formula #${zeropad(i + 1)}`,
    required: false,
    trackTrending: false,
    ...(
      typeof fd.precision !== 'undefined' && typeof fd.scale !== 'undefined' ?
      { precision: fd.precision, scale: fd.scale } :
      {}
    ),
    ...(
      fd.type !== 'Currency' && fd.type !== 'Checkbox' ?
      { unique: false } :
      {}
    ),
    type: fd.type,
  })); 

  const label = sobject.replace(/__c$/, '');
  const objectXml = metadata.CustomObject({
    fullName: sobject,
    fields: [
      ...fields,
      ...formulaFields
    ],
    label,
    pluralLabel: label,
    nameField: {
      type: 'AutoNumber',
      fullName: 'Name',
      label: '#'
    },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite'
  });
  const packageXml = metadata.Package({
    types: [{
      name: 'CustomObject', members: [sobject]
    }, {
      name: 'CustomField',
      members: [...fields, ...formulaFields].map(fd => `${sobject}.${fd.fullName}`),
    }],
    version: '42.0',
  });
  const zip = new AdmZip();
  zip.addFile('src/package.xml', new Buffer(packageXml));
  zip.addFile(`src/objects/${sobject}.object`, new Buffer(objectXml));
  const res = await _conn.metadata.deploy(zip.toBuffer()).complete({ details: true });
  if (res.status !== 'Succeeded') {
    console.error(res.details);
    throw new Error('Schema creation failed');
  }
  console.log('Created formula test schema');
  const profile = await _conn.metadata.read('Profile', 'Admin');
  await _conn.metadata.update('Profile', {
    fullName: 'Admin',
    fieldPermissions: profile.fieldPermissions.map((fp) => (
      fp.field.indexOf(`${sobject}.`) === 0 ?
      {
        ...fp,
        readable: true,
        editable: fp.field.indexOf(`${sobject}.Formula`) === 0 ? false : true,
      } :
      fp
    )),
  });
  console.log('Update field permissions');
}


export async function createAndFetchRecord(record: any) {
  if (record.Parent__r) {
    const pret = await _conn.sobject('FormulaTest__c').create(record.Parent__r);
    record = { ...record };
    delete record.Parent__r;
    record.Parent__c = pret.id;
  }
  const ret = await _conn.sobject('FormulaTest__c').create(record);
  if (!ret.success) {
    throw new Error(ret.errors[0].message);
  }
  const rec = await _conn.sobject('FormulaTest__c').findOne({ Id: ret.id }, '*, Parent__r.*');
  return rec;
}

