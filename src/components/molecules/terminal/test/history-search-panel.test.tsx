import { render } from "@testing-library/react";
import { HistorySearchPanel } from "../history-search-panel";
import { expect, test } from "vitest";

// Test HistorySearchPanel without mocking hooks

test("renders HistorySearchPanel successfully without throwing", () => {
  const { getByText, getByPlaceholderText } = render(
    <HistorySearchPanel
      isOpen={true}
      onClose={() => {}}
      onSelectCommand={() => {}}
    />
  );

  expect(getByText("Command History")).toBeDefined();
  expect(getByPlaceholderText("Search commands...")).toBeDefined();
  expect(getByText("No command history")).toBeDefined();
});
