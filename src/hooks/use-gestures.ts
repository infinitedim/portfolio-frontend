import { useRef, useCallback, useState, useMemo } from "react";
import { useTimerManager, useMountRef } from "./hooks-utils";

/**
 * Configuration thresholds and timing parameters for gesture detection.
 */
export interface GestureConfig {
  /** Minimum pixel distance required along an axis to trigger a swipe event. */
  swipeThreshold: number;
  /** Milliseconds a touch must be held stationary to register as a long press. */
  longPressDelay: number;
  /** Maximum milliseconds between two consecutive taps to register as a double tap. */
  doubleTapDelay: number;
  /** Minimum scale delta required to trigger pinch-in or pinch-out callbacks. */
  pinchThreshold: number;
}

/**
 * Event handler callbacks triggered when specific touch gestures are recognized.
 */
export interface GestureCallbacks {
  /** Callback fired when a leftward horizontal swipe is detected. */
  onSwipeLeft?: () => void;
  /** Callback fired when a rightward horizontal swipe is detected. */
  onSwipeRight?: () => void;
  /** Callback fired when an upward vertical swipe is detected. */
  onSwipeUp?: () => void;
  /** Callback fired when a downward vertical swipe is detected. */
  onSwipeDown?: () => void;
  /** Callback fired when a long-press gesture exceeds the configured duration. */
  onLongPress?: () => void;
  /** Callback fired when a double-tap is recognized within the configured interval. */
  onDoubleTap?: () => void;
  /**
   * Callback fired during a two-finger pinch-in gesture.
   * @param scale - The computed scale factor relative to the initial touch distance (less than 1).
   */
  onPinchIn?: (scale: number) => void;
  /**
   * Callback fired during a two-finger pinch-out gesture.
   * @param scale - The computed scale factor relative to the initial touch distance (greater than 1).
   */
  onPinchOut?: (scale: number) => void;
  /** Callback fired when a top-of-screen downward pull exceeds the refresh threshold. */
  onPullToRefresh?: () => void;
}

/**
 * Internal state tracking for multi-touch pointer events and ongoing gestures.
 */
interface TouchState {
  /** Initial horizontal client coordinate of the first touch. */
  startX: number;
  /** Initial vertical client coordinate of the first touch. */
  startY: number;
  /** Latest horizontal client coordinate of the primary touch. */
  currentX: number;
  /** Latest vertical client coordinate of the primary touch. */
  currentY: number;
  /** Unix timestamp in milliseconds when the touch interaction commenced. */
  startTime: number;
  /** Boolean flag indicating if a touch pointer is actively held down. */
  isPressed: boolean;
  /** Unix timestamp of the most recent tap event for double-tap detection. */
  lastTapTime: number;
  /** Number of consecutive taps recorded within the double-tap window. */
  tapCount: number;
  /** Initial euclidean distance between two touch points in a pinch gesture. */
  initialDistance: number;
  /** Current scale ratio derived from two-finger distance changes. */
  scale: number;
}

/**
 * Default configuration values for gesture thresholds and delays.
 */
const DEFAULT_CONFIG: GestureConfig = {
  swipeThreshold: 50,
  longPressDelay: 500,
  doubleTapDelay: 300,
  pinchThreshold: 0.1,
};

/**
 * Custom React hook for recognizing touch gestures on interactive elements.
 *
 * Supports directional swipes (left/right/up/down), long press, double tap,
 * two-finger pinch-to-zoom, and pull-to-refresh patterns.
 *
 * @param callbacks - Optional handler functions for recognized gesture events.
 * @param config - Optional configuration overrides for gesture sensitivity and timings.
 * @returns An object containing gesture event handlers and touch state metrics:
 * - `getGestureHandlers`: Function returning touch event props and style overrides to spread onto a target element.
 * - `isPullRefreshing`: Whether a pull-to-refresh gesture has triggered and is pending reset.
 * - `pullDistance`: Current downward drag distance in pixels for pull-to-refresh visualization.
 * - `touchState`: Current snapshot of the internal touch tracking data.
 *
 * @example
 * ```tsx
 * const { getGestureHandlers, isPullRefreshing } = useGestures({
 *   onSwipeLeft: () => navigateNext(),
 *   onSwipeRight: () => navigatePrev(),
 *   onDoubleTap: () => resetZoom(),
 * });
 *
 * return <div {...getGestureHandlers()}>Interactive Canvas</div>;
 * ```
 */
