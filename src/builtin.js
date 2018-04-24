/* @flow */
import { DateTime } from 'luxon';
import type {
  Context, ExpressionType, ExpressionTypeDictionary,
} from './types';

const MSECS_IN_DAY = 24 * 60 * 60 * 1000;

// Salesforce always returns Datetime value in iso8601 with zero timezone offset (+0000)
const ISO8601_DATETIME_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSZZZ';

const builtins = {
  'TEXT': {
    value: (v: any) => {
      return v == null ? null : String(v);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'any' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'ADDMONTHS': {
    value: (d: ?string, n: ?number) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = DateTime.fromISO(d);
      return dt.isValid ? dt.plus({ months: n }).toISODate() : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  'DATE': {
    value: (y: ?number, m: ?number, d: ?number) => {
      if (y == null || m == null || d == null || y > 9999) {
        return null;
      }
      const dd = DateTime.utc(y, m, d);
      return dd.isValid ? dd.toISODate() : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  'DATETIMEVALUE': {
    value: (s: ?string) => {
      if (s == null || s === '') {
        return null;
      }
      let dt = DateTime.fromISO(s);
      if (!dt.isValid) {
        dt = DateTime.fromFormat(s + '+0000', 'yyyy-MM-dd HH:mm:ssZZZ');
      }
      return dt.isValid ? dt.toUTC().toFormat(ISO8601_DATETIME_FORMAT) : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'any' },
        optional: false,
      }],
      returns: { type: 'datetime' },
    },
  },
  'DATEVALUE': {
    value: (s: ?string) => {
      if (s == null || s === '') {
        return null;
      }
      const dt = DateTime.fromISO(s);
      return dt.isValid ? dt.toISODate() : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'any' },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  'TODAY': {
    value: () => {
      return DateTime.utc().toISODate();
    },
    type: {
      type: 'function',
      arguments: [],
      returns: { type: 'date' },
    },
  },
  'IF': {
    value: (test: boolean, cons: any, alt: any) => {
      return test ? cons : alt;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'boolean' },
        optional: false,
      }, {
        argument: { type: 'template', ref: 'T' },
        optional: false,
      }, {
        argument: { type: 'template', ref: 'T' },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'ISNULL': {
    value: (value: any) => {
      return value == null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'any' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  'ISBLANK': {
    value: (value: any) => {
      return value == null || value === '';
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'any' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  'NULLVALUE': {
    value: (value: any, alt: any) => {
      return value == null ? alt : value;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'template', ref: 'T' },
        optional: false,
      }, {
        argument: { type: 'template', ref: 'T' },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'BLANKVALUE': {
    value: (value: any, alt: any) => {
      return (value == null || value === '' ? alt : value);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'template', ref: 'T' },
        optional: false,
      }, {
        argument: { type: 'template', ref: 'T' },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },


  // builtin operators 
  '$$CONCAT_STRING$$': {
    value: (s1: ?string, s2: ?string) => {
      return (s1 || '') + (s2 || '');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  '$$EQ_STRING$$': {
    value: (s1: ?string, s2: ?string) => {
      return (s1 || '') === (s2 || '');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$NEQ_STRING$$': {
    value: (s1: ?string, s2: ?string) => {
      return (s1 || '') !== (s2 || '');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$ADD_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return null; }
      return n1 + n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$SUBTRACT_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return null; }
      return n1 - n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$MULTIPLY_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return null; }
      return n1 * n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$DIVIDE_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null || n2 === 0) { return null; }
      return n1 / n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$POWER_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return null; }
      return n1 ** n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$LT_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return false; }
      return n1 < n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$LTE_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return false; }
      return n1 <= n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$GT_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return false; }
      return n1 > n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$GTE_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return false; }
      return n1 >= n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$EQ_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return false; }
      return n1 === n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$NEQ_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return false; }
      return n1 !== n2;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$ADD_DATE$$': {
    value: (d: string, n: number) => {
      if (d == null || n == null) { return null; }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) { return null; }
      return dt.plus({ day: n }).toISODate();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  '$$SUBTRACT_DATE$$': {
    value: (d: ?string, n: ?number) => {
      if (d == null || n == null) { return null; }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) { return null; }
      return dt.plus({ day: -n }).toISODate();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  '$$DIFF_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
      return dt1.diff(dt2, 'days').as('days');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$LT_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return dt1.valueOf() < dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$LTE_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return dt1.valueOf() <= dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$GT_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return dt1.valueOf() > dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$GTE_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return dt1.valueOf() >= dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$EQ_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return dt1.hasSame(dt2, 'day');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$NEQ_DATE$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return !dt1.hasSame(dt2, 'day');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$ADD_DATETIME$$': {
    value: (d: ?string, n: ?number) => {
      if (d == null || n == null) { return null; }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) { return null; }
      return dt.plus({ milliseconds: n * MSECS_IN_DAY }).toUTC().toFormat(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'datetime' },
    },
  },
  '$$SUBTRACT_DATETIME$$': {
    value: (d: ?string, n: ?number) => {
      if (d == null || n == null) { return null; }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) { return null; }
      return dt.plus({ milliseconds: -n * MSECS_IN_DAY }).toUTC().toFormat(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'datetime' },
    },
  },
  '$$DIFF_DATETIME$$': {
    value: (d1: ?string, d2: ?string) => {
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
      return dt1.diff(dt2, 'milliseconds').as('milliseconds') / MSECS_IN_DAY;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$LT_DATETIME$$': {
    value: (d1: ?string, d2: ?string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
      return dt1.valueOf() < dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$LTE_DATETIME$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
      return dt1.valueOf() <= dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$GT_DATETIME$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
      return dt1.valueOf() > dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$GTE_DATETIME$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
      return dt1.valueOf() >= dt2.valueOf();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$EQ_DATETIME$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return dt1.hasSame(dt2, 'millisecond');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  '$$NEQ_DATETIME$$': {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return false; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return false; }
      return !dt1.hasSame(dt2, 'millisecond');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },

  // override builtin functions for certain data types
  '$$FN_TEXT_DATETIME$$': {
    value: (d: string) => {
      if (d == null) { return 'Z'; }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) { return null; }
      return dt.toUTC().toFormat('yyyy-MM-dd HH:mm:ss\'Z\'');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
};

export type BuiltinFunctionName = $Keys<typeof builtins>;

const types: ExpressionTypeDictionary = Object.keys(builtins).reduce((types, name) => {
  const type = builtins[name].type;
  return { ...types, [name]: type }; 
}, {});

const context: Context = Object.keys(builtins).reduce((context, name) => {
  const value = builtins[name].value;
  return { ...context, [name]: value }; 
}, {});

export { context, types };