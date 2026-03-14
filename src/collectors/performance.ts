import type { PerformanceEntry as PerfEntry, AgentEyesConfig } from "../types";
import type { EventBuffer } from "../core/event-buffer";

type PerfConfig = AgentEyesConfig["performance"];

/**
 * Captures web performance metrics (Core Web Vitals, memory, etc.)
 */
export function createPerformanceCollector(
  buffer: EventBuffer,
  config?: PerfConfig
): () => void {
  let observer: PerformanceObserver | null = null;
  const disableLCP = config?.disableLCP ?? false;
  const disableMemory = config?.disableMemory ?? false;

  const captureMetrics = () => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType("paint");

    const entry: PerfEntry = {
      type: "performance",
      metrics: {
        domContentLoaded: nav?.domContentLoadedEventEnd,
        loadComplete: nav?.loadEventEnd,
        firstPaint: paint.find((p) => p.name === "first-paint")?.startTime,
        firstContentfulPaint: paint.find((p) => p.name === "first-contentful-paint")?.startTime,
        memoryUsage: disableMemory ? undefined : (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize,
      },
      timestamp: Date.now(),
    };
    buffer.push(entry);
  };

  // Capture LCP via PerformanceObserver
  if (!disableLCP) {
    try {
    observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastLCP = entries[entries.length - 1];
      if (lastLCP) {
        const entry: PerfEntry = {
          type: "performance",
          metrics: { largestContentfulPaint: lastLCP.startTime },
          timestamp: Date.now(),
        };
        buffer.push(entry);
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP observer not supported
    }
  }

  // Capture initial metrics after load
  if (document.readyState === "complete") {
    captureMetrics();
  } else {
    window.addEventListener("load", captureMetrics, { once: true });
  }

  return () => {
    observer?.disconnect();
  };
}
