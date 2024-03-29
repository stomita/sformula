import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { MaybeTypeAnnotated, Maybe } from "../types";
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

/**
 *
 */
dayjs.extend(utc);

/**
 *
 */
export default {
  BEGINS: {
    value: (str: Maybe<string>, cstr: Maybe<string>) => {
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
    value: (str: Maybe<string>, cstr: Maybe<string>) => {
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
    value: (v: Maybe<string>, s: Maybe<string>) => {
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
    value: (v: Maybe<string>, s: Maybe<string>) => {
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
    value: (
      search: Maybe<string>,
      str: Maybe<string>,
      start?: Maybe<number>
    ) => {
      if (!str || !search || (start != null && start <= 0)) {
        return 0;
      }
      return str.indexOf(search || "", (start || 1) - 1) + 1;
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
    value: (str: Maybe<string>, num: Maybe<number>) => {
      if (!str || num == null) {
        return "";
      }
      if (num < 0) {
        num = 0;
      }
      num = Math.floor(num);
      return str.substring(0, num);
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
    value: (str: Maybe<string>, num: Maybe<number>) => {
      if (!str || num == null) {
        return "";
      }
      // num must be an integer value - otherwise returns empty string
      if (Math.floor(num) !== num) {
        return "";
      }
      return str.substring(str.length - num);
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
    value: (str: Maybe<string>, start: Maybe<number>, num: Maybe<number>) => {
      if (!str || start == null || num == null) {
        return "";
      }
      if (start <= 0) {
        start = 1;
      }
      if (num < 0) {
        num = 0;
      }
      start = Math.floor(start);
      num = Math.floor(num);
      return str.substring(start - 1, start + num - 1);
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
    value: (str: Maybe<string>) => {
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
    value: (str: Maybe<string>) => {
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
    value: (
      str: Maybe<string>,
      len: Maybe<number>,
      pstr: Maybe<string> = " "
    ) => {
      if (!str || !pstr || len == null) {
        return "";
      }
      const pchars = pstr || " ";
      const plen = len > str.length ? len - str.length : 0;
      const padded = Array.from({ length: plen })
        .map((_, i) => pchars[i % pchars.length])
        .join("");
      return (padded + str).substring(0, len);
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
    value: (
      str: Maybe<string>,
      len: Maybe<number>,
      pstr: Maybe<string> = " "
    ) => {
      if (!str || !pstr || len == null) {
        return "";
      }
      const pchars = pstr || " ";
      const plen = len > str.length ? len - str.length : 0;
      const padded = Array.from({ length: plen })
        .map((_, i) => pchars[i % pchars.length])
        .join("");
      return (str + padded).substring(0, len);
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
    value: (
      str: Maybe<string>,
      search: Maybe<string>,
      replacement: Maybe<string>
    ) => {
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
    value: (str: Maybe<string>) => {
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
    value: (str: Maybe<string>) => {
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
    value: (value: MaybeTypeAnnotated<string | number | boolean | null>) => {
      let v, vType;
      if (Array.isArray(value)) {
        [v, vType] = value;
      } else {
        v = value;
      }
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
      if (typeof v === "number") {
        if (v === 0) {
          return "0";
        }
        const sign = v > 0 ? 1 : -1;
        const absVstr = String(v * sign);
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
    value: (str: Maybe<string>) => {
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
    value: (str: Maybe<string>) => {
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
    value: (str: Maybe<string>) => {
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
      imageUrl: Maybe<string>,
      alternateText: Maybe<string>,
      height: Maybe<number>,
      width: Maybe<number>
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
        styles.push(`height:${normalizeCSSStyleNum(height)}px;`);
      }
      if (width === null) {
        width = 0;
      }
      if (width != null) {
        styles.push(`width:${normalizeCSSStyleNum(width)}px;`);
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
};
