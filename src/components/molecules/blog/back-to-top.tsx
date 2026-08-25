"use client";

import { useState, useEffect, type JSX } from "react";

/**
 * Floating back-to-top button component for extended blog post layouts.
 *
 * Automatically monitors window scroll depth and reveals a fixed-position floating button
 * once the user scrolls past 400px, triggering smooth animated scrolling back to the page top.
 *
 * @returns {JSX.Element | null} The rendered floating back-to-top button element or null when hidden.
 */
export function BackToTop(): JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Smoothly scrolls the window viewport back to the top offset (y=0).
   *
   * @returns {void}
   */
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 px-3 py-2 flex items-center justify-center bg-neutral-900/90 border border-neutral-700 hover:border-emerald-400 text-emerald-400 rounded-lg shadow-xl backdrop-blur-md transition-all z-50 font-mono text-xs font-semibold cursor-pointer shadow-emerald-500/10 hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]"
      aria-label="Back to top"
    >
      <span>[^] TOP</span>
    </button>
  );
}
