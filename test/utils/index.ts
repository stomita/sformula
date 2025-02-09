import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  ISO8601_DATETIME_FORMAT,
  SALESFORCE_TIME_OUTPUT_FORMAT,
} from "./constant";
import type { FormulaReturnType } from "../../src";

//
dayjs.extend(utc);
//

export function zeropad(n: number): string {
  return (n < 10 ? "00" : n < 100 ? "0" : "") + String(n);
}

export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function catchError(
  execCb: () => Promise<void>,
  callback: (e?: unknown) => void
): Promise<void> {
  try {
    await execCb();
  } catch (e) {
    callback(e);
    return;
  }
  callback();
}

export function toReturnType(type: string): FormulaReturnType {
  return (
    type === "Checkbox"
      ? "boolean"
      : type === "Text"
        ? "string"
        : type.toLowerCase()
  ) as FormulaReturnType;
}

export function calcFluctuatedValue(
  value: string | number | null,
  fluctuation: number,
  returnType: FormulaReturnType
) {
  if (
    (returnType === "number" ||
      returnType === "currency" ||
      returnType === "percent") &&
    typeof value === "number"
  ) {
    return [value - fluctuation, value + fluctuation] as [number, number];
  }
  if (returnType === "datetime" && typeof value === "string") {
    const dt = dayjs(value);
    return [
      dt.add(-fluctuation, "millisecond").utc().format(ISO8601_DATETIME_FORMAT),
      dt.add(fluctuation, "millisecond").utc().format(ISO8601_DATETIME_FORMAT),
    ] as [string, string];
  }
  if (returnType === "time" && typeof value === "string") {
    const dt = dayjs.utc(value, SALESFORCE_TIME_OUTPUT_FORMAT, true);
    return [
      dt
        .add(-fluctuation, "millisecond")
        .utc()
        .format(SALESFORCE_TIME_OUTPUT_FORMAT),
      dt
        .add(fluctuation, "millisecond")
        .utc()
        .format(SALESFORCE_TIME_OUTPUT_FORMAT),
    ] as [string, string];
  }
  return [value, value] as [typeof value, typeof value];
}

export function between(value: any, lower: any, upper: any) {
  return (
    (value == null && lower == null && upper === null) ||
    (value >= lower && value <= upper)
  );
}
