import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectEngineeringHighlights } from "./project-engineering-highlights";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const mockHighlights = [
  {
    id: "arch",
    category: "Architecture",
    title: "Rust/Axum monorepo with PostgreSQL and Redis rate limiting",
  },
  {
    id: "perf",
    category: "Performance",
    title: "All API routes verified P95 < 35ms against SLA",
    detail: "Validated via CI smoke tests",
  },
];

describe("ProjectEngineeringHighlights", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("returns null when highlights is undefined", () => {
    if (!canRunTests) return;
    const { container } = render(<ProjectEngineeringHighlights />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when highlights is empty array", () => {
    if (!canRunTests) return;
    const { container } = render(
      <ProjectEngineeringHighlights highlights={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders section title with terminal header", () => {
    if (!canRunTests) return;
    render(<ProjectEngineeringHighlights highlights={mockHighlights} />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("cat --highlights")).toBeInTheDocument();
  });

  it("renders highlight items with category labels", () => {
    if (!canRunTests) return;
    render(<ProjectEngineeringHighlights highlights={mockHighlights} />);
    expect(screen.getByText("Architecture")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Rust/Axum monorepo with PostgreSQL and Redis rate limiting",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(
      screen.getByText("All API routes verified P95 < 35ms against SLA"),
    ).toBeInTheDocument();
  });

  it("renders detail text when provided", () => {
    if (!canRunTests) return;
    render(<ProjectEngineeringHighlights highlights={mockHighlights} />);
    expect(
      screen.getByText("Validated via CI smoke tests"),
    ).toBeInTheDocument();
  });
});
