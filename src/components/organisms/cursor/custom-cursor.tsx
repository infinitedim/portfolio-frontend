"use client";

import { useEffect, useRef, useState } from "react";
import "./cursor.css";
import { useCursor } from "@/hooks/use-cursor";
import { usePointerDevice } from "@/hooks/use-pointer-device";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const deviceInfo = usePointerDevice();

  const { cursorState, cursorTheme } = useCursor(cursorRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFirstMove = () => {
      setHasMoved(true);
      window.removeEventListener("mousemove", handleFirstMove);
    };

    window.addEventListener("mousemove", handleFirstMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleFirstMove);
    };
  }, []);

  useEffect(() => {
    if (
      !mounted ||
      !deviceInfo.isCustomCursorSupported ||
      typeof window === "undefined"
    )
      return;

    const htmlEl = document.documentElement;
    htmlEl.classList.add("cursor-active-global");

    return () => {
      htmlEl.classList.remove("cursor-active-global");
    };
  }, [mounted, deviceInfo.isCustomCursorSupported]);

  if (!mounted || !deviceInfo.isCustomCursorSupported) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      role="presentation"
      className={`ecommerce-cursor cursor-theme-${cursorTheme}`}
      data-state={cursorState}
      data-moved={hasMoved ? "true" : "false"}
    />
  );
}

export default CustomCursor;
