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

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

export function convertIdFrom15To18(s: string) {
  if (s.length == 15) {
    let suffix = "";
    for (let block = 0; block < 3; block++) {
      let sum = 0;
      for (let position = 0; position < 5; position++) {
        const c = s.charAt(block * 5 + position);
        if (c >= "A" && c <= "Z") sum += 1 << position;
      }
      suffix += ID_CHARS.charAt(sum);
    }
    return s + suffix;
  }
  return s;
}

export function convertIdFrom18To15(s: string) {
  if (s.length == 18) {
    return s.substring(0, 15);
  }
  return s;
}
