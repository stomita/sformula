import { BigNumber } from "bignumber.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import {
  ISO8601_DATETIME_FORMAT,
  ISO8601_DATE_FORMAT,
  SALESFORCE_DATETIME_TEXT_FORMAT,
  SALESFORCE_TIME_FORMAT,
  SALESFORCE_TIME_TEXT_FORMAT,
} from "./constants";
import {
  parseDate,
  parseDateOrDatetime,
  parseDatetime,
  parseDatetimeOrTime,
  parseTime,
} from "./common";
import type { FunctionDefDictionary } from "../types";
import type { SfString, SfNumber, SfDate, SfTime } from "./types";

/**
 *
 */
dayjs.extend(duration);
dayjs.extend(utc);

/**
 *
 */
const datetimeBuiltins = {
  ADDMONTHS: {
    value: (d: SfDate, n: SfNumber) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = parseDate(d);
      if (!dt.isValid()) {
        return null;
      }
      const nn = BigNumber(n).integerValue(BigNumber.ROUND_DOWN).toNumber();
      // it should return the last day of the month if the given day is the last day of the month,
      // so add 1 day before adding months and then subtract 1 day after
      if (dt.daysInMonth() === dt.date()) {
        return dt
          .add(1, "day")
          .add(nn, "month")
          .add(-1, "day")
          .format(ISO8601_DATE_FORMAT);
      }
      return dt.add(nn, "month").format(ISO8601_DATE_FORMAT);
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
  DATE: {
    value: (y: SfNumber, m: SfNumber, d: SfNumber) => {
      if (y == null || m == null || d == null) {
        return null;
      }
      const yy = BigNumber(y).integerValue(BigNumber.ROUND_DOWN).toNumber();
      if (yy > 9999) {
        return null;
      }
      const mm = BigNumber(m).integerValue(BigNumber.ROUND_DOWN).toNumber();
      const dd = BigNumber(d).integerValue(BigNumber.ROUND_DOWN).toNumber();

      const dt = dayjs(new Date(`${yy},${mm},${dd}`));
      return dt.isValid() &&
        dt.year() === yy &&
        dt.month() === mm - 1 &&
        dt.date() === dd
        ? dt.format(ISO8601_DATE_FORMAT)
        : null;
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
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "date" },
    },
  },
  DATETIMEVALUE: {
    value: (s: SfString) => {
      if (s == null || s === "") {
        return null;
      }
      let dt = parseDateOrDatetime(s);
      if (!dt.isValid()) {
        dt = dayjs.utc(s, SALESFORCE_DATETIME_TEXT_FORMAT, true);
      }
      return dt.isValid() ? dt.utc().format(ISO8601_DATETIME_FORMAT) : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "any" },
          optional: false,
        },
      ],
      returns: { type: "datetime" },
    },
  },
  DATEVALUE: {
    value: (s: SfString) => {
      if (s == null || s === "") {
        return null;
      }
      let dt = parseDate(s);
      if (dt.isValid()) {
        return dt.format(ISO8601_DATE_FORMAT);
      }
      dt = parseDatetime(s);
      return dt.isValid() ? dt.local().format(ISO8601_DATE_FORMAT) : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "any" },
          optional: false,
        },
      ],
      returns: { type: "date" },
    },
  },
  TIMEVALUE: {
    value: (s: SfString) => {
      if (s == null || s === "") {
        return null;
      }
      let dt = parseDatetimeOrTime(s);
      if (dt.isValid()) {
        return dt.utc().format(SALESFORCE_TIME_FORMAT);
      }
      dt = dayjs.utc(s, SALESFORCE_TIME_TEXT_FORMAT, true);
      return dt.isValid() ? dt.format(SALESFORCE_TIME_FORMAT) : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "any" },
          optional: false,
        },
      ],
      returns: { type: "time" },
    },
  },
  YEAR: {
    value: (s: SfDate) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      return dt.isValid() ? dt.year() : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  MONTH: {
    value: (s: SfDate) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      return dt.isValid() ? dt.month() + 1 : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  DAY: {
    value: (s: SfDate) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      return dt.isValid() ? dt.date() : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  WEEKDAY: {
    value: (s: SfDate) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      // Dayjs returns 0 for Sunday, 1 for Monday
      // should return 1 for Sunday, 2 for Monday in Salesforce WEEKDAY().
      return dt.isValid() ? (dt.day() % 7) + 1 : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "date" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  HOUR: {
    value: (s: SfTime) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid() ? dt.hour() : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  MINUTE: {
    value: (s: SfTime) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid() ? dt.minute() : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  SECOND: {
    value: (s: SfTime) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid() ? dt.second() : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  MILLISECOND: {
    value: (s: SfTime) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid() ? dt.millisecond() : null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "time" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  TODAY: {
    value: () => {
      return dayjs().format(ISO8601_DATE_FORMAT);
    },
    type: {
      type: "function",
      arguments: [],
      returns: { type: "date" },
    },
  },
  NOW: {
    value: () => {
      return dayjs().utc().format(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [],
      returns: { type: "datetime" },
    },
  },
  TIMENOW: {
    value: () => {
      return dayjs().utc().format(SALESFORCE_TIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [],
      returns: { type: "time" },
    },
  },
} satisfies FunctionDefDictionary;

export default datetimeBuiltins;
