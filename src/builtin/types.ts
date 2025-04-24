import { BigNumber } from "bignumber.js";
import type { Maybe } from "../types";

export type SfString = Maybe<string>;
export type SfNumber = Maybe<number | BigNumber>;
export type SfBoolean = Maybe<boolean>;
export type SfDate = Maybe<string>;
export type SfDatetime = Maybe<string>;
export type SfTime = Maybe<string>;
export type SfAnyData =
  | SfString
  | SfNumber
  | SfBoolean
  | SfDate
  | SfDatetime
  | SfTime;

function isNumber(v: SfAnyData): v is NonNullable<SfNumber> {
  return BigNumber.isBigNumber(v) || typeof v === 'number';
}

export function isEquivalent(v1: SfAnyData, v2: SfAnyData): boolean {
  if (v1 === v2) {
    return true;
  }
  if ((v1 == null || v1 === '') && (v2 == null || v2 === '')) {
    return true;
  }
  if (isNumber(v1) && isNumber(v2)) {
    return BigNumber(v1).isEqualTo(v2);
  }
  return false;
}