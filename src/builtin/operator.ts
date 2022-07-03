import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {
  ISO8601_DATETIME_FORMAT,
  SALESFORCE_TIME_FORMAT,
  ISO8601_DATE_FORMAT,
} from "./constants";
import type { Maybe } from "../types";
import { parseTime, shiftDecimalPoint } from "./common";

/**
 *
 */
dayjs.extend(duration);

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
  $$EQ_BOOLEAN$$: {
    value: (n1: Maybe<boolean>, n2: Maybe<boolean>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 === n2;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "boolean" },
          optional: false,
        },
        {
          argument: { type: "boolean" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  $$NEQ_BOOLEAN$$: {
    value: (n1: Maybe<boolean>, n2: Maybe<boolean>) => {
      if (n1 == null || n2 == null) {
        return null;
      }
      return n1 !== n2;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "boolean" },
          optional: false,
        },
        {
          argument: { type: "boolean" },
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
      const dt = dayjs(d);
      if (!dt.isValid()) {
        return null;
      }
      const ms = dayjs.duration(n, "day").asMilliseconds();
      return dt.add(ms, "millisecond").format(ISO8601_DATE_FORMAT);
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
      const dt = dayjs(d);
      if (!dt.isValid()) {
        return null;
      }
      const ms = dayjs.duration(n, "day").asMilliseconds();
      return dt.add(-ms, "millisecond").format(ISO8601_DATE_FORMAT);
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return dt1.diff(dt2, "day", true);
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return dt1.isSame(dt2, "day");
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return !dt1.isSame(dt2, "day");
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
      const dt = dayjs(d);
      if (!dt.isValid()) {
        return null;
      }
      const ms = dayjs.duration(n, "day").asMilliseconds();
      return dt.add(ms).utc().format(ISO8601_DATETIME_FORMAT);
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
      const dt = dayjs(d);
      if (!dt.isValid()) {
        return null;
      }
      const ms = dayjs.duration(n, "day").asMilliseconds();
      return dt.add(-ms).utc().format(ISO8601_DATETIME_FORMAT);
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return dt1.diff(dt2, "day", true);
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return dt1.isSame(dt2, "millisecond");
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
      const dt1 = dayjs(d1);
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = dayjs(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return !dt1.isSame(dt2, "millisecond");
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
      if (!dt.isValid()) {
        return null;
      }
      return dt.add(n, "millisecond").format(SALESFORCE_TIME_FORMAT);
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
      if (!dt.isValid()) {
        return null;
      }
      return dt.add(-n, "millisecond").format(SALESFORCE_TIME_FORMAT);
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return dt1.diff(dt2, "millisecond", true);
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return dt1.isSame(dt2, "millisecond");
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
      if (!dt1.isValid()) {
        return null;
      }
      const dt2 = parseTime(d2);
      if (!dt2.isValid()) {
        return null;
      }
      return !dt1.isSame(dt2, "millisecond");
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
