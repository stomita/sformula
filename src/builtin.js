/* @flow */
import moment from 'moment';
import type {
  Context, ExpressionType, ExpressionTypeDictionary,
} from './types';

const MSECS_IN_DAY = 24 * 60 * 60 * 1000;

const builtins = {
  'TEXT': {
    value: (v: any) => {
      const ret = v == null ? null : String(v);
      // console.log('TEXT() ', v, '=>', JSON.stringify(ret));
      return ret;
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
  'TODAY': {
    value: () => {
      return moment().format('YYYY-MM-DD');
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
      return moment(d).add(Math.floor(n), 'days').format('YYYY-MM-DD');
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
      return moment(d).add(Math.floor(-n), 'days').format('YYYY-MM-DD');
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
      return moment(d1).diff(d2, 'days');
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
      return moment(d1).isBefore(d2);
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
      return moment(d1).isSameOrBefore(d2);
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
      return moment(d1).isAfter(d2);
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
      return moment(d1).isSameOrAfter(d2);
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
      return moment(d1).isSame(d2);
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
      return !moment(d1).isSame(d2);
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
      return moment(d).add(n * MSECS_IN_DAY, 'milliseconds').toISOString();
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
      return moment(d).add(-n * MSECS_IN_DAY, 'milliseconds').toISOString();
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
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return null; }
      return moment(d1).diff(d2, 'milliseconds') / MSECS_IN_DAY;
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
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) { return false; }
      return moment(d1).isBefore(d2);
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
      return moment(d1).isSameOrBefore(d2);
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
      return moment(d1).isAfter(d2);
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
      return moment(d1).isSameOrAfter(d2);
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
      return moment(d1).isSame(d2);
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
      return !moment(d1).isSame(d2);
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
      return moment(d).utc().format('YYYY-MM-DD HH:mm:ss[Z]');
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