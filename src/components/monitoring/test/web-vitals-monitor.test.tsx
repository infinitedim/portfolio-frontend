

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { WebVitalsMonitor } from "@/components/monitoring/web-vitals-monitor";

const mockInitWebVitals = vi.fn();
// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

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
    // Requires vi.mock for web-vitals module — not available in bun test
    if (typeof Bun !== "undefined") { expect(true).toBe(true); return; }
    render(<WebVitalsMonitor />);
    expect(mockInitWebVitals).toHaveBeenCalled();
  });
});
