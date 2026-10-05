import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  // Ignore build outputs and node_modules
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.tsbuildinfo",
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript rules for all TS/TSX files
  ...tseslint.configs.recommended,

  // Frontend-specific rules
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Relax some rules for pragmatic code
      "@typescript-eslint/no-explicit-any": "off",
      // This rule is too strict — it flags valid async fetch patterns inside effects
      "react-hooks/set-state-in-effect": "off",
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Backend-specific rules
  {
    files: ["backend/src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }
);
