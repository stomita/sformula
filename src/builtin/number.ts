import { BigNumber } from "bignumber.js";
import type { SfNumber } from "./types";
import type { FunctionDefDictionary } from "../types";

/**
 *
 */
const numberBuiltins = {
  ABS: {
    value: (v: SfNumber) => {
      if (v == null) {
        return null;
      }
      return BigNumber(v).abs();
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
    value: (v: SfNumber) => {
      if (v == null) {
        return null;
      }
      return BigNumber(v).integerValue(BigNumber.ROUND_UP); // v >= 0 ? Math.ceil(v) : -Math.ceil(-v)
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
    value: (v: SfNumber) => {
      if (v == null) {
        return null;
      }
      return BigNumber(v).integerValue(BigNumber.ROUND_DOWN); // v >= 0 ? Math.floor(v) : -Math.floor(-v)
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
    value: (v: SfNumber, d: SfNumber) => {
      if (v == null || d == null) {
        return null;
      }
      const places = BigNumber(d)
        .integerValue(BigNumber.ROUND_FLOOR)
        .toNumber();
      if (places >= 0) {
        return BigNumber(v).decimalPlaces(places, BigNumber.ROUND_HALF_UP);
      } else {
        // For negative places, shift decimal point left, round, then shift back
        // e.g. ROUND(1234.5678, -2) => 12.345678 => 12 => 1200
        return BigNumber(v)
          .shiftedBy(places)
          .integerValue(BigNumber.ROUND_HALF_UP)
          .shiftedBy(-places);
      }
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
    value: (v: SfNumber) => {
      if (v == null) {
        return null;
      }
      return BigNumber(v).integerValue(BigNumber.ROUND_CEIL); // Math.ceil(v);
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
    value: (v: SfNumber) => {
      if (v == null) {
        return null;
      }
      return BigNumber(v).integerValue(BigNumber.ROUND_FLOOR); // Math.floor(v);
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
    value: (n: SfNumber) => {
      if (n == null) {
        return null;
      }
      return BigNumber(Math.E).pow(n);
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
    value: (n: SfNumber) => {
      if (n == null) {
        return null;
      }
      const nn = BigNumber(n).toNumber();
      if (nn <= 0) {
        return null;
      }
      return Math.log(nn);
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
    value: (n: SfNumber) => {
      if (n == null) {
        return null;
      }
      const nn = BigNumber(n).toNumber();
      if (nn <= 0) {
        return null;
      }
      return Math.log10(nn);
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
    value: (n: SfNumber) => {
      if (n == null) {
        return null;
      }
      const nn = BigNumber(n).toNumber();
      if (nn < 0) {
        return null;
      }
      return Math.sqrt(nn);
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
    value: (...nums: Array<SfNumber>) => {
      let max: SfNumber = null;
      for (const n of nums) {
        if (n == null) {
          return null;
        }
        if (max == null || max.isLessThan(n)) {
          max = BigNumber(n);
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
    value: (...nums: Array<SfNumber>) => {
      let min: SfNumber = null;
      for (const n of nums) {
        if (n == null) {
          return null;
        }
        if (min == null || min.isGreaterThan(n)) {
          min = BigNumber(n);
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
    value: (n: SfNumber, d: SfNumber) => {
      if (n == null || d == null) {
        return null;
      }
      if (BigNumber(d).isZero()) {
        return n;
      }
      return BigNumber(n).mod(d);
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
} satisfies FunctionDefDictionary;

export default numberBuiltins;
