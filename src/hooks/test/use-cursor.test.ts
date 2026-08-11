import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCursor } from "../use-cursor";

describe("useCursor Hook", () => {
  it("should initialize with default state and allow updating state", () => {
    const mockRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useCursor(mockRef));

    expect(result.current.cursorState).toBe("default");

    act(() => {
      result.current.setCursorState("hover");
    });

    expect(result.current.cursorState).toBe("hover");
  });
});
