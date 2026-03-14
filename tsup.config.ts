import { defineConfig } from "tsup";

export default defineConfig([
  // Browser library
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom"],
    treeshake: true,
  },
  // MCP server (Node.js)
  {
    entry: ["src/mcp/cli.ts"],
    format: ["cjs"],
    outDir: "dist/mcp",
    splitting: false,
    sourcemap: true,
    banner: { js: "#!/usr/bin/env node" },
    platform: "node",
    target: "node18",
  },
]);
