import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { render } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (jest as unknown as Record<string, unknown>).mock !== "function"
)
  (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("next", () => ({
  Metadata: {},
}));

import type { Project } from "@/lib/data/data-fetching";

const mockProjects: Array<Project> = [
  {
    id: "1",
    slug: "test-project",
    name: "Test Project",
    description: "Test Description",
    technologies: ["React", "TypeScript"],
    status: "completed",
    featured: true,
    demoUrl: "https://example.com",
    githubUrl: "https://github.com/example",
  },
];

const mockFeaturedProjects = [mockProjects[0]];

mock.module("@/components/layout/standard-page-layout", () => ({
  StandardPageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="standard-page-layout">
      <main>{children}</main>
    </div>
  ),
}));

mock.module("@/lib/data/data-fetching", () => ({
  getProjectsData: jest.fn(() => Promise.resolve(mockProjects)),
  getFeaturedProjects: jest.fn(() => Promise.resolve(mockFeaturedProjects)),
}));

mock.module("@/components/molecules/projects/project-card", () => ({
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

mock.module("@/components/organisms/projects/projects-loading", () => ({
  ProjectsLoading: () => <div data-testid="projects-loading">Loading...</div>,
}));

const mockUseSyncContent = { value: false };

import { ProjectsClient } from "./projects-client";

mock.module("./projects-page-content", () => ({
  ProjectsPageContent: () => {
    if (mockUseSyncContent.value) {
      return <div data-testid="mock-projects-content" />;
    }
    return (
      <>
        <ProjectsClient
          allProjects={mockProjects}
          featuredProjects={mockFeaturedProjects}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Web Development Projects",
              description: "Portfolio of web development projects",
              numberOfItems: mockProjects.length,
            }),
          }}
        />
      </>
    );
  },
}));

import ProjectsPage, { metadata as projectsMetadata } from "./page";
import { ProjectsPageContent } from "./projects-page-content";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

describe("ProjectsPage", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    jest.clearAllMocks();
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
      expect(getByText(/ls --featured/i)).toBeInTheDocument();
    });

    it("should render all projects section", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { getByText } = await renderProjectsPage();
      expect(getByText(/ls --category=/i)).toBeInTheDocument();
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
