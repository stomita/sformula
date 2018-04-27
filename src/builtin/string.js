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
  'FIND': {
    value: (search: ?string, str: ?string, start?: ?number) => {
      if (str == null || str === '' || search == null || search === '' ||
          (start != null && start <= 0)) {
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
      if (str == null || str === '' || num == null) {
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
      if (str == null || str === '' || num == null) {
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
      if (str == null || str === '' || start == null || num == null) {
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
};
