import { parse } from "./parser";
import { SyntaxError } from "./error";

export const parseFormula = (text: string) => {
  try {
    return parse(text);
  } catch (e) {
    throw new SyntaxError(e.message, e.expected, e.found, e.location);
  }
};
