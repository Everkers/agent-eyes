<p align="center">
  <img src="docs/assets/logo/logo.png" alt="AgentEyes" width="140" />
</p>

<h1 align="center">AgentEyes</h1>

<p align="center">
  Give your AI coding agent eyes into your running app.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agent-eyes"><img src="https://img.shields.io/npm/v/agent-eyes.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://github.com/Everkers/agent-eyes/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/agent-eyes.svg?style=flat-square" alt="license" /></a>
</p>

---

AgentEyes streams console logs, network requests, DOM snapshots, errors, performance metrics, React component renders, and screenshots from your browser — directly to your coding agent over [MCP](https://modelcontextprotocol.io).

**Dev-only by default.** In production, AgentEyes is completely inert — no monkey-patching, no WebSocket connections, zero overhead.

## How it works

```
┌──────────────┐    WebSocket     ┌──────────────┐    stdio/MCP    ┌──────────────┐
│   Your App   │ ──────────────>  │  AgentEyes   │ <────────────>  │  Any Agent   │
│   (browser)  │  events stream   │  MCP Server  │  tools/queries  │  (Kiro,      │
│              │                  │  :9960       │                 │   Cursor...) │
└──────────────┘                  └──────────────┘                 └──────────────┘
```

## Quick start

### 1. Add to your app

**React (Provider component)**
```tsx
import { AgentEyesProvider } from 'agent-eyes';

function App() {
  return (
    <AgentEyesProvider config={{ mcpBridge: true }}>
      <YourApp />
    </AgentEyesProvider>
  );
}
```

**Vite (Plugin — zero app code)**
```ts
// vite.config.ts
import { agentEyesPlugin } from 'agent-eyes/vite';
export default defineConfig({ plugins: [agentEyesPlugin()] });
```

**Next.js (Client component wrapper)**
```tsx
// app/agent-eyes-provider.tsx
"use client";
import { AgentEyesProvider } from "agent-eyes";

export default function AgentEyesWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AgentEyesProvider config={{ mcpBridge: true }}>
      {children}
    </AgentEyesProvider>
  );
}

// app/layout.tsx
import AgentEyesWrapper from "./agent-eyes-provider";

export default function RootLayout({ children }) {
  return (
    <html><body><AgentEyesWrapper>{children}</AgentEyesWrapper></body></html>
  );
}
```

**Vanilla (no framework)**
```ts
import { AgentEyes } from 'agent-eyes';

const eyes = new AgentEyes({ mcpBridge: true });
eyes.start();
```

### 2. Configure your agent's MCP

Add to your MCP config (`.kiro/settings/mcp.json`, `.cursor/mcp.json`, `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agent-eyes": {
      "command": "npx",
      "args": ["agent-eyes"]
    }
  }
}
```

That's it. Your agent can now see your app.

## Examples

See the [`examples/`](./examples) directory for complete working apps:

| Example | Setup | Description |
|---------|-------|-------------|
| [`examples/react`](./examples/react) | `AgentEyesProvider` | React app using the provider component |
| [`examples/vite`](./examples/vite) | `agentEyesPlugin()` | Vite app with zero-config plugin auto-injection |
| [`examples/nextjs`](./examples/nextjs) | `"use client"` wrapper | Next.js App Router with client component provider |

To run any example:

```bash
cd examples/react   # or vite, nextjs
npm install
npm run dev
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `get_console_logs` | Console log/warn/error/debug/info with args and stack traces. Filter by level. |
| `get_network_requests` | Fetch & XHR with headers, bodies, status, timing. Filter by method, status, URL. |
| `get_errors` | Runtime errors and unhandled promise rejections with stack traces. |
| `get_dom_snapshot` | Simplified DOM snapshot with semantic attributes (id, class, role, aria-label, data-testid). |
| `get_performance_metrics` | Core Web Vitals (FCP, LCP), load timing, memory usage. |
| `get_react_components` | Component names, props, and render counts. Filter by name. |
| `get_snapshot` | Full state dump — everything at once. |
| `get_failed_requests` | All failed network requests (status >= 400 or errors). |
| `take_screenshot` | Visual screenshot of the running app. Supports CSS selector targeting. |
| `get_status` | Connection status — connected browsers, event counts by type. |
| `clear_events` | Clear the event buffer. |

## Production Safety

agent-eyes auto-detects the environment and is completely inert in production:

- Checks `import.meta.env.DEV` (Vite), `process.env.NODE_ENV` (CRA/Next.js), and localhost hostname
- No console/fetch/XHR monkey-patching in production
- No WebSocket connections
- All methods return empty data — zero runtime overhead

## Configuration

### Basic

```ts
const eyes = new AgentEyes({
  maxBufferSize: 500,       // max events in memory (default: 500)
  enabled: true,            // force enable/disable (auto-detects by default)
  mcpBridge: true,          // connect to MCP server at ws://localhost:9960
  redactPatterns: ['authorization', 'cookie', 'token', 'password'],
  filter: (event) => true,  // drop events before they enter the buffer
  onEvent: (event) => {},   // callback for every captured event
  collectors: {
    console: true,
    network: true,
    errors: true,
    dom: true,
    performance: true,
    reactComponents: false,  // opt-in (needs React DevTools hook)
  },
});
```

### Granular Collector Options

```ts
const eyes = new AgentEyes({
  mcpBridge: true,

  // Console
  console: {
    levels: ['warn', 'error'],   // only capture these levels
    maxArgLength: 5000,          // truncate serialized args
    stackTraceAll: false,        // stack traces for all levels, not just errors
  },

  // Network
  network: {
    methods: ['GET', 'POST'],           // only capture these HTTP methods
    captureRequestHeaders: true,
    captureResponseHeaders: true,
    captureRequestBody: true,
    captureResponseBody: true,
    maxBodySize: 10000,                 // truncate large bodies
    ignorePatterns: ['/analytics', /hot-update/],
  },

  // DOM
  dom: {
    maxDepth: 8,                // how deep to traverse the tree
    debounceMs: 1000,           // debounce mutation-triggered snapshots
    disableAutoSnapshot: false, // disable auto-snapshots on mutations
    extraAttributes: ['data-cy', 'data-automation-id'],
  },

  // Performance
  performance: {
    disableLCP: false,
    disableMemory: false,
  },

  // React Components (opt-in)
  reactComponents: {
    includeNames: [/^App/, 'Header'],   // only track matching components
    excludeNames: [/^Styled/],          // skip these
    captureProps: true,
    maxPropsDepth: 2,
  },
});
```

### Vite Plugin Options

```ts
agentEyesPlugin({
  devOnly: true,              // only inject in dev mode (default: true)
  inject: true,               // auto-inject script tag (default: true)
  mcpBridge: true,            // connect to MCP bridge (default: true)
  redactPatterns: ['authorization', 'cookie'],
})
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_EYES_PORT` | `9960` | WebSocket port for the MCP server |

Set it in your MCP config:

```json
{
  "mcpServers": {
    "agent-eyes": {
      "command": "npx",
      "args": ["agent-eyes"],
      "env": {
        "AGENT_EYES_PORT": "8888"
      }
    }
  }
}
```

Then point the client to the same port:

```ts
const eyes = new AgentEyes({ mcpBridge: 'ws://localhost:8888' });
```

## Security

- Sensitive headers and body fields are redacted when `redactPatterns` is set
- Patterns match against header names and JSON keys (case-insensitive)
- The WebSocket server only binds to localhost — not accessible from the network
- No data leaves your machine. Everything stays between browser ↔ MCP server ↔ agent
- In production, nothing runs at all

## React Hooks

```tsx
import { useAgentEyes, useAgentEvents, useAgentSnapshot } from 'agent-eyes';

function DevPanel() {
  const eyes = useAgentEyes();                    // the AgentEyes instance
  const errors = useAgentEvents('error');          // live-updating error list
  const snapshot = useAgentSnapshot();             // full state snapshot
  return <pre>{JSON.stringify(snapshot, null, 2)}</pre>;
}
```

## How It Works

1. `AgentEyes` monkey-patches `console.*`, `fetch`, and `XMLHttpRequest` to capture events
2. A `MutationObserver` watches the DOM for structural changes
3. `PerformanceObserver` tracks Core Web Vitals and memory
4. Events stream over WebSocket to the MCP server process
5. The MCP server exposes tools over stdio that any agent can call
6. Screenshots use `html2canvas` — the MCP server sends a request to the browser, which renders and returns the image

## License

MIT
