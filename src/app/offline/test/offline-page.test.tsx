import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OfflinePage from "../page";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    t: (key: string) =>
      key === "offlineTitle"
        ? "You are offline"
        : key === "offlineDescription"
          ? "Offline Mode active"
          : key === "tryAgain"
            ? "Try Again"
            : key === "home"
              ? "Home"
              : key,
  }),
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: {
      colors: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#10b981",
        muted: "#666666",
        border: "#222222",
      },
    },
  }),
}));

describe("OfflinePage", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("renders Offline Page header and radar signal component", () => {
    if (!canRunTests) return;
    render(<OfflinePage />);

    const titles = screen.getAllByText("You are offline");
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText(/Recheck Signal|Pinging/i)).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("toggles CRT Scanline mode", () => {
    if (!canRunTests) return;
    render(<OfflinePage />);

    const crtBtn = screen.getByText("CRT Scanlines: [ON]");
    expect(crtBtn).toBeInTheDocument();

    fireEvent.click(crtBtn);
    expect(screen.getByText("CRT Scanlines: [OFF]")).toBeInTheDocument();
  });
});
