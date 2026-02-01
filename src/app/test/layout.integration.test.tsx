/**
 * Root layout integration tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout, { metadata, viewport } from "../layout";

vi.mock("../components/organisms/pwa/pwa-registration", () => ({
  default: () => <div data-testid="pwa-registration">PWA</div>,
}));
vi.mock("@/lib/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}));
vi.mock("../components/organisms/accessibility/accessibility-provider", () => ({
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="accessibility">{children}</div>,
}));
vi.mock("../components/molecules/accessibility/screen-reader-announcer", () => ({
  ScreenReaderAnnouncer: () => <div data-testid="screen-reader">Announcer</div>,
}));
vi.mock("../components/monitoring/web-vitals-monitor", () => ({
  WebVitalsMonitor: () => null,
}));

describe("RootLayout integration", () => {
  it("should export metadata with title and description", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toContain("portfolio");
  });

  it("should export viewport config", () => {
    expect(viewport).toBeDefined();
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });

  it("should render children within providers", () => {
    render(
      <RootLayout>
        <div data-testid="child">Child content</div>
      </RootLayout>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });
});
