"use client";

import { useState, useEffect, type JSX } from "react";

/**
 * Real-time reading progress bar component for long-form blog articles.
 *
 * Calculates the current vertical scroll percentage relative to total document height
 * and renders an accessible fixed-position top progress indicator with `role="progressbar"`.
 *
 * @returns {JSX.Element} The rendered reading scroll progress indicator.
 */
export function ScrollProgress(): JSX.Element {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-[3px] bg-neutral-900 z-50 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
