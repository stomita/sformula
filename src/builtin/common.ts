import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { MaybeTypeAnnotated } from "../types";
import {
  ISO8601_DATE_FORMAT,
  ISO8601_DATETIME_INPUT_FORMAT,
  SALESFORCE_TIME_FORMAT,
} from "./constants";

/**
 *
 */
dayjs.extend(customParseFormat);
dayjs.extend(utc);

/**
 *
 */
export function parseDate(s: string) {
  return dayjs(s, ISO8601_DATE_FORMAT, true);
}

export function parseUtcDate(s: string) {
  return dayjs.utc(s, ISO8601_DATE_FORMAT, true);
}

export function parseDatetime(s: string) {
  for (const millisec of ["", ".S", ".SSS"]) {
    const fmt = `${ISO8601_DATETIME_INPUT_FORMAT}${millisec}`;
    for (const zone of ["Z", "ZZ", "[Z]"]) {
      const zfmt = fmt + zone;
      // should parse non-strict mode because timezoned input might not be same as the formatted result
      const dt = dayjs(s, zfmt);
      if (dt.isValid()) {
        const ss = s.replace(/(Z|[+-][0-9]{2}:?[0-9]{2})$/, "");
        const dt2 = dayjs(ss, fmt);
        if (dt2.isValid() && ss === dt2.format(fmt)) {
          return dt;
        }
      }
    }
  }
  return dayjs(null);
}

export function parseTime(s: string) {
  return dayjs.utc(s, SALESFORCE_TIME_FORMAT, true);
}

export function parseDateOrDatetime(s: string) {
  let dt = parseUtcDate(s);
  if (!dt.isValid()) {
    dt = parseDatetime(s);
  }
  return dt;
}

export function parseDatetimeOrTime(s: string) {
  let dt = parseTime(s);
  if (!dt.isValid()) {
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

/**
 *
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 *
 */
export function normalizeCSSStyleNum(num: number): string {
  return String(num).replace(/^(-)?0\./, (_$0, $1) => `${$1 ? "-" : ""}.`);
}

/**
 *
 */
export function extractValueAnnotation<T>(
  value: MaybeTypeAnnotated<T>,
  defaultType: string
) {
  return Array.isArray(value) ? value : [value, defaultType];
}
