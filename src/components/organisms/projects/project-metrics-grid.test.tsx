import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectMetricsGrid } from "./project-metrics-grid";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("ProjectMetricsGrid Component", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("renders section title with terminal $ metrics --benchmark header", () => {
    if (!canRunTests) return;
    render(<ProjectMetricsGrid />);

    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("metrics --benchmark")).toBeInTheDocument();
  });

  it("renders default SLA metrics when metrics prop is undefined", () => {
    if (!canRunTests) return;
    render(<ProjectMetricsGrid />);

    expect(screen.getByText("< 35ms")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("100/100")).toBeInTheDocument();
    expect(screen.getByText("Rust / Axum / PPR")).toBeInTheDocument();
  });

  it("renders custom metric values when metrics prop is provided", () => {
    if (!canRunTests) return;
    const customMetrics = {
      latencyP95: "< 20ms",
      testCoverage: "98%",
      lighthouseScore: 99,
      architectureType: "Next.js / FastAPI",
    };

    render(<ProjectMetricsGrid metrics={customMetrics} />);

    expect(screen.getByText("< 20ms")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("99/100")).toBeInTheDocument();
    expect(screen.getByText("Next.js / FastAPI")).toBeInTheDocument();
  });
});
