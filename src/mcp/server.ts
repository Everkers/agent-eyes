import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { createConnection } from "net";
import type { AgentEvent } from "../types";

/**
 * MCP Server that acts as the bridge between the browser and any LLM agent.
 *
 * Architecture:
 *   Browser (agent-eyes client) --WebSocket--> MCP Server <--stdio--> Agent (Kiro, Cursor, etc.)
 *
 * The browser pushes events over WS, agents query via MCP tools.
 */

// ── In-memory event store ──
let events: AgentEvent[] = [];
const MAX_EVENTS = 2000;
let connectedClients = new Set<WebSocket>();
const pendingRequests = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let requestIdCounter = 0;

function pushEvent(event: AgentEvent) {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }
}

/** Send a request to the first connected browser and wait for a response */
function requestFromBrowser(action: string, params?: unknown, timeoutMs = 10000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const client = [...connectedClients][0];
    if (!client || client.readyState !== WebSocket.OPEN) {
      return reject(new Error("No browser connected"));
    }

    const id = `req_${++requestIdCounter}`;
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error("Browser request timed out"));
    }, timeoutMs);

    pendingRequests.set(id, {
      resolve: (v) => { clearTimeout(timer); pendingRequests.delete(id); resolve(v); },
      reject: (e) => { clearTimeout(timer); pendingRequests.delete(id); reject(e); },
    });

    client.send(JSON.stringify({ type: "request", id, action, params }));
  });
}

function getEvents(type?: string, limit?: number): AgentEvent[] {
  let result = type ? events.filter((e) => e.type === type) : [...events];
  if (limit && limit > 0) result = result.slice(-limit);
  return result;
}

function getSnapshot(limit = 50) {
  const cap = (arr: AgentEvent[]) => arr.slice(-limit);
  return {
    logs: cap(events.filter((e) => e.type === "log")),
    network: cap(events.filter((e) => e.type === "network")),
    errors: cap(events.filter((e) => e.type === "error")),
    dom: events.filter((e) => e.type === "dom-snapshot").slice(-1),
    performance: cap(events.filter((e) => e.type === "performance")),
    components: cap(events.filter((e) => e.type === "react-component")),
    meta: {
      totalEvents: events.length,
      connectedBrowsers: connectedClients.size,
      limitPerCategory: limit,
      timestamp: Date.now(),
    },
  };
}

// ── Port management ──

