export interface JsonParseResult<T> {
  data: T;
  engineUsed: "bun-json" | "native-json";
}

interface BunJsonGlobal {
  parse?(text: string): unknown;
}

/**
 * Parses JSON / JSONL strings using Bun.JSON C++ parser when available,
 * with graceful fallback to standard JSON.parse for Node.js / Vercel.
 */
export function safeParseJson<T = unknown>(jsonText: string): JsonParseResult<T> {
  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { JSON?: BunJsonGlobal }
    | undefined;

  // Try native Bun.JSON C++ parser
  if (bunGlobal && typeof bunGlobal.JSON?.parse === "function") {
    try {
      const parsed = bunGlobal.JSON.parse(jsonText) as T;
      return {
        data: parsed,
        engineUsed: "bun-json",
      };
    } catch {
      // Fall through to standard JSON.parse on error
    }
  }

  // Standard JSON.parse fallback
  const parsed = JSON.parse(jsonText) as T;
  return {
    data: parsed,
    engineUsed: "native-json",
  };
}

/**
 * Parses JSON Lines (JSONL) strings into an array of objects.
 */
export function parseJsonLines<T = unknown>(jsonLinesText: string): JsonParseResult<T[]> {
  const lines = jsonLinesText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: T[] = [];
  let engineUsed: "bun-json" | "native-json" = "native-json";

  for (const line of lines) {
    const res = safeParseJson<T>(line);
    results.push(res.data);
    if (res.engineUsed === "bun-json") {
      engineUsed = "bun-json";
    }
  }

  return {
    data: results,
    engineUsed,
  };
}
