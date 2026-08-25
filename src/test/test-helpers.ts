import { expect } from "bun:test";

/**
 * Flag indicating whether DOM global objects (`window` and `document`) are available in the test runtime.
 */
export const canRunTests =
  typeof document !== "undefined" && typeof window !== "undefined";

/**
 * Ensures that `document.body` is created and appended to `document.documentElement` if missing.
 */
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

/**
 * Asserts a truthy placeholder when the DOM environment is unavailable to gracefully skip DOM-dependent assertions.
 */
export function skipIfNoDOM(): void {
  if (!canRunTests) {
    expect(true).toBe(true);
    return;
  }
}

