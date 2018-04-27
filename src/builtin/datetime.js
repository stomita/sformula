/* @flow */
import { DateTime } from 'luxon';
import { applyScale } from '../cast';
import { MSECS_IN_DAY, ISO8601_DATETIME_FORMAT } from './constants';
import type { MaybeTypeAnnotated } from '../types';

/**
 * 
 */
export default {
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
};