/** Check if a port is in use by attempting a TCP connection */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/** Kill whatever process is holding the port (best-effort, cross-platform) */
async function killPortHolder(port: number): Promise<void> {
  const { exec } = await import("child_process");
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const cmd = isWin
      ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`
      : `lsof -ti tcp:${port} | xargs kill -9 2>/dev/null`;

    exec(cmd, () => {
      // Give the OS a moment to release the port
      setTimeout(resolve, 500);
    });
  });
}

// ── WebSocket server for browser clients ──
function startWSServer(port: number): Promise<WebSocketServer> {
  return new Promise(async (resolve, reject) => {
    // If the port is already occupied, kill the stale process so the
    // browser reconnects to *this* instance (the one the IDE talks to).
    if (await isPortInUse(port)) {
      console.error(`[agent-eyes] Port ${port} in use — killing stale process...`);
      await killPortHolder(port);
    }

    const wss = new WebSocketServer({ port });

    wss.on("listening", () => resolve(wss));

    wss.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Race condition: something grabbed the port between our check and bind
        console.error(`[agent-eyes] Port ${port} still in use, trying ${port + 1}...`);
        wss.close();
        startWSServer(port + 1).then(resolve, reject);
      } else {
        reject(err);
      }
    });

    wss.on("connection", (ws) => {
      connectedClients.add(ws);
      ws.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "event") {
            pushEvent(data.payload);
          } else if (data.type === "batch") {
            (data.payload as AgentEvent[]).forEach(pushEvent);
          } else if (data.type === "response" && data.id) {
            const pending = pendingRequests.get(data.id);
            if (pending) {
              if (data.error) {
                pending.reject(new Error(data.error));
              } else {
                pending.resolve(data.result);
              }
            }
          }
        } catch {
          // ignore malformed messages
        }
      });
      ws.on("close", () => connectedClients.delete(ws));
    });
  });
}

// ── MCP Server with tools ──
function createMCPServer() {
  const server = new McpServer({
    name: "agent-eyes",
    version: "0.1.0",
  });

  // ── Tools ──

  server.tool(
    "get_console_logs",
    "Get captured console logs from the running application. Returns log/warn/error/debug/info entries with arguments and stack traces.",
    {
      level: z.enum(["log", "warn", "error", "debug", "info"]).optional().describe("Filter by log level"),
      limit: z.number().optional().describe("Max number of entries to return (most recent first)"),
    },
    async ({ level, limit }) => {
      let logs = events.filter((e) => e.type === "log") as Array<AgentEvent & { level: string }>;
      if (level) logs = logs.filter((e) => e.level === level);
      if (limit) logs = logs.slice(-limit);
      return { content: [{ type: "text", text: JSON.stringify(logs, null, 2) }] };
    }
  );

  server.tool(
    "get_network_requests",
    "Get captured network requests (fetch & XHR) from the running application. Includes method, URL, status, headers, request/response bodies, and timing.",
    {
      method: z.string().optional().describe("Filter by HTTP method (GET, POST, etc.)"),
      status_min: z.number().optional().describe("Minimum status code (e.g. 400 for errors)"),
      status_max: z.number().optional().describe("Maximum status code"),
      url_contains: z.string().optional().describe("Filter URLs containing this string"),
      limit: z.number().optional().describe("Max entries to return"),
    },
    async ({ method, status_min, status_max, url_contains, limit }) => {
      let reqs = events.filter((e) => e.type === "network") as Array<AgentEvent & { method: string; status?: number; url: string }>;
      if (method) reqs = reqs.filter((e) => e.method.toUpperCase() === method.toUpperCase());
      if (status_min != null) reqs = reqs.filter((e) => (e.status ?? 0) >= status_min);
      if (status_max != null) reqs = reqs.filter((e) => (e.status ?? 0) <= status_max);
      if (url_contains) reqs = reqs.filter((e) => e.url.includes(url_contains));
      if (limit) reqs = reqs.slice(-limit);
      return { content: [{ type: "text", text: JSON.stringify(reqs, null, 2) }] };
    }
  );

  server.tool(
    "get_errors",
    "Get captured runtime errors and unhandled promise rejections from the running application.",
    {
      limit: z.number().optional().describe("Max entries to return"),
    },
    async ({ limit }) => {
      let errs = events.filter((e) => e.type === "error");
      if (limit) errs = errs.slice(-limit);
      return { content: [{ type: "text", text: JSON.stringify(errs, null, 2) }] };
    }
  );

  server.tool(
    "get_dom_snapshot",
    "Get the latest simplified DOM snapshot of the running application. Shows the page structure with important attributes (id, class, role, aria-label, data-testid, etc.).",
    {},
    async () => {
      const snapshots = events.filter((e) => e.type === "dom-snapshot");
      const latest = snapshots[snapshots.length - 1];
      if (!latest) {
        return { content: [{ type: "text", text: "No DOM snapshot available. Is the browser connected?" }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(latest, null, 2) }] };
    }
  );

  server.tool(
    "get_performance_metrics",
    "Get captured performance metrics including Core Web Vitals (FCP, LCP), load timing, and memory usage.",
    {},
    async () => {
      const perfs = events.filter((e) => e.type === "performance");
      return { content: [{ type: "text", text: JSON.stringify(perfs, null, 2) }] };
    }
  );

  server.tool(
    "get_react_components",
    "Get captured React component render information including component names, props, and render counts.",
    {
      name: z.string().optional().describe("Filter by component name"),
      limit: z.number().optional().describe("Max entries to return"),
    },
    async ({ name, limit }) => {
      let comps = events.filter((e) => e.type === "react-component") as Array<AgentEvent & { name: string }>;
      if (name) comps = comps.filter((e) => e.name.toLowerCase().includes(name.toLowerCase()));
      if (limit) comps = comps.slice(-limit);
      return { content: [{ type: "text", text: JSON.stringify(comps, null, 2) }] };
    }
  );

  server.tool(
    "get_snapshot",
    "Get a full snapshot of the application state — logs, network, errors, DOM, performance, and React components all at once.",
    {
      limit: z.number().optional().describe("Max entries per category (default: 50). DOM always returns latest only."),
    },
    async ({ limit }) => {
      return { content: [{ type: "text", text: JSON.stringify(getSnapshot(limit ?? 50), null, 2) }] };
    }
  );

  server.tool(
    "get_failed_requests",
    "Shortcut to get all failed network requests (status >= 400 or network errors).",
    {},
    async () => {
      const failed = events.filter(
        (e) => e.type === "network" && ((e as any).status >= 400 || (e as any).error)
      );
      return { content: [{ type: "text", text: JSON.stringify(failed, null, 2) }] };
    }
  );

  server.tool(
    "clear_events",
    "Clear all captured events from the buffer.",
    {},
    async () => {
      events = [];
      return { content: [{ type: "text", text: "All events cleared." }] };
    }
  );

  server.tool(
    "get_status",
    "Check the connection status — how many browsers are connected and how many events are buffered.",
    {},
    async () => {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            connectedBrowsers: connectedClients.size,
            totalEvents: events.length,
            eventBreakdown: {
              logs: events.filter((e) => e.type === "log").length,
              network: events.filter((e) => e.type === "network").length,
              errors: events.filter((e) => e.type === "error").length,
              domSnapshots: events.filter((e) => e.type === "dom-snapshot").length,
              performance: events.filter((e) => e.type === "performance").length,
              reactComponents: events.filter((e) => e.type === "react-component").length,
            },
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "take_screenshot",
    "Take a screenshot of the running application. Returns a base64-encoded PNG image. Requires a browser to be connected.",
    {
      selector: z.string().optional().describe("CSS selector to capture a specific element (default: full page)"),
      quality: z.number().min(0).max(1).optional().describe("Image quality 0-1 (default: 0.8)"),
      maxWidth: z.number().optional().describe("Max width in pixels (default: 1280)"),
    },
    async ({ selector, quality, maxWidth }) => {
      try {
        const result = await requestFromBrowser("screenshot", { selector, quality, maxWidth }) as { image: string };
        return {
          content: [{
            type: "image" as const,
            data: result.image.replace(/^data:image\/png;base64,/, ""),
            mimeType: "image/png" as const,
          }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Screenshot failed: ${err instanceof Error ? err.message : err}` }],
        };
      }
    }
  );

  return server;
}

// ── Main entry point ──
export async function startAgentEyesMCP(wsPort = 9960) {
  // Start WebSocket server for browser connections
  const wss = await startWSServer(wsPort);
  const actualPort = (wss.address() as { port: number }).port;
  console.error(`[agent-eyes] WebSocket server listening on ws://localhost:${actualPort}`);

  // Start MCP server on stdio for agent connections
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[agent-eyes] MCP server running on stdio");

  return { server, wss };
}
