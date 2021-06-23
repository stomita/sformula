import assert from "assert";
import { replace } from "estraverse";
import { parseSync, compileSync } from "..";

test("should compile transformed ast directly", () => {
  const formula = "Text1__c & ' ' & Text2__c";
  const fml1 = parseSync(formula, {
    inputTypes: {
      Text1__c: { type: "string" },
      Text2__c: { type: "string" },
    },
    returnType: "string",
  });
  const ret1 = fml1.evaluate({ Text1__c: "a", Text2__c: "b" });
  assert(ret1 === "a b");
  assert("version" in fml1.compiled);
  const { ast } = fml1.compiled;
  const ast2 = replace(ast, {
    enter(node) {
      if (node.type === "Identifier") {
        if (node.name === "Text1__c") {
          return {
            ...node,
            name: "Text2__c",
          };
        }
      }
      return node;
    },
  }) as typeof ast;
  const fml2 = compileSync(ast2, {
    inputTypes: {
      Text1__c: { type: "string" },
      Text2__c: { type: "string" },
    },
    returnType: "string",
  });
  const ret2 = fml2.evaluate({ Text1__c: "a", Text2__c: "b" });
  assert(ret2 === "b b");
});
