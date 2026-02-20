"use client";

import { JSX, useEffect, useRef } from "react";

interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
}

export function ScreenReaderAnnouncer({
  message,
  priority = "polite",
}: ScreenReaderAnnouncerProps): JSX.Element {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcerRef.current) {
      announcerRef.current.textContent = "";
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}
