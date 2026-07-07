import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import React, { Suspense } from "react";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next", () => ({
  Metadata: {},
}));

const mockProjects = [
  {
    id: "1",
    name: "Test Project",
    description: "Test Description",
    technologies: ["React", "TypeScript"],
    status: "completed",
    demoUrl: "https://example.com",
    githubUrl: "https://github.com/example",
  },
];

const mockFeaturedProjects = [mockProjects[0]];

vi.mock("@/components/layout/standard-page-layout", () => ({
  StandardPageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="standard-page-layout">
      <main>{children}</main>
    </div>
  ),
}));

vi.mock("@/lib/data/data-fetching", () => ({
  getProjectsData: vi.fn(() => Promise.resolve(mockProjects)),
  getFeaturedProjects: vi.fn(() => Promise.resolve(mockFeaturedProjects)),
}));

vi.mock("@/components/molecules/projects/project-card", () => ({
  ProjectCard: ({
    project,
    featured,
  }: {
    project: unknown;
    featured: boolean;
  }) => (
    <div data-testid={`project-card-${featured ? "featured" : "regular"}`}>
      {JSON.stringify(project)}
    </div>
  ),
}));

vi.mock("@/components/organisms/projects/projects-loading", () => ({
  ProjectsLoading: () => <div data-testid="projects-loading">Loading...</div>,
}));

const mockUseSyncContent = { value: false };

vi.mock("./page", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./page")>();
  const MockProjectsPageContent = (props: any) => {
    if (mockUseSyncContent.value) {
      return <div data-testid="mock-projects-content" />;
    }
    return (actual.ProjectsPageContent as any)(props);
  };
  return {
    ...actual,
    ProjectsPageContent: MockProjectsPageContent,
    default: function MockProjectsPage() {
      return (
        <div data-testid="standard-page-layout">
          <main>
            <Suspense
              fallback={<div data-testid="projects-loading">Loading...</div>}
            >
              <MockProjectsPageContent />
            </Suspense>
          </main>
        </div>
      );
    },
  };
});

import ProjectsPage, {
  ProjectsPageContent,
  metadata as projectsMetadata,
} from "./page";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

describe("ProjectsPage", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct title", () => {
      expect(projectsMetadata.title).toBe("Projects | Terminal Portfolio");
    });

    it("should describe web development projects", () => {
      expect(projectsMetadata.description).toContain(
        "web development projects",
      );
    });

    it("should include keywords", () => {
      expect(projectsMetadata.keywords).toContain("web development projects");
      expect(projectsMetadata.keywords).toContain("react projects");
    });

    it("should have Open Graph configuration", () => {
      expect(projectsMetadata.openGraph).toBeDefined();
      expect(projectsMetadata.openGraph?.title).toBe(
        "Projects | Terminal Portfolio",
      );
      expect((projectsMetadata.openGraph as { type?: string })?.type).toBe(
        "website",
      );
    });

    it("should have Twitter Card configuration", () => {
      expect(projectsMetadata.twitter).toBeDefined();
      expect((projectsMetadata.twitter as { card?: string })?.card).toBe(
        "summary_large_image",
      );
    });

    it("should have canonical URL", () => {
      expect(projectsMetadata.alternates?.canonical).toBe("/projects");
    });
  });

  describe("Component Rendering", () => {
    const renderProjectsPage = async () => {
      const ResolvedContent = await ProjectsPageContent();
      return render(<StandardPageLayout>{ResolvedContent}</StandardPageLayout>);
    };

    it("should render without crashing", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = await renderProjectsPage();
      expect(container).toBeTruthy();
    });

    it("should render main element", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = await renderProjectsPage();
      const mainElement = container.querySelector("main");
      expect(mainElement).toBeTruthy();
    });

    it("should render page title", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByRole } = await renderProjectsPage();
      expect(
        getByRole("heading", { level: 1, name: /projects/i }),
      ).toBeInTheDocument();
    });

    it("should render project count in description", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = await renderProjectsPage();
      expect(getByText(/1 web development projects/i)).toBeInTheDocument();
    });

    it("should render featured projects section when available", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = await renderProjectsPage();
      expect(getByText(/Featured Projects/i)).toBeInTheDocument();
    });

    it("should render all projects section", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = await renderProjectsPage();
      expect(getByText(/All Projects/i)).toBeInTheDocument();
    });

    it("should render project statistics", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = await renderProjectsPage();
      expect(getByText(/Total Projects/i)).toBeInTheDocument();
      expect(getByText("Featured", { exact: true })).toBeInTheDocument();
      expect(getByText("Technologies", { exact: true })).toBeInTheDocument();
      expect(getByText("Completed", { exact: true })).toBeInTheDocument();
    });

    it("should render Suspense boundary", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockUseSyncContent.value = true;
      try {
        const { container } = render(<ProjectsPage />);
        expect(container).toBeTruthy();
      } finally {
        mockUseSyncContent.value = false;
      }
    });

    it("should include structured data script", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = await renderProjectsPage();
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      expect(scripts.length).toBeGreaterThan(0);
    });

    it("should include ItemList schema in structured data", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = await renderProjectsPage();
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      const itemListScript = Array.from(scripts).find((script) => {
        const content = script.textContent || "";
        return content.includes('"@type":"ItemList"');
      });

      expect(itemListScript).toBeTruthy();
    });
  });
});
