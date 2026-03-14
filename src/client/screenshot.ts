import html2canvas from "html2canvas-pro";

/**
 * Captures a screenshot of the current page using html2canvas-pro.
 * This fork supports modern CSS color functions (oklab, oklch, lab, lch, etc.)
 * that the original html2canvas cannot parse.
 * Returns a base64-encoded PNG data URL.
 */
export async function captureScreenshot(options?: {
  selector?: string;
  quality?: number;
  maxWidth?: number;
}): Promise<string> {
  const { selector, quality = 0.8, maxWidth = 1280 } = options ?? {};

  const target = selector
    ? document.querySelector<HTMLElement>(selector)
    : document.body;

  if (!target) throw new Error(`Element not found: ${selector}`);

  const canvas = await html2canvas(target, {
    useCORS: true,
    allowTaint: false,
    scale: Math.min(1, maxWidth / window.innerWidth),
    logging: false,
    backgroundColor:
      getComputedStyle(document.documentElement).backgroundColor || "#ffffff",
  });

  return canvas.toDataURL("image/png", quality);
}
