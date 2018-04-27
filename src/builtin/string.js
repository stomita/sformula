/* @flow */
import { DateTime } from 'luxon';
import { applyScale } from '../cast';
import type { MaybeTypeAnnotated } from '../types';

/**
 * 
 */
export default {
  'BEGINS': {
    value: (str: ?string, cstr: ?string) => {
      if (str == null || cstr == null) { return null; }
      return str.indexOf(cstr) === 0;
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
  'CONTAINS': {
    value: (str: ?string, cstr: ?string) => {
      if (str == null || cstr == null) { return null; }
      return str.indexOf(cstr) >= 0;
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
  'FIND': {
    value: (search: ?string, str: ?string, start?: ?number) => {
      if (!str || !search || (start != null && start <= 0)) {
        return 0;
      }
      return str.indexOf(search || '', (start || 1) - 1) + 1;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: true,
      }],
      returns: { type: 'number' },
    },
  },
  'LEFT': {
    value: (str: ?string, num: ?number) => {
      if (!str || num == null) {
        return '';
      }
      return str.substring(0, num);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'RIGHT': {
    value: (str: ?string, num: ?number) => {
      if (!str || num == null) {
        return '';
      }
      return str.substring(str.length - num);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'MID': {
    value: (str: ?string, start: ?number, num: ?number) => {
      if (!str || start == null || num == null) {
        return '';
      }
      if (start <= 0) { start = 1; }
      if (num < 0) { num = 0; }
      return str.substring(start - 1, start + num - 1);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'LOWER': {
    value: (str: ?string) => {
      if (str == null) { return ''; }
      return str.toLowerCase();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'UPPER': {
    value: (str: ?string) => {
      if (str == null) { return ''; }
      return str.toUpperCase();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'LPAD': {
    value: (str: ?string, len: ?number, pstr?: ?string = ' ') => {
      if (!str || !pstr || len == null) { return ''; }
      const pchars = pstr || ' ';
      const plen = len > str.length ? len - str.length : 0;
      const padded = Array.from({ length: plen }).map((_, i) => pchars[i % pchars.length]).join('');
      return (padded + str).substring(0, len);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: true,
      }],
      returns: { type: 'string' },
    },
  },
  'RPAD': {
    value: (str: ?string, len: ?number, pstr?: ?string = ' ') => {
      if (!str || !pstr || len == null) { return ''; }
      const pchars = pstr || ' ';
      const plen = len > str.length ? len - str.length : 0;
      const padded = Array.from({ length: plen }).map((_, i) => pchars[i % pchars.length]).join('');
      return (str + padded).substring(0, len);
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'number' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: true,
      }],
      returns: { type: 'string' },
    },
  },
  'SUBSTITUTE': {
    value: (str: ?string, search: ?string, replacement: ?string) => {
      if (!str) { return ''; }
      if (!search) { return str; }
      return str.split(search).join(replacement || '');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: false,
      }, {
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'TRIM': {
    value: (str: ?string) => {
      if (str == null) { return null; }
      return str.replace(/^\s+|\s+$/g, '');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'string' },
    },
  },
  'LEN': {
    value: (str: ?string) => {
      if (str == null) { return null; }
      return str.length;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
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
  'VALUE': {
    value: (str: ?string) => {
      if (!str || /^\-?0[box]/i.test(str)) { return null; }
      const n = Number(str);
      return Number.isNaN(n) ? null : n;
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'string' },
        optional: false,
      }],
      returns: { type: 'number' },
    },
  },
};
