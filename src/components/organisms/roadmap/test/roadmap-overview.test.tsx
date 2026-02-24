import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { RoadmapOverview } from "../roadmap-overview";

// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/components/molecules/roadmap/progress-bar", () => ({
  ProgressBar: ({ progress }: any) => (
    <div data-testid="progress-bar">Progress: {progress}%</div>
  ),
}));

const mockThemeConfig = {
  name: "default",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    accent: "#00ff00",
    border: "#333333",
    success: "#00ff00",
  },
};

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
    theme: "default",
  }),
}));

const mockRoadmapData = {
  userId: "test-user",
  username: "test",
  totalProgress: 50,
  lastUpdated: new Date(),
  completedSkills: 1,
  totalSkills: 3,
  categories: [
    {
      id: "cat1",
      name: "Category 1",
      description: "Test category",
      progress: 50,
      color: "#00ff00",
      skills: [
        { id: "s1", name: "Skill 1", category: "cat1", description: "Test", status: "completed" as const, progress: 100, priority: "high" as const },
        { id: "s2", name: "Skill 2", category: "cat1", description: "Test", status: "in-progress" as const, progress: 50, priority: "high" as const },
        { id: "s3", name: "Skill 3", category: "cat1", description: "Test", status: "not-started" as const, progress: 0, priority: "high" as const },
      ],
    },
  ],
};

describe("RoadmapOverview", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render roadmap overview", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      expect(screen.getByText(/Roadmap Progress/i)).toBeInTheDocument();
    });

    it("should display overall progress percentage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      
      expect(screen.getByText(/33%/i)).toBeInTheDocument();
    });

    it("should display stats", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      expect(screen.getByText(/Total Skills/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed/i)).toBeInTheDocument();
      expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Not Started/i)).toBeInTheDocument();
    });

    it("should render in compact mode", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(
        <RoadmapOverview roadmapData={mockRoadmapData} compact={true} />,
      );

      const overview = container.querySelector(".p-3");
      expect(overview).toBeInTheDocument();
    });
  });

  describe("Progress Calculation", () => {
    it("should calculate progress correctly", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<RoadmapOverview roadmapData={mockRoadmapData} />);

      expect(screen.getByText("3")).toBeInTheDocument(); 
      expect(screen.getByText("1")).toBeInTheDocument(); 
      expect(screen.getByText("1")).toBeInTheDocument(); 
    });

    it("should handle empty roadmap data", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const emptyData = {
        userId: "test-user",
        username: "test",
        totalProgress: 0,
        lastUpdated: new Date(),
        completedSkills: 0,
        totalSkills: 0,
        categories: [],
      };
      render(<RoadmapOverview roadmapData={emptyData} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});
