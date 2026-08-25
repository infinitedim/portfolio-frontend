"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  JSX,
} from "react";

/**
 * Context state and control methods provided by the AccessibilityProvider.
 *
 * @interface AccessibilityContextType
 * @property {(message: string, priority?: "polite" | "assertive") => void} announceMessage - Announces a message to screen readers via an ARIA live region.
 * @property {boolean} isHighContrast - Indicates whether high contrast mode is detected or enabled.
 * @property {boolean} isReducedMotion - Indicates whether user prefers reduced motion animations.
 * @property {"small" | "medium" | "large"} fontSize - Current global UI font size preference.
 * @property {(size: "small" | "medium" | "large") => void} setFontSize - Updates the global UI font size preference.
 * @property {boolean} focusMode - Whether high-visibility keyboard focus indicators are active.
 * @property {(enabled: boolean) => void} setFocusMode - Toggles high-visibility keyboard focus mode.
 */
interface AccessibilityContextType {
  announceMessage: (message: string, priority?: "polite" | "assertive") => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: "small" | "medium" | "large";
  setFontSize: (size: "small" | "medium" | "large") => void;
  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
}

/**
 * React Context instance for providing accessibility settings and screen reader announcements.
 */
const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null,
);

/**
 * Application-wide Accessibility Provider managing a11y preferences and screen reader live regions.
 *
 * Automatically detects OS contrast and motion preferences, synchronizes font sizes and focus styles
 * with CSS custom properties and HTML root classes, and provides screen reader announcements.
 *
 * @param {Object} props - The component properties.
 * @param {ReactNode} props.children - Child components wrapped by the provider.
 * @returns {JSX.Element} The rendered context provider and live announcer DOM tree.
 */
export function AccessibilityProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messagePriority, setMessagePriority] = useState<
    "polite" | "assertive"
  >("polite");
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    highContrastQuery.addEventListener("change", handleHighContrastChange);

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    setIsReducedMotion(reducedMotionQuery.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    const savedFontSize = localStorage.getItem(
      "accessibility-font-size",
    ) as typeof fontSize;
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }

    const savedFocusMode =
      localStorage.getItem("accessibility-focus-mode") === "true";
    setFocusMode(savedFocusMode);

    return () => {
      highContrastQuery.removeEventListener("change", handleHighContrastChange);
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };

    root.style.setProperty("--base-font-size", sizeMap[fontSize]);
    localStorage.setItem("accessibility-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (focusMode) {
      root.classList.add("focus-mode");
    } else {
      root.classList.remove("focus-mode");
    }
    localStorage.setItem("accessibility-focus-mode", focusMode.toString());
  }, [focusMode]);

  /**
   * Dispatches a temporary announcement text to the hidden screen reader live region.
   *
   * @param message - Announcement text to be read by assistive technology.
   * @param priority - ARIA live urgency level ('polite' or 'assertive').
   */
  const announceMessage = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    setCurrentMessage(message);
    setMessagePriority(priority);

    setTimeout(() => setCurrentMessage(""), 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        announceMessage,
        isHighContrast,
        isReducedMotion,
        fontSize,
        setFontSize,
        focusMode,
        setFocusMode,
      }}
    >
      {children}

      {}
      <div
        aria-live={messagePriority}
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {currentMessage}
      </div>
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to access the current accessibility context and announcement dispatcher.
 *
 * @throws {Error} Thrown if invoked outside of an `<AccessibilityProvider>` tree.
 * @returns {AccessibilityContextType} The current accessibility state and actions.
 */
export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
}
