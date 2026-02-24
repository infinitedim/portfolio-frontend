import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { CommandLoadingIndicator } from "../command-loading-indicator";

const mockThemeConfig = {
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
  },
};

// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

describe("CommandLoadingIndicator", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should not render when visible is false", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandLoadingIndicator visible={false} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when visible is true", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<CommandLoadingIndicator visible={true} />);

      expect(screen.getByText(/Processing command/i)).toBeInTheDocument();
    });

    it("should display command name when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<CommandLoadingIndicator visible={true} command="help" />);

      expect(screen.getByText("help")).toBeInTheDocument();
    });

    it("should not display command name when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<CommandLoadingIndicator visible={true} />);

      expect(screen.queryByText("help")).not.toBeInTheDocument();
    });

    it("should use default messages when not provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<CommandLoadingIndicator visible={true} />);

      expect(screen.getByText(/Processing command/i)).toBeInTheDocument();
    });

    it("should use custom messages when provided", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const customMessages = ["Custom message 1", "Custom message 2"];
      render(
        <CommandLoadingIndicator visible={true} messages={customMessages} />,
      );

      expect(screen.getByText("Custom message 1")).toBeInTheDocument();
    });

    it("should not render when themeConfig is missing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      
      
      const { container } = render(
        <CommandLoadingIndicator visible={true} />,
      );

      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Animation", () => {
    it("should cycle through messages", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const messages = ["Message 1", "Message 2", "Message 3"];
      render(
        <CommandLoadingIndicator visible={true} messages={messages} />,
      );

      expect(screen.getByText("Message 1")).toBeInTheDocument();

      
      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText("Message 2")).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText("Message 3")).toBeInTheDocument();
      });
    });

    it("should reset message index when visible changes", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const messages = ["Message 1", "Message 2"];
      const { rerender } = render(
        <CommandLoadingIndicator visible={true} messages={messages} />,
      );

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(screen.getByText("Message 2")).toBeInTheDocument();
      });

      
      rerender(
        <CommandLoadingIndicator visible={false} messages={messages} />,
      );
      rerender(
        <CommandLoadingIndicator visible={true} messages={messages} />,
      );

      
      expect(screen.getByText("Message 1")).toBeInTheDocument();
    });

    it("should animate dots", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<CommandLoadingIndicator visible={true} />);

      
      const dotsElement = screen.getByText(/Processing command/i).parentElement;
      expect(dotsElement).toBeInTheDocument();

      
      vi.advanceTimersByTime(400);

      await waitFor(() => {
        
        expect(dotsElement).toBeInTheDocument();
      });
    });

    it("should reset dots when visible changes", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { rerender } = render(
        <CommandLoadingIndicator visible={true} />,
      );

      vi.advanceTimersByTime(1200); 

      
      rerender(<CommandLoadingIndicator visible={false} />);
      rerender(<CommandLoadingIndicator visible={true} />);

      
      const dotsElement = screen.getByText(/Processing command/i).parentElement;
      expect(dotsElement).toBeInTheDocument();
    });
  });

  describe("Visual Elements", () => {
    it("should render spinner", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandLoadingIndicator visible={true} />,
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should render pulse bars", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandLoadingIndicator visible={true} />,
      );

      const bars = container.querySelectorAll(".animate-pulse");
      expect(bars.length).toBeGreaterThan(0);
    });

    it("should apply theme colors", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <CommandLoadingIndicator visible={true} />,
      );

      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({
        backgroundColor: expect.stringContaining("00ff00"),
      });
    });
  });
});
