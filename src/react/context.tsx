import { createContext, useContext, useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { AgentEvent, AgentEyesConfig } from "../types";
import { AgentEyes } from "../core/agent-eyes";

const AgentEyesContext = createContext<AgentEyes | null>(null);

export interface AgentEyesProviderProps {
  children: ReactNode;
  config?: AgentEyesConfig;
}

/**
 * Wrap your app with this provider to enable agent vision.
 *
 * ```tsx
 * <AgentEyesProvider config={{ redactPatterns: ["authorization", "cookie"] }}>
 *   <App />
 * </AgentEyesProvider>
 * ```
 */
export function AgentEyesProvider({ children, config }: AgentEyesProviderProps) {
  const eyesRef = useRef<AgentEyes | null>(null);

  if (!eyesRef.current) {
    eyesRef.current = new AgentEyes({
      ...config,
      collectors: { ...config?.collectors, reactComponents: true },
    });
  }

  useEffect(() => {
    const eyes = eyesRef.current!;
    eyes.start();

    // Expose globally so agents can access via browser console/devtools
    (globalThis as Record<string, unknown>).__AGENT_EYES__ = eyes;

    return () => {
      eyes.stop();
      delete (globalThis as Record<string, unknown>).__AGENT_EYES__;
    };
  }, []);

  return (
    <AgentEyesContext.Provider value={eyesRef.current}>
      {children}
    </AgentEyesContext.Provider>
  );
}

/**
 * Access the AgentEyes instance from any component.
 */
export function useAgentEyes(): AgentEyes {
  const ctx = useContext(AgentEyesContext);
  if (!ctx) {
    throw new Error("useAgentEyes must be used within <AgentEyesProvider>");
  }
  return ctx;
}

/**
 * Subscribe to agent events reactively.
 * Returns the latest N events, updating in real-time.
 */
export function useAgentEvents(
  type?: AgentEvent["type"],
  limit = 50
): AgentEvent[] {
  const eyes = useAgentEyes();
  const [events, setEvents] = useState<AgentEvent[]>(() =>
    eyes.getEvents(type).slice(-limit)
  );

  const updateEvents = useCallback(() => {
    setEvents(eyes.getEvents(type).slice(-limit));
  }, [eyes, type, limit]);

  useEffect(() => {
    const unsub = eyes.subscribe((event) => {
      if (!type || event.type === type) {
        updateEvents();
      }
    });
    return unsub;
  }, [eyes, type, updateEvents]);

  return events;
}

/**
 * Get a full snapshot, refreshed on every new event.
 */
export function useAgentSnapshot() {
  const eyes = useAgentEyes();
  const [snapshot, setSnapshot] = useState(() => eyes.snapshot());

  useEffect(() => {
    const unsub = eyes.subscribe(() => {
      setSnapshot(eyes.snapshot());
    });
    return unsub;
  }, [eyes]);

  return snapshot;
}
