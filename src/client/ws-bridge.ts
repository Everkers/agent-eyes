import type { AgentEvent } from "../types";

/**
 * Browser-side WebSocket bridge that forwards captured events
 * to the MCP server. Handles reconnection and request/response
 * for on-demand actions like screenshots.
 */
export class WSBridge {
  private ws: WebSocket | null = null;
  private queue: AgentEvent[] = [];
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;
  private requestHandlers = new Map<string, (params?: unknown) => Promise<unknown>>();

  constructor(url = "ws://localhost:9960") {
    this.url = url;
  }

  /** Register a handler for server-initiated requests (e.g. "screenshot") */
  onRequest(action: string, handler: (params?: unknown) => Promise<unknown>): void {
    this.requestHandlers.set(action, handler);
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this._connected = true;
        if (this.queue.length > 0) {
          this.ws?.send(JSON.stringify({ type: "batch", payload: this.queue }));
          this.queue = [];
        }
      };

      this.ws.onmessage = async (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "request" && data.id && data.action) {
            const handler = this.requestHandlers.get(data.action);
            if (handler) {
              try {
                const result = await handler(data.params);
                this.ws?.send(JSON.stringify({ type: "response", id: data.id, result }));
              } catch (err) {
                this.ws?.send(JSON.stringify({
                  type: "response",
                  id: data.id,
                  error: err instanceof Error ? err.message : String(err),
                }));
              }
            } else {
              this.ws?.send(JSON.stringify({
                type: "response",
                id: data.id,
                error: `Unknown action: ${data.action}`,
              }));
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this._connected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this._connected = false;
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  send(event: AgentEvent): void {
    if (this._connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "event", payload: event }));
    } else {
      this.queue.push(event);
      if (this.queue.length > 200) this.queue.shift();
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this._connected = false;
  }

  get connected(): boolean {
    return this._connected;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}
