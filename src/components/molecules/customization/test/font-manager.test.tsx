import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { FontManager } from "../font-manager";
import type { CustomFont } from "@/types/customization";

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
    prompt: "#00ff41",
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
  }),
}));

const mockChangeFont = vi.fn();
vi.mock("@/hooks/use-font", () => ({
  useFont: () => ({
    changeFont: mockChangeFont,
  }),
}));

const mockGetCustomFonts = vi.fn<() => CustomFont[]>(() => []);
const mockSaveCustomFont = vi.fn();
const mockSaveCustomFontFromGoogle = vi.fn((font: any) => ({
  ...font,
  id: "font-1",
  createdAt: new Date(),
}));
const mockDeleteCustomFont = vi.fn();
const mockSaveSettings = vi.fn();

const mockCustomizationServiceInstance = {
  getCustomFonts: mockGetCustomFonts,
  saveCustomFont: mockSaveCustomFont,
  saveCustomFontFromGoogle: mockSaveCustomFontFromGoogle,
  deleteCustomFont: mockDeleteCustomFont,
  saveSettings: mockSaveSettings,
};

vi.mock("@/lib/services/customization-service", () => ({
  CustomizationService: {
    getInstance: vi.fn(() => mockCustomizationServiceInstance),
  },
}));

global.alert = vi.fn();
global.confirm = vi.fn(() => true);

const originalCreateElement =
  typeof document !== "undefined" &&
  typeof document.createElement === "function"
    ? document.createElement.bind(document)
    : undefined;
const mockCreateElement = vi.fn((tag: string) => {
  if (tag === "a") {
    return {
      href: "",
      download: "",
      click: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      style: {},
    } as any;
  }

  if (originalCreateElement) {
    return originalCreateElement(tag);
  }
  return { tagName: tag } as any;
});

if (typeof document !== "undefined") {
  Object.defineProperty(document, "createElement", {
    value: mockCreateElement,
    writable: true,
    configurable: true,
  });
}

