/* @flow */
import type { MaybeTypeAnnotated } from '../types';

/**
 * 
 */
export default {
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
};
