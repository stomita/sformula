import { parse } from "./parser";
import { SyntaxError } from "./error";
import {
  resetBracketIdentifierHolder,
  setBracketIdentifierHolder,
} from "./parserUtils";

export const parseFormula = (
  text: string,
  options: { bracketIdentifierHolder?: string } = {}
) => {
  try {
    if (options.bracketIdentifierHolder) {
      setBracketIdentifierHolder(options.bracketIdentifierHolder);
    }
    return parse(text);
  } catch (e: any) {
    throw new SyntaxError(e.message, e.expected, e.found, e.location);
  } finally {
    resetBracketIdentifierHolder();
  }
};
