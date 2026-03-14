import type { AgentEvent, AgentEyesConfig } from "../types";
import { EventBuffer } from "./event-buffer";
import { createConsoleCollector } from "../collectors/console";
import { createNetworkCollector } from "../collectors/network";
import { createErrorCollector } from "../collectors/errors";
import { createDOMCollector } from "../collectors/dom";
import { createPerformanceCollector } from "../collectors/performance";
import { createReactComponentCollector } from "../collectors/react-components";
import { WSBridge } from "../client/ws-bridge";
import { captureScreenshot } from "../client/screenshot";

/**
 * Detects if we're in a development environment.
 * Checks Vite, Next.js, CRA, and generic NODE_ENV.
 */
function isDevEnvironment(): boolean {
  try {
    // Vite
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) return true;
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.MODE === "development") return true;
  } catch {}
  try {
    // CRA / generic
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") return true;
  } catch {}
  // Localhost heuristic as fallback
  if (typeof window !== "undefined") {
    const host = window.location?.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") return true;
  }
  return false;
}

const NOOP_UNSUB = () => {};
const EMPTY_SNAPSHOT = {
  logs: [] as AgentEvent[], network: [] as AgentEvent[], errors: [] as AgentEvent[],
  dom: [] as AgentEvent[], performance: [] as AgentEvent[], components: [] as AgentEvent[],
  meta: { url: "", timestamp: 0, eventCount: 0 },
};

/**
 * Main class that orchestrates all collectors and provides
 * a unified API for agents to query application state.
 *
 * In production, all methods are no-ops — zero overhead, no monkey-patching.
 * Set `enabled: true` in config to force-enable regardless of environment.
 */
export class AgentEyes {
  private buffer: EventBuffer;
  private teardowns: (() => void)[] = [];
  private config: AgentEyesConfig;
  private _started = false;
  private bridge: WSBridge | null = null;
  private _enabled: boolean;

  constructor(config: AgentEyesConfig = {}) {
    this._enabled = config.enabled ?? isDevEnvironment();

    this.config = {
      ...config,
      collectors: {
        console: true,
        network: true,
        errors: true,
        dom: true,
        performance: true,
        reactComponents: false,
        ...config.collectors,
      },
    };
    this.buffer = new EventBuffer(this.config);
  }

  /** Start all enabled collectors. No-op in production. */
  start(): void {
    if (!this._enabled || this._started) return;
    this._started = true;

    const c = this.config.collectors!;

    if (c.console) {
      this.teardowns.push(createConsoleCollector(this.buffer, this.config.console));
    }
    if (c.network) {
      this.teardowns.push(
        createNetworkCollector(this.buffer, this.config.network, this.config.redactPatterns)
      );
    }
    if (c.errors && typeof window !== "undefined") {
      this.teardowns.push(createErrorCollector(this.buffer));
    }
    if (c.dom && typeof document !== "undefined") {
      this.teardowns.push(createDOMCollector(this.buffer, this.config.dom));
    }
    if (c.performance && typeof window !== "undefined") {
      this.teardowns.push(createPerformanceCollector(this.buffer, this.config.performance));
    }
    if (c.reactComponents) {
      this.teardowns.push(createReactComponentCollector(this.buffer, this.config.reactComponents));
    }

    // Connect to MCP bridge if configured
    if (this.config.mcpBridge) {
      const url =
        typeof this.config.mcpBridge === "string"
          ? this.config.mcpBridge
          : "ws://localhost:9960";
      this.bridge = new WSBridge(url);
      this.bridge.connect();

      // Register screenshot handler so the MCP server can request one
      this.bridge.onRequest("screenshot", async (params) => {
        const opts = params as { selector?: string; quality?: number; maxWidth?: number } | undefined;
        return { image: await captureScreenshot(opts) };
      });

      // Forward all events to the MCP server
      const unsub = this.buffer.subscribe((event) => {
        this.bridge?.send(event);
      });
      this.teardowns.push(() => {
        unsub();
        this.bridge?.disconnect();
        this.bridge = null;
      });
    }
  }

  /** Stop all collectors and clean up */
  stop(): void {
    this.teardowns.forEach((fn) => fn());
    this.teardowns = [];
    this._started = false;
  }

  /** Get all captured events */
  getEvents(type?: AgentEvent["type"]): AgentEvent[] {
    if (!this._enabled) return [];
    return this.buffer.getAll(type);
  }

  /** Get the last N events */
  getRecent(n = 20): AgentEvent[] {
    if (!this._enabled) return [];
    return this.buffer.getLast(n);
  }

  /** Subscribe to real-time events */
  subscribe(fn: (event: AgentEvent) => void): () => void {
    if (!this._enabled) return NOOP_UNSUB;
    return this.buffer.subscribe(fn);
  }

  /** Clear all captured events */
  clear(): void {
    if (!this._enabled) return;
    this.buffer.clear();
  }

  /**
   * Generate a full context snapshot for an agent.
   * This is the main method agents should call to "see" the app.
   */
  snapshot() {
    if (!this._enabled) return EMPTY_SNAPSHOT;
    return {
      logs: this.buffer.getAll("log"),
      network: this.buffer.getAll("network"),
      errors: this.buffer.getAll("error"),
      dom: this.buffer.getAll("dom-snapshot"),
      performance: this.buffer.getAll("performance"),
      components: this.buffer.getAll("react-component"),
      meta: {
        url: typeof window !== "undefined" ? window.location.href : "",
        timestamp: Date.now(),
        eventCount: this.buffer.size,
      },
    };
  }

  /** Serialize everything to a JSON string for transport */
  toJSON(): string {
    if (!this._enabled) return "{}";
    return JSON.stringify(this.snapshot(), null, 2);
  }

  get isRunning(): boolean {
    return this._started;
  }

  get enabled(): boolean {
    return this._enabled;
  }
}
