"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CursorState, CursorTheme } from "@/components/organisms/cursor/cursor.types";

export interface UseCursorReturn {
  cursorState: CursorState;
  cursorText: string | null;
  cursorTheme: CursorTheme;
  setCursorState: (state: CursorState, text?: string | null) => void;
}

/**
 * Modernized Custom Cursor Hook with Daoism-style LERP Trailing Delay & E-Commerce Logic.
 * Updates --x and --y CSS variables via continuous RAF Lerp loop.
 */
export function useCursor(
  cursorRef: React.RefObject<HTMLDivElement | null>,
): UseCursorReturn {
  const [cursorState, setCursorStateInternal] = useState<CursorState>("default");
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [cursorTheme, setCursorTheme] = useState<CursorTheme>("standard");

  const rafIdRef = useRef<number | null>(null);
  const targetPosRef = useRef({ x: -100, y: -100 });
  const currentPosRef = useRef({ x: -100, y: -100 });
  const isInitializedRef = useRef(false);

  const setCursorState = useCallback((state: CursorState, text: string | null = null) => {
    setCursorStateInternal(state);
    setCursorText(text);
  }, []);

  // RAF Lerp Animation Loop for Daoism-style smooth trailing delay
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lerpFactor = 0.18; // Silky smooth trailing delay inertia

    const animate = () => {
      if (!isInitializedRef.current && targetPosRef.current.x !== -100) {
        currentPosRef.current.x = targetPosRef.current.x;
        currentPosRef.current.y = targetPosRef.current.y;
        isInitializedRef.current = true;
      }

      // Linear Interpolation: current = current + (target - current) * lerpFactor
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * lerpFactor;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * lerpFactor;

      if (cursorRef.current) {
        cursorRef.current.style.setProperty("--x", `${currentPosRef.current.x}px`);
        cursorRef.current.style.setProperty("--y", `${currentPosRef.current.y}px`);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetPosRef.current.x = e.clientX;
      targetPosRef.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [cursorRef]);

  // Global Event Delegation for Interactive Elements
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interactiveSelector =
      '[data-cursor], a, button, [role="button"], input[type="submit"], input[type="button"]';

    const handlePointerOver = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(interactiveSelector);
      if (!target) return;

      const cursorAttr = target.getAttribute("data-cursor") as CursorState | null;

      if (cursorAttr === "hide") {
        setCursorState("hide");
      } else {
        setCursorState("hover");
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(interactiveSelector);
      if (!target) return;

      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const nextInteractive = relatedTarget?.closest<HTMLElement>(interactiveSelector);

      if (!nextInteractive) {
        setCursorState("default", null);
      }
    };

    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });

    return () => {
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, [setCursorState]);

  // Determine theme client-side based on window.location.pathname
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateTheme = () => {
      const path = window.location.pathname;
      if (path.startsWith("/terminal") || path.startsWith("/gate") || path.startsWith("/s3cr3t")) {
        setCursorTheme("terminal");
      } else {
        setCursorTheme("standard");
      }
    };

    updateTheme();
    window.addEventListener("popstate", updateTheme);

    return () => {
      window.removeEventListener("popstate", updateTheme);
    };
  }, []);

  return {
    cursorState,
    cursorText,
    cursorTheme,
    setCursorState,
  };
}
