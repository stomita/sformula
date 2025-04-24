import type { FunctionDefDictionary } from "../types";
import { type SfBoolean, type SfAnyData, type SfString, isEquivalent } from "./types";

/**
 *
 */
export const logicBuiltins = {
  AND: {
    value: (...conds: SfBoolean[]) => {
      let ret: boolean | null = true;
      for (const c of conds) {
        if (c === false) {
          return false;
        }
        if (c == null) {
          ret = null;
        }
      }
      return ret;
    },
    type: {
      type: "function",
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: { type: "boolean" },
        optional: i > 0,
      })),
      returns: { type: "boolean" },
    },
  },
  OR: {
    value: (...conds: SfBoolean[]) => {
      let ret: boolean | null = false;
      for (const c of conds) {
        if (c === true) {
          return true;
        }
        if (c == null) {
          ret = null;
        }
      }
      return ret;
    },
    type: {
      type: "function",
      arguments: Array.from({ length: 50 }).map((_, i) => ({
        argument: { type: "boolean" },
        optional: i > 0,
      })),
      returns: { type: "boolean" },
    },
  },
  NOT: {
    value: (v: SfBoolean) => {
      if (v == null) {
        return null;
      }
      return !v;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "boolean" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  CASE: {
    value: (...args: SfAnyData[]) => {
      const value = args[0];
      for (let i = 1; i < args.length - 1; i += 2) {
        const match = args[i];
        const ret = args[i + 1];
        if (isEquivalent(match, value)) {
          return ret;
        }
      }
      return args[args.length - 1];
    },
    type: {
      type: "function",
      arguments: (argLen: number) => {
        const repeatCnt = Math.max(Math.floor((argLen - 2) / 2), 1);
        return [
          {
            argument: { type: "template", ref: "T" },
            optional: false,
          },
          ...Array.from({ length: repeatCnt }).reduce(
            (cases: any[]) => [
              ...cases,
              {
                argument: { type: "template", ref: "T" }, // T || S
                optional: false,
              },
              {
                argument: { type: "template", ref: "S" },
                optional: false,
              },
            ],
            []
          ),
          {
            argument: { type: "template", ref: "S" },
            optional: false,
          },
        ];
      },
      returns: { type: "template", ref: "S" },
    },
  },
  IF: {
    value: (test: SfBoolean, cons: SfAnyData, alt: SfAnyData) => {
      return test ? cons : alt;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "boolean" },
          optional: false,
        },
        {
          argument: { type: "template", ref: "T" },
          optional: false,
        },
        {
          argument: { type: "template", ref: "T" },
          optional: false,
        },
      ],
      returns: { type: "template", ref: "T" },
    },
  },
  ISNULL: {
    value: (value: SfAnyData) => {
      return value == null;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "any" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  ISBLANK: {
    value: (value: SfAnyData) => {
      return value == null || value === "";
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "any" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  ISNUMBER: {
    value: (value: SfString) => {
      if (!value) {
        return null;
      }
      // Strings representing binary, octal, or hexadecimal numbers are not treated as numbers.
      if (/^-?0[box]/i.test(value)) {
        return false;
      }
      const n = Number(value);
      return !Number.isNaN(n);
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "string" },
          optional: false,
        },
      ],
      returns: { type: "boolean" },
    },
  },
  NULLVALUE: {
    value: (value: SfAnyData, alt: SfAnyData) => {
      return value == null ? alt : value;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "template", ref: "T" },
          optional: false,
        },
        {
          argument: { type: "template", ref: "T" },
          optional: false,
        },
      ],
      returns: { type: "template", ref: "T" },
    },
  },
  BLANKVALUE: {
    value: (value: SfAnyData, alt: SfAnyData) => {
      return value == null || value === "" ? alt : value;
    },
    type: {
      type: "function",
      arguments: [
        {
          argument: { type: "template", ref: "T" },
          optional: false,
        },
        {
          argument: { type: "template", ref: "T" },
          optional: false,
        },
      ],
      returns: { type: "template", ref: "T" },
    },
  },
} satisfies FunctionDefDictionary;

export default logicBuiltins;
