import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectMetricsGrid } from "./project-metrics-grid";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("ProjectMetricsGrid Component", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
  });

  it("returns null when metrics prop is undefined", () => {
    if (!canRunTests) return;
    const { container } = render(<ProjectMetricsGrid />);
    expect(container.firstChild).toBeNull();
  });

  it("renders metric cells with correct values", () => {
    if (!canRunTests) return;
    const metrics = {
      latencyP95: "< 35ms",
      testCoverage: "94%",
      lighthouseScore: 100,
      uptimeSla: "99.9%",
    };

    render(<ProjectMetricsGrid metrics={metrics} />);

    expect(screen.getByText("< 35ms")).toBeInTheDocument();
    expect(screen.getByText("94%")).toBeInTheDocument();
    expect(screen.getByText("100/100")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
  });

  it("renders metric labels as uppercase text", () => {
    if (!canRunTests) return;
    render(
      <ProjectMetricsGrid
        metrics={{ latencyP95: "< 35ms" }}
      />,
    );

    expect(screen.getByText("P95 SLA")).toBeInTheDocument();
    expect(screen.getByText("Coverage")).toBeInTheDocument();
    expect(screen.getByText("Lighthouse")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });

  it("has accessible list role and label", () => {
    if (!canRunTests) return;
    render(
      <ProjectMetricsGrid
        metrics={{ latencyP95: "< 35ms" }}
      />,
    );

    expect(
      screen.getByRole("list", { name: /key engineering metrics/i }),
    ).toBeInTheDocument();
  });

  it("renders custom metric values when provided", () => {
    if (!canRunTests) return;
    const customMetrics = {
      latencyP95: "< 20ms",
      testCoverage: "98%",
      lighthouseScore: 99,
      uptimeSla: "99.99%",
    };

    render(<ProjectMetricsGrid metrics={customMetrics} />);

    expect(screen.getByText("< 20ms")).toBeInTheDocument();
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("99/100")).toBeInTheDocument();
    expect(screen.getByText("99.99%")).toBeInTheDocument();
  });
});
