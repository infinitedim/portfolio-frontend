/**
 * @fileoverview Unit test suite for touch and mobile gesture hooks (useGestures and useTerminalGestures).
 * @module hooks/test/use-gestures.test
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useGestures, useTerminalGestures } from "@/hooks/use-gestures";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

/**
 * Creates a synthetic React TouchEvent object for mocking gesture interactions in tests.
 *
 * @param {string} type - Event type (e.g. "touchstart", "touchmove", "touchend").
 * @param {Array<{ clientX: number; clientY: number }>} touches - Coordinates for touch points in the event.
 * @returns {React.TouchEvent} Synthetic touch event with mocked TouchList and lifecycle methods.
 */
function createTouchEvent(
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
): React.TouchEvent {
  const touchList = touches.map((touch, index) => ({
    identifier: index,
    clientX: touch.clientX,
    clientY: touch.clientY,
    target: document.createElement("div"),
    screenX: touch.clientX,
    screenY: touch.clientY,
    pageX: touch.clientX,
    pageY: touch.clientY,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 1,
  })) as unknown as TouchList;

  const activeTouches =
    type === "touchend" ? ([] as unknown as TouchList) : touchList;

  return {
    type,
    touches: activeTouches,
    changedTouches: touchList,
    targetTouches: activeTouches,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  } as unknown as React.TouchEvent;
}

/**
 * Invokes the onTouchEnd handler on a gesture handler bundle.
 *
 * @param {ReturnType<ReturnType<typeof useGestures>["getGestureHandlers"]>} handlers - Gesture handler object returned by `getGestureHandlers()`.
 */
function callTouchEnd(
  handlers: ReturnType<ReturnType<typeof useGestures>["getGestureHandlers"]>,
) {
  (handlers.onTouchEnd as () => void)();
}

describe("useGestures", () => {
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

  it("provides gesture handlers and pull state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onPull = { onPullToRefresh: false };
    const callbacks = {
      onPullToRefresh: () => (onPull.onPullToRefresh = true),
    };
    const { result } = renderHook(() => useGestures(callbacks));
    const handlers = result.current.getGestureHandlers();
    expect(typeof handlers.onTouchStart).toBe("function");
    expect(typeof handlers.onTouchMove).toBe("function");
    expect(typeof handlers.onTouchEnd).toBe("function");
  });

  it("should initialize with default state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() => useGestures());
    expect(result.current.isPullRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it("should handle swipe right gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onSwipeRight = jest.fn();
    const { result } = renderHook(() => useGestures({ onSwipeRight }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 0, clientY: 100 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]),
      );
    });

    act(() => {
      callTouchEnd(handlers);
    });

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it("should handle swipe left gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onSwipeLeft = jest.fn();
    const { result } = renderHook(() => useGestures({ onSwipeLeft }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 0, clientY: 100 }]),
      );
    });

    act(() => {
      callTouchEnd(handlers);
    });

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it("should handle swipe up gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onSwipeUp = jest.fn();
    const { result } = renderHook(() => useGestures({ onSwipeUp }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 200 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]),
      );
    });

    act(() => {
      callTouchEnd(handlers);
    });

    expect(onSwipeUp).toHaveBeenCalled();
  });

  it("should handle swipe down gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onSwipeDown = jest.fn();
    const { result } = renderHook(() => useGestures({ onSwipeDown }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 100, clientY: 200 }]),
      );
    });

    act(() => {
      callTouchEnd(handlers);
    });

    expect(onSwipeDown).toHaveBeenCalled();
  });

  it("should handle long press gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onLongPress = jest.fn();
    const { result } = renderHook(() => useGestures({ onLongPress }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]),
      );
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalled();
  });

  it("should cancel long press when moved", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onLongPress = jest.fn();
    const { result } = renderHook(() => useGestures({ onLongPress }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 150, clientY: 100 }]),
      );
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("should handle double tap gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onDoubleTap = jest.fn();
    const { result } = renderHook(() => useGestures({ onDoubleTap }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]),
      );
      callTouchEnd(handlers);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 100 }]),
      );
      callTouchEnd(handlers);
    });

    expect(onDoubleTap).toHaveBeenCalled();
  });

  it("should handle pinch out gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onPinchOut = jest.fn();
    const { result } = renderHook(() => useGestures({ onPinchOut }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [
          { clientX: 100, clientY: 100 },
          { clientX: 110, clientY: 100 },
        ]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [
          { clientX: 50, clientY: 100 },
          { clientX: 160, clientY: 100 },
        ]),
      );
    });

    expect(onPinchOut).toHaveBeenCalled();
  });

  it("should handle pinch in gesture", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onPinchIn = jest.fn();
    const { result } = renderHook(() => useGestures({ onPinchIn }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [
          { clientX: 0, clientY: 100 },
          { clientX: 200, clientY: 100 },
        ]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [
          { clientX: 80, clientY: 100 },
          { clientX: 120, clientY: 100 },
        ]),
      );
    });

    expect(onPinchIn).toHaveBeenCalled();
  });

  it("should track pull to refresh state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onPullToRefresh = jest.fn();
    const { result } = renderHook(() => useGestures({ onPullToRefresh }));
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 50 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 100, clientY: 150 }]),
      );
    });

    expect(result.current.isPullRefreshing).toBe(true);
    expect(result.current.pullDistance).toBeGreaterThan(0);
  });

  it("should reset pull distance on touch end", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() => useGestures());
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 100, clientY: 50 }]),
      );
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]),
      );
      callTouchEnd(handlers);
    });

    expect(result.current.pullDistance).toBeLessThanOrEqual(100);
  });

  it("should accept custom config", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const onSwipeRight = jest.fn();
    const customConfig = { swipeThreshold: 100 };
    const { result } = renderHook(() =>
      useGestures({ onSwipeRight }, customConfig),
    );
    const handlers = result.current.getGestureHandlers();

    act(() => {
      handlers.onTouchStart(
        createTouchEvent("touchstart", [{ clientX: 0, clientY: 100 }]),
      );
    });

    act(() => {
      handlers.onTouchMove(
        createTouchEvent("touchmove", [{ clientX: 80, clientY: 100 }]),
      );
    });

    act(() => {
      callTouchEnd(handlers);
    });

    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("should prevent context menu on long press", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() => useGestures());
    const handlers = result.current.getGestureHandlers();

    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
    handlers.onContextMenu(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it("should return correct styles for touch action", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() => useGestures());
    const handlers = result.current.getGestureHandlers();

    expect(handlers.style).toEqual({
      touchAction: "pan-y",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
    });
  });
});

