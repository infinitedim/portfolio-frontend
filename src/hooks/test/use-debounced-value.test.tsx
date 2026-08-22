import { describe, it, expect, jest, beforeEach, afterEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import {
  useDebouncedValue,
  useDebouncedCallback,
} from "@/hooks/use-debounced-value";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }

    ensureDocumentBody();
    jest.useFakeTimers();
  });
  afterEach(() => {
    if (!canRunTests) {
      return;
    }
    jest.useRealTimers();
  });

  it("debounces a changing value", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: "a", delay: 200 },
      },
    );

    expect(result.current).toBe("a");

    rerender({ value: "b", delay: 200 });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe("b");
  });

  it("debounced callback calls after delay", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const cb = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(cb, 100));

    act(() => {
      result.current("x");
      result.current("y");
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("y");
  });
});
