import { DateTime } from "luxon";
import {
  ISO8601_DATETIME_FORMAT,
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
import type { Maybe } from "../types";

/**
 *
 */
export default {
  ADDMONTHS: {
    value: (d: Maybe<string>, n: Maybe<number>) => {
      if (d == null || n == null) {
        return null;
      }
      const dt = parseDate(d);
      return dt.isValid ? dt.plus({ months: n }).toISODate() : null;
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
    value: (y: Maybe<number>, m: Maybe<number>, d: Maybe<number>) => {
      if (y == null || m == null || d == null || y > 9999) {
        return null;
      }
      const dd = DateTime.utc(y, m, d);
      return dd.isValid ? dd.toISODate() : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      let dt = parseDateOrDatetime(s);
      if (!dt.isValid) {
        dt = DateTime.fromFormat(s, SALESFORCE_DATETIME_TEXT_FORMAT, {
          zone: "utc",
        });
      }
      return dt.isValid ? dt.toUTC().toFormat(ISO8601_DATETIME_FORMAT) : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      let dt = parseDate(s);
      if (dt.isValid) {
        return dt.toISODate();
      }
      dt = parseDatetime(s);
      return dt.isValid ? dt.toLocal().toISODate() : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      let dt = parseDatetimeOrTime(s);
      if (!dt.isValid) {
        dt = DateTime.fromFormat(s, SALESFORCE_TIME_TEXT_FORMAT, {
          zone: "utc",
        });
      }
      return dt.isValid ? dt.toUTC().toFormat(SALESFORCE_TIME_FORMAT) : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      return dt.isValid ? dt.year : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      return dt.isValid ? dt.month : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      return dt.isValid ? dt.day : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseDate(s);
      // Luxon returns 7 for Sunday, 1 for Monday
      // should return 1 for Sunday, 2 for Monday in Salesforce WEEKDAY().
      return dt.isValid ? (dt.weekday % 7) + 1 : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid ? dt.hour : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid ? dt.minute : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid ? dt.second : null;
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
    value: (s: Maybe<string>) => {
      if (s == null || s === "") {
        return null;
      }
      const dt = parseTime(s);
      return dt.isValid ? dt.millisecond : null;
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
      return DateTime.local().toISODate();
    },
    type: {
      type: "function",
      arguments: [],
      returns: { type: "date" },
    },
  },
  NOW: {
    value: () => {
      return DateTime.utc().toFormat(ISO8601_DATETIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [],
      returns: { type: "datetime" },
    },
  },
  TIMENOW: {
    value: () => {
      return DateTime.utc().toFormat(SALESFORCE_TIME_FORMAT);
    },
    type: {
      type: "function",
      arguments: [],
      returns: { type: "time" },
    },
  },
};
