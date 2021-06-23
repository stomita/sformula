import type { Expression, MemberExpression } from "esformula";

function extractFieldsFromMemberExpression(
  expression: MemberExpression
): string {
  if (expression.object.type === "Super") {
    throw new Error("could not be reached here");
  }
  if (expression.property.type === "PrivateIdentifier") {
    throw new Error("could not be reached here");
  }
  return [
    ...extractFieldsFromExpression(expression.object),
    ...extractFieldsFromExpression(expression.property),
  ].join(".");
}

function extractFieldsFromExpression(expression: Expression): string[] {
  switch (expression.type) {
    case "UnaryExpression":
      return extractFieldsFromExpression(expression.argument);
    case "BinaryExpression":
    case "LogicalExpression":
      return [
        ...extractFieldsFromExpression(expression.left),
        ...extractFieldsFromExpression(expression.right),
      ];
    case "CallExpression":
      return expression.arguments.reduce((fields, arg) => {
        if (arg.type === "SpreadElement") {
          throw new Error("could not be reached here");
        }
        return [...fields, ...extractFieldsFromExpression(arg)];
      }, [] as string[]);
    case "MemberExpression":
      return [extractFieldsFromMemberExpression(expression)];
    case "Identifier":
      return [expression.name];
    default:
      return [];
  }
}

/**
 *
 */
export function extractFields(expression: Expression) {
  const fields = extractFieldsFromExpression(expression);
  return Array.from(new Set(fields));
}
