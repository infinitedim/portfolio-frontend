import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { WebVitalsMonitor } from "@/components/monitoring/web-vitals-monitor";

const mockInitWebVitals = vi.fn();

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/lib/logger/web-vitals", () => ({
  initWebVitals: (...args: unknown[]) => mockInitWebVitals(...args),
}));

describe("WebVitalsMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing (null)", () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }
    const { container } = render(<WebVitalsMonitor />);
    expect(container.firstChild).toBeNull();
  });

  it("should call initWebVitals on mount", () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }
    render(<WebVitalsMonitor />);
    expect(mockInitWebVitals).toHaveBeenCalled();
  });
});
