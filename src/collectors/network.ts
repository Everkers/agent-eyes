import type { AgentEyesConfig, NetworkEntry } from "../types";
import type { EventBuffer } from "../core/event-buffer";
import { redact } from "../core/redact";

type NetworkConfig = AgentEyesConfig["network"];

/**
 * Intercepts fetch and XMLHttpRequest to capture network activity.
 * Returns a teardown function that restores originals.
 */
export function createNetworkCollector(
  buffer: EventBuffer,
  config?: NetworkConfig,
  redactPatterns?: (string | RegExp)[]
): () => void {
  const opts = {
    methods: config?.methods,
    captureRequestHeaders: config?.captureRequestHeaders ?? true,
    captureResponseHeaders: config?.captureResponseHeaders ?? true,
    captureRequestBody: config?.captureRequestBody ?? true,
    captureResponseBody: config?.captureResponseBody ?? true,
    maxBodySize: config?.maxBodySize ?? 10000,
    ignorePatterns: config?.ignorePatterns ?? [],
    redactPatterns: redactPatterns ?? [],
  };

  const teardowns: (() => void)[] = [];
  teardowns.push(interceptFetch(buffer, opts));
  teardowns.push(interceptXHR(buffer, opts));
  return () => teardowns.forEach((fn) => fn());
}

interface ResolvedOpts {
  methods?: string[];
  captureRequestHeaders: boolean;
  captureResponseHeaders: boolean;
  captureRequestBody: boolean;
  captureResponseBody: boolean;
  maxBodySize: number;
  ignorePatterns: (string | RegExp)[];
  redactPatterns: (string | RegExp)[];
}

function shouldIgnore(url: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((p) =>
    typeof p === "string" ? url.includes(p) : p.test(url)
  );
}

function shouldCaptureMethod(method: string, allowed?: string[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.some((m) => m.toUpperCase() === method.toUpperCase());
}

function truncateBody(body: unknown, max: number): unknown {
  if (typeof body === "string" && body.length > max) {
    return body.slice(0, max) + "…[truncated]";
  }
  const str = JSON.stringify(body);
  if (str && str.length > max) {
    return str.slice(0, max) + "…[truncated]";
  }
  return body;
}

function interceptFetch(buffer: EventBuffer, opts: ResolvedOpts): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";

    if (shouldIgnore(url, opts.ignorePatterns) || !shouldCaptureMethod(method, opts.methods)) {
      return originalFetch(input, init);
    }

    const start = Date.now();
    const entry: NetworkEntry = { type: "network", method, url, timestamp: start };

    if (opts.captureRequestHeaders && init?.headers) {
      entry.requestHeaders = headersToRecord(init.headers);
    }
    if (opts.captureRequestBody && init?.body) {
      entry.requestBody = truncateBody(safeParseBody(init.body), opts.maxBodySize);
    }

    try {
      const response = await originalFetch(input, init);
      entry.status = response.status;
      entry.duration = Date.now() - start;

      if (opts.captureResponseHeaders) {
        entry.responseHeaders = headersToRecord(response.headers);
      }
      if (opts.captureResponseBody) {
        const clone = response.clone();
        try { entry.responseBody = truncateBody(await clone.json(), opts.maxBodySize); }
        catch { try { entry.responseBody = truncateBody(await clone.text(), opts.maxBodySize); } catch { entry.responseBody = "[unreadable]"; } }
      }

      if (opts.redactPatterns.length) {
        entry.requestHeaders = redact(entry.requestHeaders, opts.redactPatterns) as Record<string, string>;
        entry.responseHeaders = redact(entry.responseHeaders, opts.redactPatterns) as Record<string, string>;
        entry.requestBody = redact(entry.requestBody, opts.redactPatterns);
        entry.responseBody = redact(entry.responseBody, opts.redactPatterns);
      }

      buffer.push(entry);
      return response;
    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
      entry.duration = Date.now() - start;
      buffer.push(entry);
      throw err;
    }
  };

  return () => { globalThis.fetch = originalFetch; };
}

function interceptXHR(buffer: EventBuffer, opts: ResolvedOpts): () => void {
  const OriginalXHR = globalThis.XMLHttpRequest;
  const XHRProto = OriginalXHR.prototype;
  const originalOpen = XHRProto.open;
  const originalSend = XHRProto.send;
  const originalSetHeader = XHRProto.setRequestHeader;

  XHRProto.open = function (method: string, url: string | URL, ...rest: unknown[]) {
    (this as any).__agentEyes = {
      method, url: typeof url === "string" ? url : url.href,
      timestamp: Date.now(), requestHeaders: {},
    };
    return (originalOpen as Function).call(this, method, url, ...rest);
  };

  XHRProto.setRequestHeader = function (name: string, value: string) {
    const meta = (this as any).__agentEyes;
    if (meta?.requestHeaders) meta.requestHeaders[name] = value;
    return originalSetHeader.call(this, name, value);
  };

  XHRProto.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const meta = (this as any).__agentEyes;
    if (!meta || shouldIgnore(meta.url, opts.ignorePatterns) || !shouldCaptureMethod(meta.method, opts.methods)) {
      return originalSend.call(this, body);
    }
    const start = Date.now();
    if (opts.captureRequestBody && body) meta.requestBody = truncateBody(safeParseBody(body), opts.maxBodySize);

    this.addEventListener("loadend", () => {
      const entry: NetworkEntry = {
        type: "network", method: meta.method ?? "GET", url: meta.url ?? "",
        status: this.status, duration: Date.now() - start, timestamp: meta.timestamp ?? start,
        requestHeaders: opts.captureRequestHeaders ? meta.requestHeaders : undefined,
        responseHeaders: opts.captureResponseHeaders ? parseXHRHeaders(this.getAllResponseHeaders()) : undefined,
        requestBody: meta.requestBody,
        responseBody: opts.captureResponseBody ? truncateBody(safeParseBody(this.responseText), opts.maxBodySize) : undefined,
      };
      if (opts.redactPatterns.length) {
        entry.requestHeaders = redact(entry.requestHeaders, opts.redactPatterns) as Record<string, string>;
        entry.responseHeaders = redact(entry.responseHeaders, opts.redactPatterns) as Record<string, string>;
      }
      buffer.push(entry);
    });
    return originalSend.call(this, body);
  };

  return () => {
    XHRProto.open = originalOpen;
    XHRProto.send = originalSend;
    XHRProto.setRequestHeader = originalSetHeader;
  };
}

function headersToRecord(headers: HeadersInit | Headers): Record<string, string> {
  const result: Record<string, string> = {};
  if (headers instanceof Headers) { headers.forEach((v, k) => (result[k] = v)); }
  else if (Array.isArray(headers)) { headers.forEach(([k, v]) => (result[k] = v)); }
  else { Object.assign(result, headers); }
  return result;
}

function parseXHRHeaders(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  raw.split("\r\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return result;
}

function safeParseBody(body: unknown): unknown {
  if (body == null) return undefined;
  if (typeof body === "string") {
    try { return JSON.parse(body); } catch { return body; }
  }
  return String(body);
}
