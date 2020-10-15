import { DateTime } from "luxon";
import {
  MSECS_IN_DAY,
  ISO8601_DATETIME_FORMAT,
  SALESFORCE_TIME_FORMAT,
} from "./constants";
import type { Maybe } from "../types";
import { parseTime } from "./common";

/**
 *
 */
function shiftDecimalPoint(n: number, d: number): number {
  if (n === 0) {
    return n;
  }
  const sign = n > 0 ? 1 : -1;
  const s = String(n * sign);
  // give up accurate shift if it is floating number
  if (s.indexOf("e") >= 0) {
    return n * 10 ** -d;
  }
  const zeros = Array.from({ length: Math.abs(d) })
    .map(() => "0")
    .join("");
  const zpadded = zeros + s + (s.indexOf(".") < 0 ? "." : "") + zeros;
  const dindex = zpadded.indexOf(".");
  const ndindex = dindex - d;
  const ss = [
    zpadded.substring(0, ndindex).replace(/\./g, ""),
    zpadded.substring(ndindex).replace(/\./g, ""),
  ]
    .join(".")
    .replace(/^0+/, "");
  const nn = Number(ss);
  return sign * nn;
}

/**
 *
 */
export default {
  // builtin operators
  $$CONCAT_STRING$$: {
    value: (s1: Maybe<string>, s2: Maybe<string>) => {
      return (s1 || "") + (s2 || "");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  $$EQ_STRING$$: {
    value: (s1: Maybe<string>, s2: Maybe<string>) => {
      return (s1 || "") === (s2 || "");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$NEQ_STRING$$: {
    value: (s1: Maybe<string>, s2: Maybe<string>) => {
      return (s1 || "") !== (s2 || "");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$ADD_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 + n2;
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
  $$SUBTRACT_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 - n2;
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
  $$MULTIPLY_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 * n2;
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
  $$DIVIDE_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null || n2 === 0) {
        return null;
      }
      return n1 / n2;
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
  $$SHIFT_DECIMAL$$: {
    value: (n: Maybe<number>, d: Maybe<number>) => {
      if (n == null || d == null) {
        return null;
      }
      return shiftDecimalPoint(n, d);
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
  $$POWER_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 ** n2;
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
  $$MINUS_NUMBER$$: {
    value: (n: Maybe<number>) => {
      if (n == null) {
        return null;
      }
      return -n;
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
  $$PLUS_NUMBER$$: {
    value: (n: Maybe<number>) => {
      if (n == null) {
        return null;
      }
      return +n;
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
  $$LT_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 < n2;
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
      returns: { type: "boolean" },
    },
  },
  $$LTE_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 <= n2;
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
      returns: { type: "boolean" },
    },
  },
  $$GT_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 > n2;
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
      returns: { type: "boolean" },
    },
  },
  $$GTE_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 >= n2;
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
      returns: { type: "boolean" },
    },
  },
  $$EQ_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 === n2;
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
      returns: { type: "boolean" },
    },
  },
  $$NEQ_NUMBER$$: {
    value: (n1: Maybe<number>, n2: Maybe<number>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 !== n2;
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
      returns: { type: "boolean" },
    },
  },
  $$ADD_DATE$$: {
    value: (d: string, n: number) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) {
        return null;
      }
      return dt.plus({ day: n }).toISODate();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "date" },
    },
  },
  $$SUBTRACT_DATE$$: {
    value: (d: Maybe<string>, n: Maybe<number>) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) {
        return null;
      }
      return dt.plus({ day: -n }).toISODate();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "date" },
    },
  },
  $$DIFF_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.diff(dt2, "days").as("days");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  $$LT_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() < dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$LTE_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() <= dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$GT_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() > dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$GTE_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() >= dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$EQ_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.hasSame(dt2, "day");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$NEQ_DATE$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return !dt1.hasSame(dt2, "day");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$ADD_DATETIME$$: {
    value: (d: Maybe<string>, n: Maybe<number>) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) {
        return null;
      }
      return dt
        .plus({ milliseconds: n * MSECS_IN_DAY })
        .toUTC()
        .toFormat(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "datetime" },
    },
  },
  $$SUBTRACT_DATETIME$$: {
    value: (d: Maybe<string>, n: Maybe<number>) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = DateTime.fromISO(d);
      if (!dt.isValid) {
        return null;
      }
      return dt
        .plus({ milliseconds: -n * MSECS_IN_DAY })
        .toUTC()
        .toFormat(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "datetime" },
    },
  },
  $$DIFF_DATETIME$$: {
    value: (d1: Maybe<string>, d2: Maybe<string>) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.diff(dt2, "milliseconds").as("milliseconds") / MSECS_IN_DAY;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  $$LT_DATETIME$$: {
    value: (d1: Maybe<string>, d2: Maybe<string>) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() < dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$LTE_DATETIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() <= dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$GT_DATETIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() > dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$GTE_DATETIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() >= dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$EQ_DATETIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.hasSame(dt2, "millisecond");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$NEQ_DATETIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = DateTime.fromISO(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = DateTime.fromISO(d2);
      if (!dt2.isValid) {
        return null;
      }
      return !dt1.hasSame(dt2, "millisecond");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "datetime" },
          optional: false,
        },
        {
          argument: { type: "datetime" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$ADD_TIME$$: {
    value: (d: Maybe<string>, n: Maybe<number>) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = parseTime(d);
      if (!dt.isValid) {
        return null;
      }
      return dt.plus({ milliseconds: n }).toFormat(SALESFORCE_TIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "time" },
    },
  },
  $$SUBTRACT_TIME$$: {
    value: (d: Maybe<string>, n: Maybe<number>) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = parseTime(d);
      if (!dt.isValid) {
        return null;
      }
      return dt.plus({ milliseconds: -n }).toFormat(SALESFORCE_TIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "time" },
    },
  },
  $$DIFF_TIME$$: {
    value: (d1: Maybe<string>, d2: Maybe<string>) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.diff(dt2, "milliseconds").as("milliseconds");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  $$LT_TIME$$: {
    value: (d1: Maybe<string>, d2: Maybe<string>) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() < dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$LTE_TIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() <= dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$GT_TIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() > dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$GTE_TIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.valueOf() >= dt2.valueOf();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$EQ_TIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return dt1.hasSame(dt2, "millisecond");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$NEQ_TIME$$: {
    value: (d1: string, d2: string) => {
      if (d1 == null || d2 == null) {
        return null;
      }
      const dt1 = parseTime(d1);
      if (!dt1.isValid) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid) {
        return null;
      }
      return !dt1.hasSame(dt2, "millisecond");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
};
