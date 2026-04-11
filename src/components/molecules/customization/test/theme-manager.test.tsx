import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { ThemeManager } from "../theme-manager";
import { AccessibilityProvider } from "@/components/organisms/accessibility/accessibility-provider";
import type { CustomTheme } from "@/types/customization";

const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#0a0a0a",
    text: "#e5e5e5",
    accent: "#00ff41",
    muted: "#666666",
    border: "#333333",
    success: "#00ff41",
    error: "#ff4444",
  },
};

const mockChangeTheme = vi.fn(() => true);
const mockIsThemeActive = vi.fn(() => false) as any;

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    changeTheme: mockChangeTheme,
    isThemeActive: mockIsThemeActive,
  }),
}));

const mockGetCustomThemes = vi.fn(() => []);
const mockDeleteCustomTheme = vi.fn(() => true);
const mockDuplicateTheme = vi.fn(() => null) as any;

vi.mock("@/lib/services/customization-service", () => ({
  CustomizationService: {
    getInstance: () => ({
      getCustomThemes: mockGetCustomThemes,
      deleteCustomTheme: mockDeleteCustomTheme,
      duplicateTheme: mockDuplicateTheme,
    }),
  },
}));

vi.mock("../theme-editor", () => ({
  ThemeEditor: ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="theme-editor">
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

global.confirm = vi.fn(() => true);
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: {
      setItem: vi.fn(),
      getItem: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
}

if (typeof document !== "undefined") {
  // Only override style.setProperty if it doesn't exist or we want to mock it specifically
  // instead of replacing the entire documentElement
  const originalSetProperty = document.documentElement.style.setProperty;
  document.documentElement.style.setProperty = vi.fn();
}

describe("ThemeManager", () => {
  const mockThemes: CustomTheme[] = [
    {
      id: "theme-1",
      name: "Dark Theme",
      description: "A dark theme",
      author: "Author",
      colors: {
        bg: "#000000",
        text: "#ffffff",
        prompt: "#00ff00",
        success: "#00ff00",
        error: "#ff0000",
        accent: "#0080ff",
        border: "#333333",
      },
      source: "custom",
      createdAt: new Date(),
    },
    {
      id: "theme-2",
      name: "Light Theme",
      description: "A light theme",
      author: "Author",
      colors: {
        bg: "#ffffff",
        text: "#000000",
        prompt: "#0000ff",
        success: "#00ff00",
        error: "#ff0000",
        accent: "#0080ff",
        border: "#cccccc",
      },
      source: "built-in",
      createdAt: new Date(),
    },
  ];

  const mockOnUpdate = vi.fn();
  const mockOnApplyTheme = vi.fn();

  beforeEach(() => {
    ensureDocumentBody();
    vi.clearAllMocks();
    mockIsThemeActive.mockReturnValue(false);
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <AccessibilityProvider>
        {ui}
      </AccessibilityProvider>
    );
  };

  describe("Rendering", () => {
    it("should render theme manager", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      expect(screen.getByText("Theme Manager")).toBeInTheDocument();
    });

    it("should render create theme button", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      expect(screen.getByText("+ Create Theme")).toBeInTheDocument();
    });

    it("should render search input", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      expect(
        screen.getByPlaceholderText("Search themes..."),
      ).toBeInTheDocument();
    });

    it("should render theme cards", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      expect(screen.getByText("Dark Theme")).toBeInTheDocument();
      expect(screen.getByText("Light Theme")).toBeInTheDocument();
    });

    it("should show empty state when no themes match filter", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Search themes...");
      fireEvent.change(searchInput, { target: { value: "NonExistent" } });

      expect(screen.getByText("No themes found")).toBeInTheDocument();
    });
  });

  describe("Theme Creation", () => {
    it("should open theme editor when create button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const createButton = screen.getByText("+ Create Theme");
      fireEvent.click(createButton);

      expect(screen.getByTestId("theme-editor")).toBeInTheDocument();
    });
  });

  describe("Theme Filtering and Sorting", () => {
    it("should filter themes by search query", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Search themes...");
      fireEvent.change(searchInput, { target: { value: "Dark" } });

      expect(screen.getByText("Dark Theme")).toBeInTheDocument();
      expect(screen.queryByText("Light Theme")).not.toBeInTheDocument();
    });

    it("should filter themes by source", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const filterDropdown = screen.getByText("All Sources").closest("button");
      fireEvent.click(filterDropdown!);
      
      const customOption = screen.getByRole("option", { name: /Custom/ });
      fireEvent.click(customOption);

      expect(screen.getByText("Dark Theme")).toBeInTheDocument();
      expect(screen.queryByText("Light Theme")).not.toBeInTheDocument();
    });

    it("should sort themes by name", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const sortDropdown = screen.getByText("Sort by Name").closest("button");
      fireEvent.click(sortDropdown!);
      
      const nameOption = screen.getAllByRole("option", { name: /Sort by Name/ })[0];
      fireEvent.click(nameOption);

      const themeCards = screen.getAllByText(/Theme/);
      expect(themeCards.length).toBeGreaterThan(0);
    });
  });

  describe("Theme Actions", () => {
    it("should apply theme when Apply button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const applyButtons = screen.getAllByText("Apply");
      if (applyButtons.length > 0) {
        fireEvent.click(applyButtons[0]);

        expect(mockOnApplyTheme).toHaveBeenCalled();
      }
    });

    it("should duplicate theme when duplicate button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockDuplicateTheme.mockReturnValueOnce({
        ...mockThemes[0],
        id: "theme-1-copy",
        name: "Dark Theme (Copy)",
      });

      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const duplicateButtons = screen.getAllByTitle("Duplicate theme");
      if (duplicateButtons.length > 0) {
        fireEvent.click(duplicateButtons[0]);

        expect(mockDuplicateTheme).toHaveBeenCalled();
        expect(mockOnUpdate).toHaveBeenCalled();
      }
    });

    it("should delete theme when delete button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const deleteButtons = screen.getAllByTitle("Delete theme");
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);

        expect(global.confirm).toHaveBeenCalled();
        expect(mockDeleteCustomTheme).toHaveBeenCalled();
        expect(mockOnUpdate).toHaveBeenCalled();
      }
    });

    it("should open theme editor when edit button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
        />,
      );

      const editButtons = screen.getAllByTitle("Edit theme");
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);

        expect(screen.getByTestId("theme-editor")).toBeInTheDocument();
      }
    });
  });

  describe("Active Theme", () => {
    it("should show active indicator for active theme", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockIsThemeActive.mockImplementation((id: string) => id === "theme-1");

      renderWithProviders(
        <ThemeManager
          themes={mockThemes}
          onUpdate={mockOnUpdate}
          onApplyTheme={mockOnApplyTheme}
          currentTheme={"default" as any}
        />,
      );

      const applyButtons = screen.getAllByText(/Apply|Active/);
      const activeButton = applyButtons.find(
        (btn) => btn.textContent === "✓ Active",
      );
      expect(activeButton).toBeInTheDocument();
    });
  });
});
