import type { ErrorEntry } from "../types";
import type { EventBuffer } from "../core/event-buffer";

/**
 * Captures unhandled errors and unhandled promise rejections.
 */
export function createErrorCollector(buffer: EventBuffer): () => void {
  const onError = (event: ErrorEvent) => {
    const entry: ErrorEntry = {
      type: "error",
      message: event.message,
      stack: event.error?.stack,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now(),
    };
    buffer.push(entry);
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const entry: ErrorEntry = {
      type: "error",
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      source: "unhandledrejection",
      timestamp: Date.now(),
    };
    buffer.push(entry);
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
