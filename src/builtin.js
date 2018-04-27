/* @flow */
import { DateTime } from 'luxon';
import { applyScale } from './cast';
import type {
  Context, ExpressionType, ExpressionTypeDictionary,
} from './types';

const MSECS_IN_DAY = 24 * 60 * 60 * 1000;

// Salesforce always returns Datetime value in iso8601 with zero timezone offset (+0000)
const ISO8601_DATETIME_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSZZZ';

type MaybeTypeAnnotated<T> = T | [T, string, ?number, ?number];

const builtins = {
  'TEXT': {
    value: (value: MaybeTypeAnnotated<string | number | boolean | null>) => {
      let v, vType, precision, scale;
      if (Array.isArray(value)) {
        [v, vType, precision, scale] = value;
      } else {
        v = value;
      }
      if (vType === 'datetime') {
        if (v == null) { return 'Z'; }
        if (typeof v !== 'string') { v = String(v); }
        const dt = DateTime.fromISO(v);
        if (!dt.isValid) { return null; }
        return dt.toUTC().toFormat('yyyy-MM-dd HH:mm:ss\'Z\'');
      }
      if (v == null) { return null; }
      if (typeof v === 'number') {
        if (vType === 'percent') {
          v = v * 0.01;
        }
        if (typeof scale === 'number' && (vType === 'number' || vType === 'currency' || vType === 'percent')) {
          v = applyScale(v, scale);
        }
        if (vType === 'percent') {
          const sign = v >= 0 ? 1 : -1;
          const vstr = String(v * sign);
          return (sign === 1 ? '' : '-') + (vstr[0] === '0' && vstr[1] === '.' ? vstr.substring(1) : vstr);
        }
      }
      return String(v);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'boolean',
          }, {
            type: 'currency',
          }, {
            type: 'number',
          }, {
            type: 'percent',
          }, {
            type: 'date',
          }, {
            type: 'datetime',
          }, {
            type: 'picklist',
          }],
        },
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
      let dt = DateTime.fromISO(s, { zone: 'utc' });
      if (!dt.isValid) {
        dt = DateTime.fromFormat(s, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
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
  'YEAR': {
    value: (s: ?string) => {
      if (s == null || s === '') {
        return null;
      }
      const dt = DateTime.fromISO(s);
      return dt.isValid ? dt.year : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  'MONTH': {
    value: (s: ?string) => {
      if (s == null || s === '') {
        return null;
      }
      const dt = DateTime.fromISO(s);
      return dt.isValid ? dt.month : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  'DAY': {
    value: (s: ?string) => {
      if (s == null || s === '') {
        return null;
      }
      const dt = DateTime.fromISO(s);
      return dt.isValid ? dt.day : null;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  'TODAY': {
    value: () => {
      return DateTime.local().toISODate();
    },
    type: {
      type: 'function',
      arguments: [],
      returns: { type: 'date' },
    },
  },
  'NOW': {
    value: () => {
      return DateTime.utc().toFormat(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: 'function',
      arguments: [],
      returns: { type: 'datetime' },
    },
  },
  'AND': {
    value: (...conds: Array<?boolean>) => {
      let ret = true;
      for (const c of conds) {
        if (c === false) {
          return false;
        }
        if (c == null) { ret = null; }
      }
      return ret;
    },
    type: {
      type: 'function',
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: { type: 'boolean' },
        optional: i > 0,
      })),
      returns: { type: 'boolean' },
    },
  },
  'OR': {
    value: (...conds: Array<?boolean>) => {
      let ret = false;
      for (const c of conds) {
        if (c === true) {
          return true;
        }
        if (c == null) { ret = null; }
      }
      return ret;
    },
    type: {
      type: 'function',
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: { type: 'boolean' },
        optional: i > 0,
      })),
      returns: { type: 'boolean' },
    },
  },
  'NOT': {
    value: (v: ?boolean) => {
      if (v == null) { return null; }
      return !v;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'boolean' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  'CASE': {
    value: (...args: Array<?any>) => {
      const value = args[0] == null ? '' : args[0];
      for (let i = 1; i < args.length - 1; i += 2) {
        const match = args[i] == null ? '' : args[i];
        const ret = args[i + 1];
        if (match === value) {
          return ret;
        }
      }
      return args[args.length - 1];
    },
    type: {
      type: 'function',
      arguments: (argLen: number) => {
        const repeatCnt = Math.max(Math.floor((argLen - 2) / 2), 1); 
        return [
          {
            argument: { type: 'template', ref: 'T' },
            optional: false,
          },
          ...Array.from({ length: repeatCnt }).reduce((cases) => [
            ...cases,
            {
              argument: { type: 'template', ref: 'T' }, // T || S
              optional: false,
            }, {
              argument: { type: 'template', ref: 'S' },
              optional: false,
            },
          ], []),
          {
            argument: { type: 'template', ref: 'S' },
            optional: false,
          }
        ];
      },
      returns: { type: 'template', ref: 'S' },
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
  'ISNUMBER': {
    value: (value: ?string) => {
      if (value == null || value == '') { return false; } 
      return !Number.isNaN(Number(value));
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'boolean' },
    },
  },
  'ISPICKVAL': {
    value: (v: ?string, s: ?string) => {
      if (v == null || s == null) { return false; }
      return (v || '') === (s || '');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'picklist' },
        optional: false,
      }, {
        argument: { type: 'string' },
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
  'ABS': {
    value: (v: ?number) => {
      return v == null ? null : v >= 0 ? v : -v;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent',
          }],
        },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'CEILING': {
    value: (value: MaybeTypeAnnotated<?number>) => {
      let v, vType;
      if (Array.isArray(value)) {
        [v, vType] = value;
      } else {
        v = value;
      }
      if (v == null) { return null; }
      if (vType === 'percent') {
        return v >= 0 ? Math.ceil(v * 0.01) * 100 : -Math.ceil(-v * 0.01) * 100;
      }
      return v >= 0 ? Math.ceil(v) : -Math.ceil(-v);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent',
          }],
        },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'FLOOR': {
    value: (value: MaybeTypeAnnotated<?number>) => {
      let v, vType;
      if (Array.isArray(value)) {
        [v, vType] = value;
      } else {
        v = value;
      }
      if (v == null) { return null; }
      if (vType === 'percent') {
        return v >= 0 ? Math.floor(v * 0.01) * 100 : -Math.floor(-v * 0.01) * 100;
      }
      return v >= 0 ? Math.floor(v) : -Math.floor(-v);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent',
          }],
        },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'MCEILING': {
    value: (value: MaybeTypeAnnotated<?number>) => {
      let v, vType;
      if (Array.isArray(value)) {
        [v, vType] = value;
      } else {
        v = value;
      }
      if (v == null) { return null; }
      if (vType === 'percent') {
        return Math.ceil(v * 0.01) * 100;
      }
      return Math.ceil(v);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent',
          }],
        },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'MFLOOR': {
    value: (value: MaybeTypeAnnotated<?number>) => {
      let v, vType;
      if (Array.isArray(value)) {
        [v, vType] = value;
      } else {
        v = value;
      }
      if (v == null) { return null; }
      if (vType === 'percent') {
        return Math.floor(v * 0.01) * 100;
      }
      return Math.floor(v);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent',
          }],
        },
        optional: false,
      }],
      returns: { type: 'template', ref: 'T' },
    },
  },
  'EXP': {
    value: (n: ?number) => {
      if (n == null) { return null; }
      return Math.pow(Math.E, n);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  'LN': {
    value: (n: ?number) => {
      if (n == null || n <= 0) { return null; }
      return Math.log(n);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  'LOG': {
    value: (n: ?number) => {
      if (n == null || n <= 0) { return null; }
      return Math.log10(n);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  'MAX': {
    value: (...nums: Array<MaybeTypeAnnotated<?number>>) => {
      let max = null;
      for (const num of nums) {
        let n, nType;
        if (Array.isArray(num)) {
          [n, nType] = num;
        } else {
          n = num;
        }
        if (n == null) { return null; }
        if (nType === 'percent') { n = n * 0.01; }
        if (max == null || max < n) { max = n; }
      }
      return max;
    },
    type: {
      type: 'function',
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: {
          type: 'template',
          ref: `T${i}`,
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent'
          }],
        },
        optional: i > 0,
      })),
      returns: { type: 'number' },
    },
  },
  'MIN': {
    value: (...nums: Array<MaybeTypeAnnotated<?number>>) => {
      let min = null;
      for (const num of nums) {
        let n, nType;
        if (Array.isArray(num)) {
          [n, nType] = num;
        } else {
          n = num;
        }
        if (n == null) { return null; }
        if (nType === 'percent') { n = n * 0.01; }
        if (min == null || min > n) { min = n; }
      }
      return min;
    },
    type: {
      type: 'function',
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: {
          type: 'template',
          ref: `T${i}`,
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent'
          }],
        },
        optional: i > 0,
      })),
      returns: { type: 'number' },
    },
  },
  'MOD': {
    value: (n: ?number, d: ?number) => {
      if (n == null || d == null) { return null; }
      if (d === 0) { return n; }
      return n % d;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: {
          type: 'template',
          ref: 'T',
          anyOf: [{
            type: 'number',
          }, {
            type: 'currency',
          }, {
            type: 'percent'
          }],
        },
        optional: false,
      }, {
        argument: { type: 'number' },
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
  '$$MINUS_NUMBER$$': {
    value: (n: ?number) => {
      if (n == null) { return null; }
      return -n;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$PLUS_NUMBER$$': {
    value: (n: ?number) => {
      if (n == null) { return null; }
      return +n;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
  '$$LT_NUMBER$$': {
    value: (n1: ?number, n2: ?number) => {
      if (n1 == null || n2 == null) { return null; }
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
      if (n1 == null || n2 == null) { return null; }
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
      if (n1 == null || n2 == null) { return null; }
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
      if (n1 == null || n2 == null) { return null; }
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
      if (n1 == null || n2 == null) { return null; }
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
      if (n1 == null || n2 == null) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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
      if (d1 == null || d2 == null) { return null; }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) { return null; }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) { return null; }
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