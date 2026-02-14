import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**", "coverage/**", "node_modules/**", "cdk.out/**", "bin/**/*.js", "bin/**/*.d.ts", "lib/**/*.js", "lib/**/*.d.ts", "test/**/*.js", "test/**/*.d.ts"]
    },
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn"
        }
    }
];
