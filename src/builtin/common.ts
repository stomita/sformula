import { DateTime } from "luxon";
import {
  ISO8601_DATE_FORMAT,
  ISO8601_DATETIME_INPUT_FORMAT,
  SALESFORCE_TIME_FORMAT,
} from "./constants";

/**
 *
 */
export function parseDate(s: string) {
  return DateTime.fromFormat(s, ISO8601_DATE_FORMAT, { zone: "utc" });
}

export function parseDatetime(s: string) {
  let dt_: DateTime = null as any;
  for (const millisec of ["", ".S", ".SSS"]) {
    for (const zone of ["Z", "ZZ", "ZZZ", "'Z'"]) {
      const fmt = `${ISO8601_DATETIME_INPUT_FORMAT}${millisec}${zone}`;
      const dt = DateTime.fromFormat(s, fmt, { zone: "utc" });
      if (dt.isValid) {
        return dt;
      }
      dt_ = dt;
    }
  }
  return dt_;
}

export function parseTime(s: string) {
  return DateTime.fromFormat(s, SALESFORCE_TIME_FORMAT, { zone: "utc" });
}

export function parseDateOrDatetime(s: string) {
  let dt = parseDate(s);
  if (!dt.isValid) {
    dt = parseDatetime(s);
  }
  return dt;
}

export function parseDatetimeOrTime(s: string) {
  let dt = parseTime(s);
  if (!dt.isValid) {
    dt = parseDatetime(s);
  }
  return dt;
}