export function useGestures(
  callbacks: GestureCallbacks = {},
  config: Partial<GestureConfig> = {},
) {
  const isMountedRef = useMountRef();
  const { setTimer, clearTimer } = useTimerManager();

  const fullConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isPressed: false,
    lastTapTime: 0,
    tapCount: 0,
    initialDistance: 0,
    scale: 1,
  });

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const memoizedCallbacks = useMemo(() => callbacks, [callbacks]);

  /**
   * Computes the euclidean distance between two touch points.
   *
   * @param touch1 - The primary touch point.
   * @param touch2 - The secondary touch point.
   * @returns The distance in pixels between the two points.
   */
  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMountedRef.current) return;

      const touch = e.touches[0];
      const now = Date.now();

      touchState.current = {
        ...touchState.current,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: now,
        isPressed: true,
      };

      if (e.touches.length === 2) {
        touchState.current.initialDistance = getDistance(
          e.touches[0],
          e.touches[1],
        );
        touchState.current.scale = 1;
      }

      setTimer(
        "longPress",
        () => {
          if (isMountedRef.current && touchState.current.isPressed) {
            memoizedCallbacks.onLongPress?.();
          }
        },
        fullConfig.longPressDelay,
      );

      if (now - touchState.current.lastTapTime < fullConfig.doubleTapDelay) {
        touchState.current.tapCount++;
      } else {
        touchState.current.tapCount = 1;
      }
      touchState.current.lastTapTime = now;
    },
    [
      isMountedRef,
      memoizedCallbacks,
      fullConfig.doubleTapDelay,
      fullConfig.longPressDelay,
      setTimer,
    ],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMountedRef.current || !touchState.current.isPressed) return;

      const touch = e.touches[0];
      touchState.current.currentX = touch.clientX;
      touchState.current.currentY = touch.clientY;

      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / touchState.current.initialDistance;
        touchState.current.scale = scale;

        if (Math.abs(scale - 1) > fullConfig.pinchThreshold) {
          if (scale > 1) {
            memoizedCallbacks.onPinchOut?.(scale);
          } else {
            memoizedCallbacks.onPinchIn?.(scale);
          }
        }
        return;
      }

      const deltaY = touchState.current.currentY - touchState.current.startY;
      if (deltaY > 0 && touchState.current.startY < 100) {
        if (isMountedRef.current) {
          setPullDistance(Math.min(deltaY, 100));
          if (deltaY > 80 && !isPullRefreshing) {
            setIsPullRefreshing(true);
          }
        }
      }

      const deltaX = Math.abs(
        touchState.current.currentX - touchState.current.startX,
      );
      const deltaYAbs = Math.abs(deltaY);
      if (deltaX > 10 || deltaYAbs > 10) {
        clearTimer("longPress");
      }
    },
    [
      isMountedRef,
      memoizedCallbacks,
      fullConfig.pinchThreshold,
      isPullRefreshing,
      clearTimer,
    ],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isMountedRef.current || !touchState.current.isPressed) return;

    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaY = touchState.current.currentY - touchState.current.startY;
    const duration = Date.now() - touchState.current.startTime;

    clearTimer("longPress");

    if (isPullRefreshing && pullDistance > 80) {
      memoizedCallbacks.onPullToRefresh?.();
      setTimer(
        "pullRefreshReset",
        () => {
          if (isMountedRef.current) {
            setIsPullRefreshing(false);
            setPullDistance(0);
          }
        },
        1000,
      );
    } else {
      if (isMountedRef.current) {
        setPullDistance(0);
        setIsPullRefreshing(false);
      }
    }

    if (duration < 300) {
      if (Math.abs(deltaX) > fullConfig.swipeThreshold) {
        if (deltaX > 0) {
          memoizedCallbacks.onSwipeRight?.();
        } else {
          memoizedCallbacks.onSwipeLeft?.();
        }
      } else if (Math.abs(deltaY) > fullConfig.swipeThreshold) {
        if (deltaY > 0) {
          memoizedCallbacks.onSwipeDown?.();
        } else {
          memoizedCallbacks.onSwipeUp?.();
        }
      }
    }

    if (
      touchState.current.tapCount === 2 &&
      duration < 200 &&
      Math.abs(deltaX) < 20 &&
      Math.abs(deltaY) < 20
    ) {
      memoizedCallbacks.onDoubleTap?.();
    }

    touchState.current.isPressed = false;
  }, [
    isMountedRef,
    memoizedCallbacks,
    fullConfig,
    isPullRefreshing,
    pullDistance,
    clearTimer,
    setTimer,
  ]);

  const getGestureHandlers = useCallback(
    () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      style: {
        touchAction: "pan-y",
        userSelect: "none" as const,
        WebkitUserSelect: "none" as const,
        WebkitTouchCallout: "none" as const,
      },
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  return {
    getGestureHandlers,
    isPullRefreshing,
    pullDistance,
    touchState: touchState.current,
  };
}

