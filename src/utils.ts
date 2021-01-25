import { ExpressionType } from "./types";

export function toTypeIdentifier(t: ExpressionType) {
  return t.type === "class" ? `class:${t.name}` : t.type;
}
