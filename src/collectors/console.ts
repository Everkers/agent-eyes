import type { AgentEyesConfig, LogEntry, LogLevel } from "../types";
import type { EventBuffer } from "../core/event-buffer";

const ALL_LEVELS: LogLevel[] = ["log", "warn", "error", "debug", "info"];

/**
 * Intercepts console.* calls and pushes them into the event buffer.
 * Returns a teardown function that restores original console methods.
 */
export function createConsoleCollector(
  buffer: EventBuffer,
  config?: AgentEyesConfig["console"]
): () => void {
  const levels = config?.levels ?? ALL_LEVELS;
  const maxArgLength = config?.maxArgLength ?? 5000;
  const stackTraceAll = config?.stackTraceAll ?? false;
  const originals = new Map<LogLevel, (...args: unknown[]) => void>();

  for (const level of levels) {
    const original = console[level].bind(console);
    originals.set(level, original);

    console[level] = (...args: unknown[]) => {
      const entry: LogEntry = {
        type: "log",
        level,
        args: args.map((a) => safeSerialize(a, maxArgLength)),
        timestamp: Date.now(),
        stack: (stackTraceAll || level === "error") ? new Error().stack : undefined,
      };
      buffer.push(entry);
      original(...args);
    };
  }

  return () => {
    for (const level of levels) {
      const original = originals.get(level);
      if (original) console[level] = original as typeof console.log;
    }
  };
}

function safeSerialize(value: unknown, maxLength: number): unknown {
  try {
    if (value instanceof Error) {
      return { message: value.message, stack: value.stack, name: value.name };
    }
    const str = JSON.stringify(value);
    if (str && str.length > maxLength) {
      return str.slice(0, maxLength) + "…[truncated]";
    }
    return value;
  } catch {
    return String(value);
  }
}
