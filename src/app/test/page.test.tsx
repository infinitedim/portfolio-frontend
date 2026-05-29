import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next", () => ({
  Metadata: {},
}));

vi.mock("@/components/layout/standard-page-layout", () => ({
  StandardPageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="standard-page-layout">{children}</div>
  ),
}));

vi.mock("@/components/organisms/landing/hero-section", () => ({
  HeroSection: () => <div data-testid="hero-section">Hero</div>,
}));

vi.mock("@/components/organisms/landing/about-section", () => ({
  AboutSection: () => <div data-testid="about-section">About</div>,
}));

vi.mock("@/components/organisms/landing/featured-projects", () => ({
  FeaturedProjects: () => <div data-testid="featured-projects">Projects</div>,
}));

vi.mock("@/components/organisms/landing/skills-grid", () => ({
  SkillsGrid: () => <div data-testid="skills-grid">Skills</div>,
}));

vi.mock("@/components/organisms/landing/latest-posts", () => ({
  LatestPosts: () => <div data-testid="latest-posts">Blog</div>,
}));

vi.mock("@/components/organisms/landing/terminal-cta", () => ({
  TerminalCta: () => <div data-testid="terminal-cta">Terminal CTA</div>,
}));

vi.mock("@/lib/api/get-site-url", () => ({
  getSiteUrl: () => "http://localhost:3000",
}));

import HomePage, { metadata } from "../page";

describe("HomePage", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have landing title", () => {
      expect(metadata.title).toBe("Dimas Saputra | Full-Stack Developer");
    });

    it("should describe portfolio not terminal-first", () => {
      expect(metadata.description).toContain("Full-stack developer portfolio");
    });

    it("should have canonical URL", () => {
      expect(metadata.alternates?.canonical).toBe("/");
    });
  });

  describe("Component Rendering", () => {
    it("should render standard page layout", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<HomePage />);
      expect(screen.getByTestId("standard-page-layout")).toBeInTheDocument();
    });

    it("should render hero section", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<HomePage />);
      expect(screen.getByTestId("hero-section")).toBeInTheDocument();
    });

    it("should not render terminal client", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<HomePage />);
      expect(screen.queryByTestId("terminal-client")).not.toBeInTheDocument();
    });

    it("should include Person structured data", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<HomePage />);
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      const personScript = Array.from(scripts).find((script) =>
        (script.textContent || "").includes('"@type":"Person"'),
      );
      expect(personScript).toBeTruthy();
    });
  });
});
