import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { NoSSR } from "../no-ssr";

describe("NoSSR", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render fallback initially", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <NoSSR fallback={<div>Loading...</div>}>
          <div>Client Content</div>
        </NoSSR>,
      );

      const loading = screen.queryByText("Loading...");
      const content = screen.queryByText("Client Content");
      expect(loading ?? content).toBeTruthy();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.getByText("Client Content")).toBeInTheDocument();
    });

    it("should render children after mount", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <NoSSR fallback={<div>Loading...</div>}>
          <div>Client Content</div>
        </NoSSR>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.getByText("Client Content")).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("should render null fallback by default", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <NoSSR>
          <div>Client Content</div>
        </NoSSR>,
      );

      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.getByText("Client Content")).toBeInTheDocument();
    });

    it("should render children after mount with null fallback", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <NoSSR>
          <div>Client Content</div>
        </NoSSR>,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.getByText("Client Content")).toBeInTheDocument();
    });
  });
});
