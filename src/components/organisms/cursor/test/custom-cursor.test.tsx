import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, mock } from "bun:test";
import { CursorProvider, useCursor } from "../cursor-context";
import type { ReactNode } from "react";

mock.module("@/hooks/use-pointer-device", () => ({
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

  it("should initialize with default state and allow setting hover state", () => {
    const { result } = renderHook(() => useCursor(), { wrapper });

    expect(result.current.cursorState).toBe("default");

    act(() => {
      result.current.setCursorState("hover");
    });

    expect(result.current.cursorState).toBe("hover");
  });
});
