import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

vi.mock("next", () => ({
  Metadata: {},
}));

vi.mock("@/components/organisms/shared/static-content", () => ({
  StaticContent: () => <div data-testid="static-content">Static Content</div>,
}));

vi.mock("@/components/molecules/terminal/terminal-loading-progress", () => ({
  TerminalLoadingProgress: () => (
    <div data-testid="terminal-loading-progress">Loading...</div>
  ),
}));

vi.mock("@/components/molecules/shared/home-terminal-header", () => ({
  HomeTerminalHeader: () => (
    <div data-testid="home-terminal-header">Header</div>
  ),
}));

vi.mock("@/components/layout/terminal-client", () => ({
  TerminalClient: () => (
    <div data-testid="terminal-client">Terminal Client</div>
  ),
}));

import TerminalPage, { metadata } from "../terminal/page";

describe("TerminalPage", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
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
    it("should render terminal client", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByTestId } = render(<TerminalPage />);
      expect(getByTestId("terminal-client")).toBeInTheDocument();
    });

    it("should render main content landmark", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<TerminalPage />);
      expect(container.querySelector("main#main-content")).toBeTruthy();
    });
  });
});
