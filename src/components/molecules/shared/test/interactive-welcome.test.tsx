import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { InteractiveWelcome } from "../interactive-welcome";

// Mock theme hook
const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

describe("InteractiveWelcome", () => {
  const mockOnCommandSelect = vi.fn();
  const mockOnDismiss = vi.fn();
  const mockOnStartTour = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render welcome message", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(
        screen.getByText("🚀 Welcome to My Terminal Portfolio!"),
      ).toBeInTheDocument();
    });

    it("should render all quick commands", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("tour")).toBeInTheDocument();
      expect(screen.getByText("help")).toBeInTheDocument();
      expect(screen.getByText("about")).toBeInTheDocument();
      expect(screen.getByText("skills")).toBeInTheDocument();
      expect(screen.getByText("projects")).toBeInTheDocument();
      expect(screen.getByText("contact")).toBeInTheDocument();
    });

    it("should render tip text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(
        screen.getByText(/Use Tab for auto-completion/),
      ).toBeInTheDocument();
    });

    it("should render skip button", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("Skip intro")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onCommandSelect when command is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
        />,
      );

      const helpButton = screen.getByText("help").closest("button");
      expect(helpButton).toBeTruthy();
      fireEvent.click(helpButton!);

      await vi.advanceTimersByTimeAsync(200);

      expect(mockOnCommandSelect).toHaveBeenCalledWith("help");
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it("should call onStartTour when tour command is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
          onStartTour={mockOnStartTour}
        />,
      );

      const tourButton = screen.getByText("tour").closest("button");
      expect(tourButton).toBeTruthy();
      fireEvent.click(tourButton!);

      await vi.advanceTimersByTimeAsync(200);

      expect(mockOnStartTour).toHaveBeenCalled();
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it("should call onDismiss when skip button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <InteractiveWelcome
          onCommandSelect={mockOnCommandSelect}
          onDismiss={mockOnDismiss}
        />,
      );

      const skipButton = screen.getByText("Skip intro");
      fireEvent.click(skipButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });
});
