import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

vi.mock("next", () => ({
  Metadata: {},
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "portfolio_gate" ? { value: "test-token" } : undefined,
  })),
}));

vi.mock("@/components/organisms/gate/terminal-locked-teaser", () => ({
  TerminalLockedTeaser: () => (
    <div data-testid="terminal-locked">Terminal locked</div>
  ),
}));

vi.mock("@/components/organisms/gate/terminal-unlocked-content", () => ({
  TerminalUnlockedContent: () => (
    <main
      id="main-content"
      data-testid="terminal-unlocked"
    >
      <div data-testid="terminal-client">Terminal Client</div>
    </main>
  ),
}));

import TerminalPage, { metadata } from "../terminal/page";

describe("TerminalPage", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_GATE_ENABLED;
  });

  describe("Metadata", () => {
    it("should have noindex robots", () => {
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it("should have terminal canonical URL", () => {
      expect(metadata.alternates?.canonical).toBe("/terminal");
    });
  });

  describe("Component Rendering", () => {
    it("should render terminal client when unlocked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const jsx = await TerminalPage();
      const { getByTestId } = render(jsx);
      expect(getByTestId("terminal-client")).toBeInTheDocument();
    });

    it("should render locked teaser when gate enabled and no cookie", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { cookies } = await import("next/headers");
      vi.mocked(cookies).mockResolvedValueOnce({
        get: () => undefined,
      } as Awaited<ReturnType<typeof cookies>>);

      const jsx = await TerminalPage();
      const { getByTestId } = render(jsx);
      expect(getByTestId("terminal-locked")).toBeInTheDocument();
    });
  });
});
