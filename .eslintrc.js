"use strict";

module.exports = {
  plugins: ["@typescript-eslint", "react", "react-hooks", "import"],
  overrides: [
    {
      files: ["src/**/*.{ts,tsx}"],
      extends: [
        "plugin:react/recommended",
        "plugin:import/typescript",
        "prettier",
      ],
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      env: {
        es6: true,
        browser: true,
      },
      settings: {
        react: {
          version: "detect",
        },
      },
      rules: {},
    },
  ],
};
