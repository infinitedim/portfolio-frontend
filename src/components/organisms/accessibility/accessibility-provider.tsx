"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  JSX,
} from "react";

interface AccessibilityContextType {
  announceMessage: (message: string, priority?: "polite" | "assertive") => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: "small" | "medium" | "large";
  setFontSize: (size: "small" | "medium" | "large") => void;
  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null,
);

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

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider",
    );
  }
  return context;
}
