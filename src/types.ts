// ── Core event types that agents can consume ──

export type LogLevel = "log" | "warn" | "error" | "debug" | "info";

export interface LogEntry {
  type: "log";
  level: LogLevel;
  args: unknown[];
  timestamp: number;
  stack?: string;
}

export interface NetworkEntry {
  type: "network";
  method: string;
  url: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  duration?: number;
  timestamp: number;
  error?: string;
}

export interface ErrorEntry {
  type: "error";
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
}

export interface DOMSnapshotEntry {
  type: "dom-snapshot";
  html: string;
  url: string;
  viewport: { width: number; height: number };
  timestamp: number;
}

export interface PerformanceEntry {
  type: "performance";
  metrics: {
    domContentLoaded?: number;
    loadComplete?: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    memoryUsage?: number;
  };
  timestamp: number;
}

export interface ReactComponentEntry {
  type: "react-component";
  name: string;
  props: Record<string, unknown>;
  state?: Record<string, unknown>;
  renderCount: number;
  timestamp: number;
}

export type AgentEvent =
  | LogEntry
  | NetworkEntry
  | ErrorEntry
  | DOMSnapshotEntry
  | PerformanceEntry
  | ReactComponentEntry;

export interface AgentEyesConfig {
  /** Max events to keep in buffer (default: 500) */
  maxBufferSize?: number;

  /**
   * Force enable/disable regardless of environment detection.
   * By default, agent-eyes auto-detects dev mode (Vite DEV, NODE_ENV=development, localhost).
   * In production it's completely inert — no monkey-patching, no WS connections, zero overhead.
   */
  enabled?: boolean;

  /** Which collectors to enable (all default to true except reactComponents) */
  collectors?: {
    console?: boolean;
    network?: boolean;
    errors?: boolean;
    dom?: boolean;
    performance?: boolean;
    reactComponents?: boolean;
  };

  /** Fine-grained console collector options */
  console?: {
    /** Which log levels to capture (default: all) */
    levels?: LogLevel[];
    /** Max length for serialized args (default: 5000 chars) */
    maxArgLength?: number;
    /** Include stack traces for all levels, not just errors (default: false) */
    stackTraceAll?: boolean;
  };

  /** Fine-grained network collector options */
  network?: {
    /** HTTP methods to capture (default: all). e.g. ["GET", "POST"] */
    methods?: string[];
    /** Capture request headers (default: true) */
    captureRequestHeaders?: boolean;
    /** Capture response headers (default: true) */
    captureResponseHeaders?: boolean;
    /** Capture request body (default: true) */
    captureRequestBody?: boolean;
    /** Capture response body (default: true) */
    captureResponseBody?: boolean;
    /** Max response body size in chars before truncation (default: 10000) */
    maxBodySize?: number;
    /** URL patterns to ignore (e.g. analytics endpoints) */
    ignorePatterns?: (string | RegExp)[];
  };

  /** Fine-grained DOM snapshot options */
  dom?: {
    /** Max depth to traverse the DOM tree (default: 8) */
    maxDepth?: number;
    /** Debounce time in ms for mutation-triggered snapshots (default: 1000) */
    debounceMs?: number;
    /** Disable auto-snapshots on DOM mutations (default: false) */
    disableAutoSnapshot?: boolean;
    /** Additional attributes to capture beyond the defaults */
    extraAttributes?: string[];
  };

  /** Fine-grained performance options */
  performance?: {
    /** Disable LCP tracking (default: false) */
    disableLCP?: boolean;
    /** Disable memory tracking (default: false) */
    disableMemory?: boolean;
  };

  /** Fine-grained React component tracking options */
  reactComponents?: {
    /** Only track components matching these names (default: all) */
    includeNames?: (string | RegExp)[];
    /** Exclude components matching these names */
    excludeNames?: (string | RegExp)[];
    /** Capture props (default: true) */
    captureProps?: boolean;
    /** Max depth for serializing props (default: 2) */
    maxPropsDepth?: number;
  };

  /** Filter events before they enter the buffer */
  filter?: (event: AgentEvent) => boolean;
  /** Called whenever a new event is captured */
  onEvent?: (event: AgentEvent) => void;
  /** Redact sensitive headers/body fields */
  redactPatterns?: (string | RegExp)[];
  /** Connect to the MCP bridge server. Set to true for default (ws://localhost:9960) or provide a URL. */
  mcpBridge?: boolean | string;
}
