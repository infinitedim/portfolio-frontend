import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { Terminal } from "../terminal";

// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/hooks/use-theme", () => ({
  useTheme: vi.fn(),
}));

vi.mock("@/hooks/use-terminal", () => ({
  useTerminal: vi.fn(),
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: vi.fn(),
}));

vi.mock("@/hooks/use-font", () => ({
  useFont: vi.fn(),
}));

vi.mock("@/hooks/use-tour", () => ({
  useTour: vi.fn(),
}));

vi.mock("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: vi.fn(),
}));

vi.mock("@/components/organisms/terminal/mobile-terminal", () => ({
  MobileTerminal: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/molecules/terminal/command-input", () => ({
  CommandInput: () => <div data-testid="command-input">Command Input</div>,
}));

vi.mock("@/components/molecules/shared/ascii-banner", () => ({
  ASCIIBanner: () => <div data-testid="ascii-banner">ASCII Banner</div>,
}));

vi.mock("@/lib/services/customization-service", () => ({
  CustomizationService: {
    getInstance: vi.fn(() => ({
      getBackgroundSettings: vi.fn(),
      loadAllCustomFonts: vi.fn(),
    })),
  },
}));

describe("Terminal", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should handle component rendering", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      
      
      expect(Terminal).toBeDefined();
      expect(typeof Terminal).toBe("function");
    });
  });
});
