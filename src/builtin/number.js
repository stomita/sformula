/* @flow */
import type { MaybeTypeAnnotated } from '../types';

/**
 * 
 */
export default {
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
  'ROUND': {
    value: (value: MaybeTypeAnnotated<?number>, digits: MaybeTypeAnnotated<?number>) => {
      let v, vType, d, dType;
      if (Array.isArray(value)) {
        [v, vType] = value;
      } else {
        v = value;
      }
      if (Array.isArray(digits)) {
        [d, dType] = digits;
      } else {
        d = digits;
      }
      if (v == null || d == null) { return null; }
      let factor = 10 ** Math.floor(d);
      if (vType === 'percent') {
        factor = factor * 0.01;
      }
      return Math.round(v * factor) / factor;
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
      }, {
        argument: { type: 'number' },
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
  'SQRT': {
    value: (n: ?number) => {
      if (n == null || n < 0) { return null; }
      return Math.sqrt(n);
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
    value: (num: MaybeTypeAnnotated<?number>, div: MaybeTypeAnnotated<?number>) => {
      let n, nType, d, dType;
      if (Array.isArray(num)) {
        [n, nType] = num;
      } else {
        n = num;
      }
      if (Array.isArray(div)) {
        [d, dType] = div;
      } else {
        d = div;
      }
      if (n == null || d == null) { return null; }
      if (d === 0) { return n; }
      if (nType === 'percent') {
        return ((n * 0.01) % d) * 100;
      }
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
};
