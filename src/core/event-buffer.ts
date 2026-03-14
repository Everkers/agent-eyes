import type { AgentEvent, AgentEyesConfig } from "../types";

/**
 * Ring buffer that stores agent events with a configurable max size.
 * Oldest events get evicted when the buffer is full.
 */
export class EventBuffer {
  private events: AgentEvent[] = [];
  private maxSize: number;
  private filter?: (event: AgentEvent) => boolean;
  private onEvent?: (event: AgentEvent) => void;
  private listeners = new Set<(event: AgentEvent) => void>();

  constructor(config: AgentEyesConfig = {}) {
    this.maxSize = config.maxBufferSize ?? 500;
    this.filter = config.filter;
    this.onEvent = config.onEvent;
  }

  push(event: AgentEvent): void {
    if (this.filter && !this.filter(event)) return;

    this.events.push(event);
    if (this.events.length > this.maxSize) {
      this.events.shift();
    }

    this.onEvent?.(event);
    this.listeners.forEach((fn) => fn(event));
  }

  /** Get all events, optionally filtered by type */
  getAll<T extends AgentEvent["type"]>(type?: T): AgentEvent[] {
    if (!type) return [...this.events];
    return this.events.filter((e) => e.type === type);
  }

  /** Get the last N events */
  getLast(n: number): AgentEvent[] {
    return this.events.slice(-n);
  }

  /** Clear all events */
  clear(): void {
    this.events = [];
  }

  /** Subscribe to new events */
  subscribe(fn: (event: AgentEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Serialize buffer to JSON-friendly format for agent consumption */
  toJSON(): AgentEvent[] {
    return this.getAll();
  }

  get size(): number {
    return this.events.length;
  }
}
