import type { ReactComponentEntry, AgentEyesConfig } from "../types";
import type { EventBuffer } from "../core/event-buffer";

type ReactConfig = AgentEyesConfig["reactComponents"];

/**
 * Tracks React component renders by hooking into React DevTools' global hook.
 */
export function createReactComponentCollector(
  buffer: EventBuffer,
  config?: ReactConfig
): () => void {
  const renderCounts = new Map<string, number>();
  const includeNames = config?.includeNames;
  const excludeNames = config?.excludeNames;
  const captureProps = config?.captureProps ?? true;

  const hook = (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ as
    | { onCommitFiberRoot?: Function; _original_onCommitFiberRoot?: Function }
    | undefined;

  if (!hook) {
    // If devtools hook isn't available, install a minimal one
    // so React will call us when it mounts
    const minimalHook = {
      supportsFiber: true,
      inject: () => {},
      onCommitFiberRoot: (_rendererID: number, root: FiberRoot) => {
        walkFiber(root.current, buffer, renderCounts, { includeNames, excludeNames, captureProps });
      },
      onCommitFiberUnmount: () => {},
    };
    (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__ = minimalHook;

    return () => {
      delete (globalThis as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    };
  }

  // Wrap existing hook
  const original = hook.onCommitFiberRoot;
  hook.onCommitFiberRoot = (rendererID: number, root: FiberRoot, ...rest: unknown[]) => {
    walkFiber(root.current, buffer, renderCounts, { includeNames, excludeNames, captureProps });
    if (typeof original === "function") {
      original.call(hook, rendererID, root, ...rest);
    }
  };

  return () => {
    if (original) {
      hook.onCommitFiberRoot = original;
    }
  };
}

interface FiberNode {
  type: { name?: string; displayName?: string } | string | null;
  memoizedProps?: Record<string, unknown>;
  memoizedState?: unknown;
  child?: FiberNode | null;
  sibling?: FiberNode | null;
}

interface FiberRoot {
  current: FiberNode;
}

function walkFiber(
  fiber: FiberNode | null | undefined,
  buffer: EventBuffer,
  renderCounts: Map<string, number>,
  opts: { includeNames?: (string | RegExp)[]; excludeNames?: (string | RegExp)[]; captureProps: boolean }
): void {
  if (!fiber) return;

  const name = getFiberName(fiber);
  if (name && !name.startsWith("__")) {
    const shouldInclude = !opts.includeNames || opts.includeNames.some((p) =>
      typeof p === "string" ? name === p : p.test(name)
    );
    const shouldExclude = opts.excludeNames?.some((p) =>
      typeof p === "string" ? name === p : p.test(name)
    );

    if (shouldInclude && !shouldExclude) {
      const count = (renderCounts.get(name) ?? 0) + 1;
      renderCounts.set(name, count);

      const entry: ReactComponentEntry = {
        type: "react-component",
        name,
        props: opts.captureProps ? safeProps(fiber.memoizedProps) : {},
        renderCount: count,
        timestamp: Date.now(),
      };
      buffer.push(entry);
    }
  }

  walkFiber(fiber.child, buffer, renderCounts, opts);
  walkFiber(fiber.sibling, buffer, renderCounts, opts);
}

function getFiberName(fiber: FiberNode): string | null {
  if (!fiber.type) return null;
  if (typeof fiber.type === "string") return fiber.type;
  return fiber.type.displayName ?? fiber.type.name ?? null;
}

function safeProps(props?: Record<string, unknown>): Record<string, unknown> {
  if (!props) return {};
  try {
    const safe: Record<string, unknown> = {};
    let keys: string[];
    try {
      keys = Object.keys(props);
    } catch {
      return {};
    }
    for (const key of keys) {
      if (key === "children") continue;
      // Skip known Next.js proxy prop names that trigger warnings when enumerated
      if (key === "params" || key === "searchParams") {
        safe[key] = "[Next.js dynamic API]";
        continue;
      }
      try {
        const value = props[key];
        if (value == null) {
          safe[key] = value;
        } else if (typeof value === "function") {
          safe[key] = "[function]";
        } else if (typeof value === "object") {
          // Test if the object can be safely serialized without triggering proxy traps
          try {
            const str = JSON.stringify(value, null, 0);
            if (str !== undefined) {
              safe[key] = value;
            } else {
              safe[key] = "[unserializable]";
            }
          } catch {
            safe[key] = "[unserializable]";
          }
        } else {
          safe[key] = value;
        }
      } catch {
        // Skip props that can't be safely accessed
      }
    }
    return safe;
  } catch {
    return {};
  }
}
