/**
 * @fileoverview Tests for TerminalContext
 *
 * Tests verify that:
 *  1. useTerminalContext throws when called outside a provider
 *  2. Provider exposes all expected value groups
 *  3. showNotification / clearNotification round-trip works
 *  4. setCurrentInput updates the value
 *  5. Tour start/skip cycle works
 *  6. Refs are exposed
 *  7. setShowWelcome controls the flag
 *  8. handleWelcomeCommandSelect sets currentInput and returns the command
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  TerminalProvider,
  useTerminalContext,
} from "@/lib/context/terminal-context";
import { AccessibilityProvider } from "@/components/organisms/accessibility/accessibility-provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AccessibilityProvider>
    <TerminalProvider>{children}</TerminalProvider>
  </AccessibilityProvider>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TerminalContext", () => {
  // 1. Guard: throw outside provider
  it("throws when used outside a TerminalProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useTerminalContext())).toThrow(
      "useTerminalContext() must be used within a <TerminalProvider>",
    );

    consoleError.mockRestore();
  });

  // 2. Core values exist
  it("provides all expected core values", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    // Terminal core
    expect(Array.isArray(result.current.history)).toBe(true);
    expect(typeof result.current.currentInput).toBe("string");
    expect(typeof result.current.setCurrentInput).toBe("function");
    expect(typeof result.current.isProcessing).toBe("boolean");
    expect(typeof result.current.executeCommand).toBe("function");
    expect(typeof result.current.handleSubmit).toBe("function");

    // Theme
    expect(typeof result.current.theme).toBe("string");
    expect(typeof result.current.changeTheme).toBe("function");

    // Font
    expect(typeof result.current.font).toBe("string");
    expect(typeof result.current.changeFont).toBe("function");

    // i18n
    expect(typeof result.current.t).toBe("function");
    expect(typeof result.current.currentLocale).toBe("string");

    // Accessibility
    expect(typeof result.current.isReducedMotion).toBe("boolean");
    expect(typeof result.current.announceMessage).toBe("function");

    // Tour
    expect(typeof result.current.isTourActive).toBe("boolean");
    expect(typeof result.current.startTour).toBe("function");
    expect(typeof result.current.skipTour).toBe("function");
  });

  // 3. Notification round-trip
  it("showNotification and clearNotification work correctly", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    expect(result.current.notification).toBeNull();

    act(() => {
      result.current.showNotification("Test message", "success");
    });

    expect(result.current.notification).toEqual({
      message: "Test message",
      type: "success",
    });

    act(() => {
      result.current.clearNotification();
    });

    expect(result.current.notification).toBeNull();
  });

  // 4. setCurrentInput updates value
  it("setCurrentInput updates currentInput", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    expect(result.current.currentInput).toBe("");

    act(() => {
      result.current.setCurrentInput("help");
    });

    expect(result.current.currentInput).toBe("help");
  });

  // 5. Tour start/skip cycle
  it("tour starts and can be skipped", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    expect(result.current.isTourActive).toBe(false);

    act(() => {
      result.current.startTour();
    });

    expect(result.current.isTourActive).toBe(true);

    act(() => {
      result.current.handleTourSkip();
    });

    expect(result.current.isTourActive).toBe(false);
    expect(result.current.showWelcome).toBe(true);
  });

  // 6. Refs exist
  it("exposes DOM refs", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    expect(result.current.commandInputRef).toBeDefined();
    expect(result.current.terminalRef).toBeDefined();
    expect(result.current.bottomRef).toBeDefined();
  });

  // 7. showWelcome toggles
  it("setShowWelcome controls the showWelcome flag", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    expect(result.current.showWelcome).toBe(true);

    act(() => {
      result.current.setShowWelcome(false);
    });

    expect(result.current.showWelcome).toBe(false);
  });

  // 8. handleWelcomeCommandSelect sets currentInput
  it("handleWelcomeCommandSelect sets currentInput and returns the command", () => {
    const { result } = renderHook(() => useTerminalContext(), { wrapper });

    let returnValue: string | undefined;
    act(() => {
      returnValue = result.current.handleWelcomeCommandSelect("skills");
    });

    expect(result.current.currentInput).toBe("skills");
    expect(returnValue).toBe("skills");
  });
});
