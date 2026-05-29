import { expect } from "vitest";

/** True when jsdom document/window are available (Vitest + Bun runner). */
export const canRunTests =
  typeof document !== "undefined" && typeof window !== "undefined";

export function ensureDocumentBody(): void {
  if (!canRunTests) {
    return;
  }

  if (!document.body) {
    const body = document.createElement("body");
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    }
  }
}

export function skipIfNoDOM(): void {
  if (!canRunTests) {
    expect(true).toBe(true);
    return;
  }
}
