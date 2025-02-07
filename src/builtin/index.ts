import type {
  Context,
  ExpressionTypeDictionary,
  FunctionDefDictionary,
} from "../types";
import stringBuiltins from "./string";
import datetimeBuiltins from "./datetime";
import logicBuiltins from "./logic";
import numberBuiltins from "./number";
import operatorBuiltins from "./operator";

const builtins = {
  ...stringBuiltins,
  ...datetimeBuiltins,
  ...logicBuiltins,
  ...numberBuiltins,
  ...operatorBuiltins,
} satisfies FunctionDefDictionary;

export type BuiltinFunctionName = keyof typeof builtins;

const types: ExpressionTypeDictionary = Object.keys(builtins).reduce(
  (types, name) => {
    const type = builtins[name as BuiltinFunctionName].type;
    return { ...types, [name]: type };
  },
  {}
);

const context: Context = Object.keys(builtins).reduce((context, name) => {
  const value = builtins[name as BuiltinFunctionName].value;
  return { ...context, [name]: value };
}, {});

export { context, types };
