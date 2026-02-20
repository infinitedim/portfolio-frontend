

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { WebVitalsMonitor } from "@/components/monitoring/web-vitals-monitor";

const mockInitWebVitals = vi.fn();
vi.mock("@/lib/logger/web-vitals", () => ({
  initWebVitals: (...args: unknown[]) => mockInitWebVitals(...args),
}));

describe("WebVitalsMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing (null)", () => {
    const { container } = render(<WebVitalsMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it("should call initWebVitals on mount", () => {
    render(<WebVitalsMonitor />);
    expect(mockInitWebVitals).toHaveBeenCalled();
  });
});
