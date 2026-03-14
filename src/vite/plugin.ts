// Plugin type used internally only — not exposed in .d.ts to avoid cross-package type conflicts
import type { Plugin } from "vite";

export interface AgentEyesVitePluginOptions {
  /** Only inject in development mode (default: true) */
  devOnly?: boolean;
  /** Auto-inject the script tag into HTML */
  inject?: boolean;
  /** Connect to MCP bridge (default: true). Set to a string for custom WS URL. */
  mcpBridge?: boolean | string;
  /** Redact sensitive header/body fields matching these patterns */
  redactPatterns?: string[];
}

/**
 * Vite plugin that auto-injects AgentEyes into your dev server.
 *
 * ```ts
 * // vite.config.ts
 * import { agentEyesPlugin } from 'agent-eyes/vite';
 *
 * export default defineConfig({
 *   plugins: [agentEyesPlugin()],
 * });
 * ```
 */
export function agentEyesPlugin(options: AgentEyesVitePluginOptions = {}): any {
  const { devOnly = true, inject = true, mcpBridge = true, redactPatterns } = options;

  const configJSON = JSON.stringify({
    mcpBridge,
    ...(redactPatterns ? { redactPatterns } : {}),
  });

  const initCode = `
import { AgentEyes } from 'agent-eyes';
const eyes = new AgentEyes(${configJSON});
eyes.start();
window.__AGENT_EYES__ = eyes;
console.log('[agent-eyes] 👁️ Active');
`;

  const plugin: Plugin = {
    name: "agent-eyes",
    enforce: "pre",

    configureServer(server) {
      server.middlewares.use("/__agent-eyes-init.js", async (_req, res) => {
        const result = await server.transformRequest("/__agent-eyes-init.js");
        res.setHeader("Content-Type", "application/javascript");
        res.end(result?.code ?? "");
      });
    },

    resolveId(id) {
      if (id === "/__agent-eyes-init.js") return id;
    },

    load(id) {
      if (id === "/__agent-eyes-init.js") return initCode;
    },

    transformIndexHtml(html, ctx) {
      if (devOnly && !ctx.server) return html;
      if (!inject) return html;

      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: { type: "module", src: "/__agent-eyes-init.js" },
            injectTo: "head",
          },
        ],
      };
    },
  };

  return plugin;
}
