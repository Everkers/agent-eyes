/**
 * Redacts sensitive values from objects based on key patterns.
 * Useful for stripping auth tokens, cookies, etc. before exposing to agents.
 */
export function redact(
  obj: unknown,
  patterns: (string | RegExp)[]
): unknown {
  if (!patterns.length || obj == null) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, patterns));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const shouldRedact = patterns.some((p) =>
      typeof p === "string"
        ? key.toLowerCase().includes(p.toLowerCase())
        : p.test(key)
    );
    result[key] = shouldRedact ? "[REDACTED]" : redact(value, patterns);
  }
  return result;
}
