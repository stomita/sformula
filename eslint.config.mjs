import js from "@eslint/js";
import tseslint from 'typescript-eslint';
import tsParser from "@typescript-eslint/parser";

const files = ["**/*.ts", "webpack.config.js"];

export default [
  { ...js.configs.recommended, files },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files })),
  {
    languageOptions: {
      globals: {},
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },
    files,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        ignoreRestSiblings: true,
      }],
    },
  },
];
