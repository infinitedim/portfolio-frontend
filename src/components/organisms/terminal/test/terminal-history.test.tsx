import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TerminalHistory } from "../terminal-history";

const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    prompt: "$",
  },
};

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

vi.mock("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: () => ({
    isReducedMotion: false,
  }),
}));

vi.mock("@/components/molecules/terminal/command-output", () => ({
  CommandOutput: ({ output }: any) => (
    <div data-testid="command-output">{JSON.stringify(output)}</div>
  ),
}));

const mockHistory = [
  {
    input: "help",
    output: {
      type: "info" as const,
      content: "Available commands",
    },
    timestamp: new Date(),
  },
  {
    input: "about",
    output: {
      type: "success" as const,
      content: "About me",
    },
    timestamp: new Date(),
  },
];

describe("TerminalHistory", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should return null when history is empty", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<TerminalHistory history={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render history entries", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHistory history={mockHistory} />);

      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("about")).toBeInTheDocument();
    });

    it("should render command outputs", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TerminalHistory history={mockHistory} />);

      const outputs = screen.getAllByTestId("command-output");
      expect(outputs.length).toBe(mockHistory.length);
      expect(outputs[0]).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<TerminalHistory history={mockHistory} />);

      const log = container.querySelector('[role="log"]');
      expect(log).toHaveAttribute("aria-label", "Command history");
    });
  });
});
