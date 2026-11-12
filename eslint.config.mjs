// Lint: only rules that find real mistakes (ESLint's "recommended" set). No style rules; the code has no build step.
import js from "@eslint/js";
import globals from "globals";

const extensionGlobals = { ...globals.browser, ...globals.serviceworker, chrome: "readonly", browser: "readonly" };

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "test-results/",
      "Claude outputs/",
      "scratch-vi.mjs",
      "extension/vendor/", // pinned by SHA-256 in tests/static-check.mjs
      "extension/lib/gifenc.js", // vendored (gifenc)
      "site/convert/lib/", // generated copy of extension/lib (npm run site-lib)
      "site/convert/vendor/",
      "store/",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      // Unused names are worth seeing but never block a build (a few exist today, in shipped code that stays as is).
      "no-unused-vars": ["warn", { caughtErrors: "none", varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
      // The file-name and palette sanitisers match control characters on purpose.
      "no-control-regex": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-regex-spaces": "off",
    },
  },
  { files: ["extension/**/*.js", "site/**/*.js"], languageOptions: { globals: extensionGlobals } },
  { files: ["scripts/**/*.mjs", "tests/**/*.mjs", "*.mjs"], languageOptions: { globals: { ...globals.node, ...globals.browser, chrome: "readonly" } } },
];
