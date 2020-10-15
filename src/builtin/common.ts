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

/**
 *
 */
export function shiftDecimalPoint(n: number, d: number): number {
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
  const ndindex = dindex - (d > 0 ? d : d - 1);
  const ss = [
    zpadded.substring(0, ndindex).replace(/\./g, ""),
    zpadded.substring(ndindex).replace(/\./g, ""),
  ]
    .join(".")
    .replace(/^0+/, "");
  const nn = Number(ss);
  return sign * nn;
}