/**
 * Custom React hook tailoring gesture management specifically for mobile terminal interactions.
 *
 * Integrates command history cycling via vertical swipes, quick-command overlay toggling
 * via horizontal swipes / long-press, help triggering via double-tap, and screen clearing via pull-to-refresh.
 *
 * @param onCommand - Callback executed with command strings triggered by gestures or history navigation.
 * @returns An object containing gesture handlers, quick-command states, and command history management:
 * - `getGestureHandlers`: Prop getter to bind touch events to the terminal container.
 * - `isPullRefreshing`: Whether terminal clear via pull is active.
 * - `pullDistance`: Current pull distance for drag animations.
 * - `showQuickCommands`: State flag controlling visibility of the quick commands panel.
 * - `setShowQuickCommands`: Dispatcher to toggle the quick commands panel.
 * - `addToHistory`: Function to append executed commands to the local gesture history buffer.
 * - `commandHistory`: List of recorded command history strings (capped at 20).
 *
 * @example
 * ```tsx
 * const { getGestureHandlers, showQuickCommands, addToHistory } = useTerminalGestures((cmd) => {
 *   executeCommand(cmd);
 * });
 * ```
 */
export function useTerminalGestures(onCommand: (command: string) => void) {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showQuickCommands, setShowQuickCommands] = useState(false);

  const gestureCallbacks: GestureCallbacks = {
    onSwipeLeft: () => {
      setShowQuickCommands(true);
    },

    onSwipeRight: () => {
      setShowQuickCommands(false);
    },

    onSwipeUp: () => {
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        onCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    },

    onSwipeDown: () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        onCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        onCommand("");
      }
    },

    onDoubleTap: () => {
      onCommand("help");
    },

    onLongPress: () => {
      setShowQuickCommands(true);
    },

    onPullToRefresh: () => {
      onCommand("clear");
    },
  };

  const { getGestureHandlers, isPullRefreshing, pullDistance } = useGestures(
    gestureCallbacks,
    {
      swipeThreshold: 30,
      longPressDelay: 400,
    },
  );

  const addToHistory = useCallback(
    (command: string) => {
      if (command.trim() && !commandHistory.includes(command)) {
        setCommandHistory((prev) => [...prev.slice(-19), command]);
      }
      setHistoryIndex(-1);
    },
    [commandHistory],
  );

  return {
    getGestureHandlers,
    isPullRefreshing,
    pullDistance,
    showQuickCommands,
    setShowQuickCommands,
    addToHistory,
    commandHistory,
  };
}
