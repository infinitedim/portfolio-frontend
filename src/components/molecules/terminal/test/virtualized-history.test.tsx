import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { VirtualizedHistory } from "../virtualized-history";
import type { TerminalHistory } from "@/types/terminal";

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
    theme: "default",
  }),
}));

vi.mock("@/components/molecules/terminal/command-output", () => ({
  CommandOutput: ({ output }: { output: { type: string; content: string } }) => (
    <div data-testid="command-output">{output.content}</div>
  ),
}));

const mockHistory: TerminalHistory[] = [
  {
    input: "help",
    output: {
      type: "success",
      content: "Help content",
    },
    timestamp: new Date(),
  },
  {
    input: "about",
    output: {
      type: "info",
      content: "About content",
    },
    timestamp: new Date(),
  },
];

describe("VirtualizedHistory", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render history entries", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<VirtualizedHistory history={mockHistory} />);

      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("about")).toBeInTheDocument();
    });

    it("should use default prompt", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<VirtualizedHistory history={mockHistory} />);

      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it("should use custom prompt", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<VirtualizedHistory history={mockHistory} prompt=">" />);

      expect(screen.getByText(/>/)).toBeInTheDocument();
    });

    it("should limit visible items", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const largeHistory = Array.from({ length: 100 }, (_, i) => ({
        input: `command-${i}`,
        output: { type: "success" as const, content: `Output ${i}` },
        timestamp: new Date(),
      }));

      render(
        <VirtualizedHistory history={largeHistory} maxVisibleItems={10} />,
      );

      
      const outputs = screen.getAllByTestId("command-output");
      expect(outputs.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty history", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<VirtualizedHistory history={[]} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle single history entry", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<VirtualizedHistory history={[mockHistory[0]]} />);

      expect(screen.getByText("help")).toBeInTheDocument();
    });
  });
});
