import { BigNumber } from "bignumber.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  SALESFORCE_DATETIME_TEXT_FORMAT_Z,
  SALESFORCE_TIME_TEXT_FORMAT,
} from "./constants";
import {
  convertIdFrom15To18,
  convertIdFrom18To15,
  escapeHtml,
  extractValueAnnotation,
  normalizeCSSStyleNum,
  parseTime,
} from "./common";
import type { MaybeTypeAnnotated, FunctionDefDictionary } from "../types";
import type { SfAnyData, SfNumber, SfString } from "./types";

/**
 *
 */
dayjs.extend(utc);

/**
 *
 */
const stringBuiltins = {
  BEGINS: {
    value: (str: SfString, cstr: SfString) => {
      if (str == null || cstr == null) {
        return null;
      }
      return str.indexOf(cstr) === 0;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  CONTAINS: {
    value: (str: SfString, cstr: SfString) => {
      if (str == null || cstr == null) {
        return null;
      }
      return str.indexOf(cstr) >= 0;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  INCLUDES: {
    value: (v: SfString, s: SfString) => {
      if (v == null || s == null) {
        return false;
      }
      const vs = v.split(";");
      return vs.indexOf(s) >= 0;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "multipicklist" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  ISPICKVAL: {
    value: (v: SfString, s: SfString) => {
      if (v == null || s == null) {
        return false;
      }
      return (v || "") === (s || "");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "picklist" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  FIND: {
    value: (search: SfString, str: SfString, start?: SfNumber) => {
      if (!str || !search || (start != null && BigNumber(start).lte(0))) {
        return 0;
      }
      return (
        str.indexOf(
          search || "",
          BigNumber(start || 1)
            .integerValue()
            .toNumber() - 1
        ) + 1
      );
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: true,
        },
      ],
      returns: { type: "number" },
    },
  },
  LEFT: {
    value: (str: SfString, num: SfNumber) => {
      if (!str || num == null) {
        return "";
      }
      const bn = BigNumber(num);
      if (bn.isLessThan(0)) {
        return str.substring(0, 0);
      }
      return str.substring(
        0,
        bn.integerValue(BigNumber.ROUND_FLOOR).toNumber()
      );
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  RIGHT: {
    value: (str: SfString, num: SfNumber) => {
      if (!str || num == null) {
        return "";
      }
      const bn = BigNumber(num);
      // num must be an integer value - otherwise returns empty string
      if (!bn.isInteger()) {
        return "";
      }
      return str.substring(str.length - bn.toNumber());
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  MID: {
    value: (str: SfString, start: SfNumber, num: SfNumber) => {
      if (!str || start == null || num == null) {
        return "";
      }
      let startBn = BigNumber(start);
      if (startBn.isLessThanOrEqualTo(0)) {
        startBn = BigNumber(1);
      }
      let numBn = BigNumber(num);
      if (numBn.isLessThan(0)) {
        numBn = BigNumber(0);
      }
      startBn = startBn.integerValue(BigNumber.ROUND_FLOOR);
      numBn = numBn.integerValue(BigNumber.ROUND_FLOOR);
      return str.substring(
        startBn.minus(1).toNumber(),
        startBn.plus(numBn).minus(1).toNumber()
      );
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  LOWER: {
    value: (str: SfString) => {
      if (str == null) {
        return "";
      }
      return str.toLowerCase();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  UPPER: {
    value: (str: SfString) => {
      if (str == null) {
        return "";
      }
      return str.toUpperCase();
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  LPAD: {
    value: (str: SfString, len: SfNumber, pstr: SfString = " ") => {
      if (!str || !pstr || len == null) {
        return "";
      }
      const pchars = pstr || " ";
      const lenNum = BigNumber(len).toNumber();
      const plen = lenNum > str.length ? lenNum - str.length : 0;
      const padded = Array.from({ length: plen })
        .map((_, i) => pchars[i % pchars.length])
        .join("");
      return (padded + str).substring(0, lenNum);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: true,
        },
      ],
      returns: { type: "string" },
    },
  },
  RPAD: {
    value: (str: SfString, len: SfNumber, pstr: SfString = " ") => {
      if (!str || !pstr || len == null) {
        return "";
      }
      const pchars = pstr || " ";
      const lenNum = BigNumber(len).toNumber();
      const plen = lenNum > str.length ? lenNum - str.length : 0;
      const padded = Array.from({ length: plen })
        .map((_, i) => pchars[i % pchars.length])
        .join("");
      return (str + padded).substring(0, lenNum);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: true,
        },
      ],
      returns: { type: "string" },
    },
  },
  SUBSTITUTE: {
    value: (str: SfString, search: SfString, replacement: SfString) => {
      if (!str) {
        return "";
      }
      if (!search) {
        return str;
      }
      return str.split(search).join(replacement || "");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  TRIM: {
    value: (str: SfString) => {
      if (str == null) {
        return null;
      }
      return str.replace(/^\s+|\s+$/g, "");
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  LEN: {
    value: (str: SfString) => {
      if (str == null) {
        return null;
      }
      return str.length;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  TEXT: {
    value: (value: MaybeTypeAnnotated<SfAnyData>) => {
      // eslint-disable-next-line prefer-const
      let [v, vType] = Array.isArray(value) ? value : [value, undefined];
      if (vType === "datetime") {
        if (v == null) {
          return "Z";
        }
        if (typeof v !== "string") {
          v = String(v);
        }
        const dt = dayjs(v);
        if (!dt.isValid()) {
          return null;
        }
        return dt.utc().format(SALESFORCE_DATETIME_TEXT_FORMAT_Z);
      }
      if (vType === "time") {
        if (v == null) {
          return null;
        }
        if (typeof v !== "string") {
          v = String(v);
        }
        const dt = parseTime(v);
        if (!dt.isValid()) {
          return null;
        }
        return dt.format(SALESFORCE_TIME_TEXT_FORMAT);
      }
      if (v == null) {
        return null;
      }
      if (typeof v === "number" || BigNumber.isBigNumber(v)) {
        const bn = BigNumber(v);
        if (bn.isZero()) {
          return "0";
        }
        const sign = bn.isPositive() ? 1 : -1;
        const absVstr = bn.abs().toString();
        return (sign === 1 ? "" : "-") + absVstr.replace(/^0+/, "");
      }
      return String(v);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: {
            type: "template",
            ref: "T",
            anyOf: [
              {
                type: "boolean",
              },
              {
                type: "currency",
              },
              {
                type: "number",
              },
              {
                type: "percent",
              },
              {
                type: "date",
              },
              {
                type: "datetime",
              },
              {
                type: "time",
              },
              {
                type: "picklist",
              },
            ],
          },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  VALUE: {
    value: (str: SfString) => {
      if (!str || /^-?0[box]/i.test(str)) {
        return null;
      }
      const n = Number(str);
      return Number.isNaN(n) ? null : n;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "number" },
    },
  },
  CASESAFEID: {
    value: (str: SfString) => {
      if (str == null) {
        return null;
      }
      return convertIdFrom15To18(str);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  $$CASEUNSAFEID$$: {
    value: (str: SfString) => {
      if (str == null) {
        return null;
      }
      return convertIdFrom18To15(str);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "string" },
    },
  },
  HYPERLINK: {
    value: (
      url_: MaybeTypeAnnotated<string>,
      friendlyName: MaybeTypeAnnotated<string>,
      target_: MaybeTypeAnnotated<string>
    ) => {
      let [url] = extractValueAnnotation(url_, "string");
      if (!url) {
        url = " ";
      }
      const [child_, childType] = extractValueAnnotation(
        friendlyName,
        "string"
      );
      const child = child_ || " ";
      let [target] = extractValueAnnotation(target_, "string");
      if (target == null) {
        target = "_blank";
      }
      if (!target) {
        target = "";
      }
      return `<a href="${url}" target="${escapeHtml(target)}">${
        childType === "html" ? child : escapeHtml(child)
      }</a>`;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: {
            type: "template",
            ref: "T",
            anyOf: [
              {
                type: "string",
              },
              {
                type: "html",
              },
            ],
          },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: true,
        },
      ],
      returns: { type: "html" },
    },
  },
  IMAGE: {
    value: (
      imageUrl: SfString,
      alternateText: SfString,
      height: SfNumber,
      width: SfNumber
    ) => {
      if (!imageUrl) {
        imageUrl = " ";
      }
      if (!alternateText) {
        alternateText = " ";
      }
      const styles = [];
      if (height === null) {
        height = 0;
      }
      if (height != null) {
        styles.push(
          `height:${normalizeCSSStyleNum(BigNumber(height).toNumber())}px;`
        );
      }
      if (width === null) {
        width = 0;
      }
      if (width != null) {
        styles.push(
          `width:${normalizeCSSStyleNum(BigNumber(width).toNumber())}px;`
        );
      }
      return `<img src="${imageUrl}" alt="${escapeHtml(alternateText)}"${
        styles.length > 0 ? ` style="${styles.join(" ")}"` : ""
      } border="0"/>`;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "string" },
          optional: false,
        },
        {
          argument: { type: "number" },
          optional: true,
        },
        {
          argument: { type: "number" },
          optional: true,
        },
      ],
      returns: { type: "html" },
    },
  },
} satisfies FunctionDefDictionary;

export default stringBuiltins;
