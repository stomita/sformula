import { SyntaxError } from "./error";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parse } = require("./parser");

export const parseFormula = (text: string) => {
  try {
    return parse(text);
  } catch (e) {
    throw new SyntaxError(e.message, e.expected, e.found, e.location);
  }
};
