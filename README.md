# sformula [![CircleCI](https://circleci.com/gh/stomita/sformula.svg?style=svg)](https://circleci.com/gh/stomita/sformula)

Library for parsing / evaluating Salesforce formula in client-side (JavaScript).
Most of built-in functions in Salesforce are also ready-to-use and highly compatible with the original.

## Install

```
$ npm i sformula
```

## Usage

If the formula has no field reference, simply use `parseSync()` without any options.

```javascript
import { parseSync } from 'sformula';
// const { parseSync } = require('sformula');

const fml = parseSync('TODAY() + 1');
console.log(fml.evaluate()) // => (Tomorrow date will be shown)
```

Salesforce formula requires field types in the formula to parse and evaluate correctly.
For example, consider a formula like `Field01__c + Field02__c`.
The `Field01__c` and `Field02__c` fields might be both Number fields, or they might be Text fields.
Another possible case is `Field01__c` is Date/Datetime and `Field02__c` is Number.

So we need to add type annotation correctly when parsing the formula.
To parse the formula with field references, add `fieldTypes` option to annotate field types.

```javascript
import { parseSync } from 'sformula';

const fml = parseSync('FirstName__c & " " & LastName__c', {
  fieldTypes: {
    FirstName__c: { type: 'string' },
    LastName__c: { type: 'string' },
  },
})
const ret1 = fml.evaluate({ LastName__c: 'Due', FirstName__c: 'John' });
console.log(ret1); // 'John Due'
const ret2 = fml.evaluate({ FirstName__c: 'Jane' });
console.log(ret2); // 'Jane'
```

To add type annotation to the fields through relatinoship, write like below:

```javascript
import { parseSync } from 'sformula';

const fml = parseSync('Account__r.Name & " - " & Name', {
  fieldTypes: {
    Account__r: {
      type: 'object',
      properties: {
        Name: { type: 'string' },
      },
    },
    Name: { type: 'string' },
  },
})
const ret = fml.evaluate({ Account__r: { Name: 'Sunny, Inc.' }, Name: '10 Licenses' });
console.log(ret); // 'Sunny, Inc. - 10 Licenses'
```

The `returnType` option is used to cast the result type of the formula, which must be compatible with the calculated type from the formula.
Also, you can pass `blankAsZero` option when you want to regard the null value as zero (by default it is treated as blank).

```javascript
import { parseSync } from 'sformula';

const fml = parseSync('CreatedDate - Offset__c', {
  fieldTypes: {
    CreatedDate: { type: 'datetime' },
    Offset__c: { type: 'number', precision: 18, scale: 2 },
  },
  blankAsZero: true,
  returnType: 'date'
})
const ret1 = fml.evaluate({ CreatedDate: '2018-01-01T10:00:00.000Z', Offset__c: 0.5 });
console.log(ret1); // '2018-12-31'
const ret2 = fml.evaluate({ CreatedDate: '2018-01-01T10:00:00.000Z' });
console.log(ret2); // '2018-01-01'
```

Are you tired to add type annotation by yourself ? OK, now it's time to tell the asynchronous `parse()` function and describer option.
In `parse()` you can pass an asynchronous function to describe field types, and the parser will detect the field types if it has entry in the described result. As a describer function you can simply use [JSforce](https://jsforce.github.io) describe method, but not limited to.

```javascript
import { parse } from 'sformula';
import jsforce from 'jsforce';

const conn = new jsforce.Connection();
conn.login('username@domain.org', 'password123');

// ...

parse('IF(CONTAINS(Owner.Title, "Engineer"), Number01__c + 2.5, Number02__c * 0.5)', {
  sobject: 'CustomObject01__c', // root object name
  describe: (sobject) => conn.describe(sobject), // (sobject: string) => Promise<DescribeSObjectResult>
  blankAsZero: true,
  returnType: 'number',
  scale: 2
}).then((fml) => {
  const ret1 = fml.evaluate({
    Owner: { Id: '0057F000002wf0WQAQ', Name: 'John Due', Title: 'Software Engineer' },
    Number02__c: 7,
  });
  console.log(ret1); // 2.5
  const ret2 = fml.evaluate({
    Owner: { Id: '00528000002J6BkAAK', Name: 'Jane Due', Title: 'Accountant' },
    Number01__c: 11.5,
    Number02__c: 7,
  });
  console.log(ret2); // 3.5
});

```

## Supported Functions

### Date / Datetime Functions

- [x] ADDMONTHS
- [x] DATE
- [x] DATEVALUE
- [x] DATETIMEVALUE
- [ ] TIMEVALUE
- [x] YEAR
- [x] MONTH
- [x] DAY
- [ ] WEEKDAY
- [ ] HOUR
- [ ] MINUTE
- [ ] SECOND
- [ ] MILLISECOND
- [x] TODAY
- [x] NOW
- [ ] TIMENOW

### Logical Functions

- [x] AND
- [x] OR
- [x] NOT
- [x] CASE
- [x] IF
- [x] ISNULL
- [x] ISBLANK
- [x] ISNUMBER
- [x] NULLVALUE
- [x] BLANKVALUE

### Calculation Functions

- [x] ABS
- [x] CEILING
- [x] FLOOR
- [x] ROUND
- [x] MCEILING
- [x] MFLOOR
- [x] EXP
- [x] LN
- [x] LOG
- [x] SQRT
- [x] MAX
- [x] MIN
- [x] MOD
- [ ] GEOLOCATION
- [ ] DISTANCE

### Text Functions

- [x] BEGINS
- [x] CONTAINS
- [ ] INCLUDES
- [x] ISPICKVAL
- [x] FIND
- [x] LEFT
- [x] RIGHT
- [x] MID
- [x] LOWER
- [x] UPPER
- [x] LPAD
- [x] RPAD
- [x] SUBSTITUTE
- [x] TRIM
- [x] LEN
- [x] TEXT 
- [x] VALUE
- [ ] CASESAFEID
- [ ] ~~BR~~ *(will not be supported)*
- [ ] ~~GETSESSIONID~~ *(will not be supported)*
- [ ] ~~HYPERLINK~~ *(will not be supported)*
- [ ] ~~IMAGE~~ *(will not be supported)*

### Other Functions

- [ ] CURRENCYRATE


## Limitations

* Salesforce formula is "case-insensitive". For example, when `IF(Field01__c > Field02__c, Owner.LastName, "-")` is valid `if(FIELD01__c > field02__c, owner.lastName, "-")` is also a valid formula and yields same result. For implementation reason, sformula treats formula as "case-sensitive", which always requires functions to be written in UPPERCASE chars, fields to be written as same as which is defined in the API reference name.

* Global field references (fields under "$-prefixed" objects like `$Label`, `$User`, ...) are not currently supported.
