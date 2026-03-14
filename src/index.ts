// Core
export { AgentEyes } from "./core/agent-eyes";
export { EventBuffer } from "./core/event-buffer";

// Types
export type {
  AgentEvent,
  AgentEyesConfig,
  LogEntry,
  NetworkEntry,
  ErrorEntry,
  DOMSnapshotEntry,
  PerformanceEntry,
  ReactComponentEntry,
  LogLevel,
} from "./types";

// React
export {
  AgentEyesProvider,
  useAgentEyes,
  useAgentEvents,
  useAgentSnapshot,
} from "./react/context";
export type { AgentEyesProviderProps } from "./react/context";

// Server / Transport
export { createPostMessageEndpoint, serializeForTransport } from "./server/endpoint";

// Vite plugin
export { agentEyesPlugin } from "./vite/plugin";

// Utilities
export { redact } from "./core/redact";

// Client bridge
export { WSBridge } from "./client/ws-bridge";
export { captureScreenshot } from "./client/screenshot";
