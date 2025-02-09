import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ISO8601_DATE_FORMAT } from "./builtin/constants";
import { Maybe } from "./types";
import BigNumber from "bignumber.js";

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
export function applyScale(n: number | BigNumber, scale: number) {
  return BigNumber(n).decimalPlaces(scale, BigNumber.ROUND_HALF_UP);
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
  // Convert to/from percent value (e.g. 45.5% <-> 0.455)
  if (dstType === "percent" && srcType !== "percent") {
    value = BigNumber(value).shiftedBy(2); // 0.455 -> 45.5
  }
  if (dstType !== "percent" && srcType === "percent") {
    value = BigNumber(value).shiftedBy(-2); // 45.5 -> 0.455
  }
  if (
    typeof scale === "number" &&
    (dstType === "number" || dstType === "currency" || dstType === "percent")
  ) {
    value = applyScale(value, scale);
  }
  // Convert BigNumber to number before returning
  if (BigNumber.isBigNumber(value)) {
    value = value.toNumber();
  }
  // trim the space from the output
  if (dstType === "string" && srcType === "string") {
    value = String(value).trim() || null;
  }
  return value;
}
