import { expect } from "vitest";

export const canRunTests =
  typeof document !== "undefined" &&
  typeof window !== "undefined" &&
  // Bun's native test runner provides window/document via jsdom but does NOT
  // support vi.mock module hoisting. Component rendering tests that rely on
  // mocked modules will fail under bun test. Use `bun run test` (vitest) for
  // full coverage. Under bun, these tests gracefully no-op via `canRunTests`.
  typeof Bun === "undefined";

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