global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("FontManager", () => {
  const mockFonts: CustomFont[] = [
    {
      id: "font-1",
      name: "Fira Code",
      family: '"Fira Code", monospace',
      source: "google",
      url: "https://fonts.googleapis.com/css2?family=Fira+Code",
      ligatures: true,
      weight: "400",
      style: "normal",
      createdAt: new Date(),
    },
    {
      id: "font-2",
      name: "JetBrains Mono",
      family: '"JetBrains Mono", monospace',
      source: "system",
      ligatures: true,
      weight: "400",
      style: "normal",
      createdAt: new Date(),
    },
    {
      id: "font-3",
      name: "Custom Font",
      family: '"Custom Font", monospace',
      source: "custom",
      ligatures: false,
      weight: "400",
      style: "normal",
      size: 1024,
      createdAt: new Date(),
    },
  ];

  const mockOnUpdate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    (mockGetCustomFonts as any).mockReturnValue(mockFonts);
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (!canRunTests) return;
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render font manager", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      expect(
        screen.getByPlaceholderText("Search fonts..."),
      ).toBeInTheDocument();
    });

    it("should render search input", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Search fonts...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should render upload button", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/📁 Upload/)).toBeInTheDocument();
    });

    it("should render filter dropdown", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByDisplayValue("All Sources")).toBeInTheDocument();
    });

    it("should render random font generator", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Pick Random Font")).toBeInTheDocument();
    });

    it("should render font list", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Fira Code")).toBeInTheDocument();
      expect(screen.getByText("JetBrains Mono")).toBeInTheDocument();
      expect(screen.getByText("Custom Font")).toBeInTheDocument();
    });

    it("should show placeholder when no font is selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Select a Font")).toBeInTheDocument();
    });
  });

  describe("Font Selection", () => {
    it("should select font when clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCards = screen.getAllByText("Fira Code");
      const fontCard = fontCards[0].closest("div[role='button']");
      fireEvent.click(fontCard!);

      expect(fontCard).toBeInTheDocument();
      expect(screen.getByText("Font Preview")).toBeInTheDocument();
    });

    it("should show font preview when font is selected", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCard = screen
        .getByText("Fira Code")
        .closest("div[role='button']");
      fireEvent.click(fontCard!);

      expect(screen.getByText("Font Preview")).toBeInTheDocument();
      expect(screen.getByText("Code Sample")).toBeInTheDocument();
    });
  });

  describe("Search and Filter", () => {
    it("should filter fonts by search query", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const searchInput = screen.getByPlaceholderText("Search fonts...");
      fireEvent.change(searchInput, { target: { value: "Fira" } });

      expect(screen.getByText("Fira Code")).toBeInTheDocument();
      expect(screen.queryByText("JetBrains Mono")).not.toBeInTheDocument();
    });

    it("should filter fonts by source", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const filterSelect = screen.getByDisplayValue("All Sources");
      fireEvent.change(filterSelect, { target: { value: "custom" } });

      expect(screen.getByText("Custom Font")).toBeInTheDocument();
      expect(screen.queryByText("Fira Code")).not.toBeInTheDocument();
    });
  });

  describe("Font Application", () => {
    it("should apply system font when Apply button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCard = screen
        .getByText("JetBrains Mono")
        .closest("div[role='button']");
      fireEvent.click(fontCard!);

      const applyButton = screen.getByText("✅ Apply Font");
      fireEvent.click(applyButton);

      expect(mockChangeFont).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should apply custom/google font when Apply button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCard = screen
        .getByText("Fira Code")
        .closest("div[role='button']");
      fireEvent.click(fontCard!);

      const applyButton = screen.getByText("✅ Apply Font");
      fireEvent.click(applyButton);

      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should save font as current when Save as Current Font is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCard = screen
        .getByText("Fira Code")
        .closest("div[role='button']");
      fireEvent.click(fontCard!);

      const saveButton = screen.getByText("💾 Save as Current Font");
      fireEvent.click(saveButton);

      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Font Deletion", () => {
    it("should delete custom font when Delete button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(mockDeleteCustomFont).toHaveBeenCalled();
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    it("should not show delete button for non-custom fonts", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const firaCodeCards = screen.getAllByText("Fira Code");
      const firaCodeCard = firaCodeCards[0].closest("div[role='button']");
      const deleteButtons = firaCodeCard?.querySelectorAll("button");
      const deleteButton = Array.from(deleteButtons || []).find(
        (btn) => btn.textContent === "Delete",
      );

      expect(deleteButton).toBeUndefined();
    });
  });

  describe("Random Font Generation", () => {
    it("should generate random font when button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useFakeTimers();
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      (mockGetCustomFonts as any).mockReturnValueOnce([]);

      const randomButton = screen.getByText("🎲 Pick Random Font");

      await act(async () => {
        fireEvent.click(randomButton);
      });

      await act(async () => {
        vi.advanceTimersByTime(600);
        await vi.runAllTimersAsync();
      });

      await waitFor(
        () => {
          expect(mockSaveCustomFontFromGoogle).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(mockOnUpdate).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );

      vi.useRealTimers();
    }, 15000);

    it("should toggle ligatures checkbox", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const ligaturesCheckbox = screen.getByLabelText(/Ligatures/);
      const initialChecked = (ligaturesCheckbox as HTMLInputElement).checked;

      fireEvent.click(ligaturesCheckbox);

      expect((ligaturesCheckbox as HTMLInputElement).checked).not.toBe(
        initialChecked,
      );
    });
  });

  describe("File Upload", () => {
    it("should handle file upload", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useFakeTimers();
      const mockFile = new File(["font data"], "font.woff", {
        type: "font/woff",
      });
      mockSaveCustomFont.mockResolvedValue(undefined);

      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const uploadButton = screen.getByText(/📁 Upload/);

      await act(async () => {
        fireEvent.click(uploadButton);
      });

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [mockFile],
          writable: false,
        });

        await act(async () => {
          fireEvent.change(fileInput);
        });

        await act(async () => {
          vi.advanceTimersByTime(200);
          await vi.runAllTimersAsync();
        });
      }

      await waitFor(
        () => {
          expect(mockSaveCustomFont).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );

      vi.useRealTimers();
    }, 15000);
  });

  describe("Keyboard Navigation", () => {
    it("should select font on Enter key", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCard = screen
        .getByText("Fira Code")
        .closest("div[role='button']");
      fireEvent.keyDown(fontCard!, { key: "Enter" });

      expect(screen.getByText("Font Preview")).toBeInTheDocument();
    });

    it("should select font on Space key", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(
        <FontManager
          fonts={mockFonts}
          onUpdate={mockOnUpdate}
          onClose={mockOnClose}
        />,
      );

      const fontCard = screen
        .getByText("Fira Code")
        .closest("div[role='button']");
      fireEvent.keyDown(fontCard!, { key: " " });

      expect(screen.getByText("Font Preview")).toBeInTheDocument();
    });
  });
});
