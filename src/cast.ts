import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { shiftDecimalPoint } from "./builtin/common";
import { ISO8601_DATE_FORMAT } from "./builtin/constants";
import { Maybe } from "./types";

/**
 *
 */
dayjs.extend(utc);

/**
 *
 */
export function isCastableType(srcType: string, dstType: string) {
  return (
    srcType === dstType ||
    srcType === "any" ||
    dstType === "any" ||
    (srcType === "datetime" && dstType === "date") ||
    ((srcType === "number" ||
      srcType === "currency" ||
      srcType === "percent") &&
      (dstType === "number" ||
        dstType === "currency" ||
        dstType === "percent")) ||
    (srcType === "html" && dstType === "string")
  );
}

/**
 *
 */
export function applyScale(n: number, scale: number) {
  const power = 10 ** scale;
  return Math.round(n * power) / power;
}

/**
 *
 */
export function castValue(
  value: any,
  srcType: string,
  dstType: string,
  scale: Maybe<number>
) {
  if (dstType === "boolean") {
    return !!value;
  }
  if (value == null) {
    return null;
  }
  if (dstType === "date" && srcType === "datetime") {
    const dt = dayjs(value);
    return dt.isValid() ? dt.utc().format(ISO8601_DATE_FORMAT) : null;
  }
  if (dstType === "percent" && srcType !== "percent") {
    value = shiftDecimalPoint(value, -2);
  }
  if (dstType !== "percent" && srcType === "percent") {
    value = shiftDecimalPoint(value, 2);
  }
  if (
    typeof scale === "number" &&
    (dstType === "number" || dstType === "currency" || dstType === "percent")
  ) {
    value = applyScale(value, scale);
  }
  // trim the space from the output
  if (dstType === "string" && srcType === "string") {
    value = String(value).trim() || null;
  }
  return value;
}
