import { render } from "@testing-library/react";
import { HistorySearchPanel } from "../history-search-panel";
import { expect, test, vi } from "vitest";
import { AccessibilityProvider } from "@/components/organisms/accessibility/accessibility-provider";

// Mock window.matchMedia since AccessibilityProvider uses it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test HistorySearchPanel without mocking hooks

test("renders HistorySearchPanel successfully without throwing", () => {
  const { getByText, getByPlaceholderText } = render(
    <AccessibilityProvider>
      <HistorySearchPanel
        isOpen={true}
        onClose={() => {}}
        onSelectCommand={() => {}}
      />
    </AccessibilityProvider>,
  );

  expect(getByText("Command History")).toBeDefined();
  expect(getByPlaceholderText("Search commands...")).toBeDefined();
  expect(getByText("No command history")).toBeDefined();
});
