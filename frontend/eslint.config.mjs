import js from "@eslint/js";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

const nextCoreWebVitalsRules = nextPlugin.configs["core-web-vitals"].rules;

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Ignore build artifacts and deps
  { ignores: ["node_modules", ".next", ".turbo", "dist", "build"] },

  // Base JS rules
  js.configs.recommended,

  // Base TS rules (no type-checking)
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextCoreWebVitalsRules,
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextCoreWebVitalsRules,
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
