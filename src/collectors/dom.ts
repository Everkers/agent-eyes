import type { AgentEyesConfig, DOMSnapshotEntry } from "../types";
import type { EventBuffer } from "../core/event-buffer";

type DOMConfig = AgentEyesConfig["dom"];

/**
 * Captures simplified DOM snapshots on demand and on mutations.
 */
export function createDOMCollector(
  buffer: EventBuffer,
  config?: DOMConfig
): () => void {
  const maxDepth = config?.maxDepth ?? 8;
  const debounceMs = config?.debounceMs ?? 1000;
  const disableAuto = config?.disableAutoSnapshot ?? false;
  const extraAttrs = config?.extraAttributes ?? [];

  let observer: MutationObserver | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const takeSnapshot = () => {
    const entry: DOMSnapshotEntry = {
      type: "dom-snapshot",
      html: simplifyDOM(document.documentElement, 0, maxDepth, extraAttrs),
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timestamp: Date.now(),
    };
    buffer.push(entry);
  };

  if (!disableAuto) {
    observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(takeSnapshot, debounceMs);
    });
    observer.observe(document.body, {
      childList: true, subtree: true,
      attributes: false, characterData: false,
    });
  }

  takeSnapshot();

  return () => {
    observer?.disconnect();
    if (debounceTimer) clearTimeout(debounceTimer);
  };
}

function simplifyDOM(el: Element, depth: number, maxDepth: number, extraAttrs: string[]): string {
  if (depth > maxDepth) return "...";
  const tag = el.tagName.toLowerCase();
  if (["script", "style", "svg", "noscript"].includes(tag)) return "";

  const importantAttrs = [
    "id", "class", "role", "aria-label", "data-testid",
    "href", "src", "type", "name", "placeholder", "value",
    ...extraAttrs,
  ];
  const attrs: string[] = [];
  for (const attr of importantAttrs) {
    const val = el.getAttribute(attr);
    if (val) attrs.push(`${attr}="${truncate(val, 80)}"`);
  }

  const attrStr = attrs.length ? " " + attrs.join(" ") : "";
  const children = Array.from(el.children)
    .map((child) => simplifyDOM(child, depth + 1, maxDepth, extraAttrs))
    .filter(Boolean).join("\n");
  const text = getDirectText(el);
  const textStr = text ? truncate(text, 120) : "";

  if (!children && !textStr) return `<${tag}${attrStr} />`;
  const indent = "  ".repeat(depth);
  const content = [textStr, children].filter(Boolean).join("\n");
  return `${indent}<${tag}${attrStr}>\n${content}\n${indent}</${tag}>`;
}

function getDirectText(el: Element): string {
  return Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent?.trim()).filter(Boolean).join(" ");
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
