"use client";

import { useState, useEffect } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 w-10 h-10 flex items-center justify-center bg-terminal-bg border border-terminal-border hover:border-terminal-accent text-terminal-accent rounded-full shadow-lg transition-colors z-50 font-mono cursor-pointer"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
