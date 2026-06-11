import { defineConfig, type Options } from "tsup";

/** Shared tsup defaults — dual ESM + CJS for Node `import` and `require`. */
export function stambhaPackageConfig(overrides: Options = {}) {
  return defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node20",
    ...overrides,
  });
}