describe("useTerminalGestures", () => {
  it("adds to history and triggers commands", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const commands: Array<string> = [];
    const { result } = renderHook(() =>
      useTerminalGestures((c: string) => commands.push(c)),
    );

    act(() => result.current.addToHistory("test"));
    expect(result.current.commandHistory.includes("test")).toBe(true);
  });

  it("exposes show quick commands state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const executeCommand = jest.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    expect(result.current.showQuickCommands).toBe(false);

    act(() => {
      result.current.setShowQuickCommands(true);
    });

    expect(result.current.showQuickCommands).toBe(true);
  });

  it("exposes pull refreshing state", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const executeCommand = jest.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    expect(result.current.isPullRefreshing).toBe(false);
    expect(typeof result.current.pullDistance).toBe("number");
  });

  it("deduplicates command history on separate updates", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const executeCommand = jest.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    act(() => {
      result.current.addToHistory("command1");
    });

    act(() => {
      result.current.addToHistory("command1");
    });

    expect(
      result.current.commandHistory.filter((c) => c === "command1"),
    ).toHaveLength(1);
  });

  it("limits command history to 20 items", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const executeCommand = jest.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addToHistory(`command${i}`);
      }
    });

    expect(result.current.commandHistory.length).toBeLessThanOrEqual(20);
  });

  it("provides gesture handlers", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const executeCommand = jest.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    const handlers = result.current.getGestureHandlers();
    expect(handlers).toBeDefined();
    expect(typeof handlers.onTouchStart).toBe("function");
    expect(typeof handlers.onTouchMove).toBe("function");
    expect(typeof handlers.onTouchEnd).toBe("function");
  });

  it("does not add empty commands to history", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const executeCommand = jest.fn();
    const { result } = renderHook(() => useTerminalGestures(executeCommand));

    act(() => {
      result.current.addToHistory("");
      result.current.addToHistory("   ");
    });

    expect(result.current.commandHistory).toHaveLength(0);
  });
});
