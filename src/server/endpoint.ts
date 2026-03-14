import type { AgentEyes } from "../core/agent-eyes";

/**
 * Creates a message handler for window.postMessage-based communication.
 * Agents running in browser extensions or iframes can query the app state.
 */
export function createPostMessageEndpoint(eyes: AgentEyes): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data?.type !== "agent-eyes-query") return;

    const { action, params } = event.data;
    let response: unknown;

    switch (action) {
      case "snapshot":
        response = eyes.snapshot();
        break;
      case "events":
        response = eyes.getEvents(params?.type);
        break;
      case "recent":
        response = eyes.getRecent(params?.count);
        break;
      case "clear":
        eyes.clear();
        response = { ok: true };
        break;
      default:
        response = { error: `Unknown action: ${action}` };
    }

    event.source?.postMessage(
      { type: "agent-eyes-response", action, data: response },
      { targetOrigin: event.origin }
    );
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

/**
 * Creates a WebSocket server endpoint for remote agent access.
 * Use this in a Next.js API route or standalone server.
 *
 * Example Next.js API route:
 * ```ts
 * // pages/api/agent-eyes.ts
 * import { createWSHandler } from 'agent-eyes/server';
 * export default createWSHandler(agentEyesInstance);
 * ```
 */
export function serializeForTransport(eyes: AgentEyes): string {
  return eyes.toJSON();
}
