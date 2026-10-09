import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["scripts/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-static/**", // Generated static export; source remains linted.
    ".next-preview/**", // Isolated development output is also generated.
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/engine/**", // Unmodified third-party GPL builds, not application source.
  ]),
]);

export default eslintConfig;
