import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CursorProvider, useCursor } from "../cursor-context";
import type { ReactNode } from "react";

vi.mock("@/hooks/use-pointer-device", () => ({
  usePointerDevice: () => ({
    isFinePointer: true,
    isTouchDevice: false,
    prefersReducedMotion: false,
    isCustomCursorSupported: true,
  }),
}));

describe("CursorContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CursorProvider>{children}</CursorProvider>
  );

  it("should initialize with default state and allow setting text state", () => {
    const { result } = renderHook(() => useCursor(), { wrapper });

    expect(result.current.cursorState).toBe("default");

    act(() => {
      result.current.setCursorState("text", "VIEW");
    });

    expect(result.current.cursorState).toBe("text");
    expect(result.current.cursorText).toBe("VIEW");
  });
});
