import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCursor } from "../use-cursor";

describe("useCursor Hook", () => {
  it("should initialize with default state and allow updating state and text", () => {
    const mockRef = { current: document.createElement("div") };
    const { result } = renderHook(() => useCursor(mockRef));

    expect(result.current.cursorState).toBe("default");
    expect(result.current.cursorText).toBeNull();

    act(() => {
      result.current.setCursorState("text", "VIEW");
    });

    expect(result.current.cursorState).toBe("text");
    expect(result.current.cursorText).toBe("VIEW");
  });
});
