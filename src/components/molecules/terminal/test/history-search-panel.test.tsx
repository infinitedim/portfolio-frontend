import { render } from "@testing-library/react";
import { HistorySearchPanel } from "../history-search-panel";
import { expect, test, jest } from "bun:test";
import { AccessibilityProvider } from "@/components/organisms/accessibility/accessibility-provider";

                                                             
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),              
    removeListener: jest.fn(),              
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

                                                

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
