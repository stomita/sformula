import type { Maybe } from "../types";

/**
 *
 */
export default {
  ABS: {
    value: (v: Maybe<number>) => {
      return v == null ? null : v >= 0 ? v : -v;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  CEILING: {
    value: (v: Maybe<number>) => {
      if (v == null) {
        return null;
      }
      return v >= 0 ? Math.ceil(v) : -Math.ceil(-v);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  FLOOR: {
    value: (v: Maybe<number>) => {
      if (v == null) {
        return null;
      }
      return v >= 0 ? Math.floor(v) : -Math.floor(-v);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  ROUND: {
    value: (v: Maybe<number>, d: Maybe<number>) => {
      if (v == null || d == null) {
        return null;
      }
      const factor = 10 ** Math.floor(d);
      return Math.round(v * factor) / factor;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  MCEILING: {
    value: (v: Maybe<number>) => {
      if (v == null) {
        return null;
      }
      return Math.ceil(v);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  MFLOOR: {
    value: (v: Maybe<number>) => {
      if (v == null) {
        return null;
      }
      return Math.floor(v);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  EXP: {
    value: (n: Maybe<number>) => {
      if (n == null) {
        return null;
      }
      return Math.pow(Math.E, n);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  LN: {
    value: (n: Maybe<number>) => {
      if (n == null || n <= 0) {
        return null;
      }
      return Math.log(n);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  LOG: {
    value: (n: Maybe<number>) => {
      if (n == null || n <= 0) {
        return null;
      }
      return Math.log10(n);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  SQRT: {
    value: (n: Maybe<number>) => {
      if (n == null || n < 0) {
        return null;
      }
      return Math.sqrt(n);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  MAX: {
    value: (...nums: Array<Maybe<number>>) => {
      let max = null;
      for (const n of nums) {
        if (n == null) {
          return null;
        }
        if (max == null || max < n) {
          max = n;
        }
      }
      return max;
    },
    type: {
      type: "function",
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: { type: "number" },
        optional: i > 0,
      })),
      returns: { type: "number" },
    },
  },
  MIN: {
    value: (...nums: Array<Maybe<number>>) => {
      let min = null;
      for (const n of nums) {
        if (n == null) {
          return null;
        }
        if (min == null || min > n) {
          min = n;
        }
      }
      return min;
    },
    type: {
      type: "function",
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: { type: "number" },
        optional: i > 0,
      })),
      returns: { type: "number" },
    },
  },
  MOD: {
    value: (n: Maybe<number>, d: Maybe<number>) => {
      if (n == null || d == null) {
        return null;
      }
      if (d === 0) {
        return n;
      }
      return n % d;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "number" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
};
