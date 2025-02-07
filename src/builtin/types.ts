import type { BigNumber } from "bignumber.js";
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
