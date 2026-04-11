/**
 * @fileoverview Tests for TerminalInputSection
 *
 * Tests verify that:
 *  1. The input field renders
 *  2. Typing updates the input value
 *  3. Loading indicator is absent when not processing
 *  4. The #command-input anchor renders
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TerminalProvider } from "@/lib/context/terminal-context";
import { TerminalInputSection } from "@/components/organisms/terminal/terminal-input-section";
import { AccessibilityProvider } from "@/components/organisms/accessibility/accessibility-provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderWithProvider = () =>
  render(
    <AccessibilityProvider>
      <TerminalProvider>
        <TerminalInputSection />
      </TerminalProvider>
    </AccessibilityProvider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TerminalInputSection", () => {
  // 1. Input field renders
  it("renders a command input field", () => {
    renderWithProvider();

    const input =
      screen.queryByRole("textbox") ??
      screen.queryByRole("combobox") ??
      document.querySelector("input");

    expect(input).toBeTruthy();
  });

  // 2. Input value syncs
  it("reflects typed text", () => {
    renderWithProvider();

    const input = (
      screen.queryByRole("textbox") ??
      screen.queryByRole("combobox") ??
      document.querySelector("input")
    ) as HTMLInputElement | null;

    expect(input).toBeTruthy();
    if (!input) return;

    fireEvent.change(input, { target: { value: "help" } });
    expect(input.value).toBe("help");
  });

  // 3. No loading indicator when idle
  it("does not show loading indicator when not processing", () => {
    renderWithProvider();

    expect(
      screen.queryByText(/Processing command/i) ??
      screen.queryByRole("progressbar"),
    ).toBeNull();
  });

  // 4. Sticky anchor renders
  it("renders the #command-input anchor", () => {
    renderWithProvider();

    const anchor = document.getElementById("command-input");
    expect(anchor).toBeTruthy();
  });
});
