import { DateTime } from "luxon";
import { shiftDecimalPoint } from "./builtin/common";
import { Maybe } from "./types";

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
      (dstType === "number" || dstType === "currency" || dstType === "percent"))
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
    return value;
  }
  if (dstType === "date" && srcType === "datetime") {
    return DateTime.fromISO(value).toUTC().toISODate();
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
    value = String(value).replace(/^\s+|\s+$/g, "");
  }
  return value;
}
