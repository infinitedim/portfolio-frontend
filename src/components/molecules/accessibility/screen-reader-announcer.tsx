"use client";

import { JSX, useEffect, useRef } from "react";

/**
 * Props for the ScreenReaderAnnouncer component.
 *
 * @interface ScreenReaderAnnouncerProps
 * @property {string} message - The textual message to broadcast to screen readers.
 * @property {"polite" | "assertive"} [priority] - The ARIA live announcement priority level (`polite` waits until idle, `assertive` interrupts).
 */
interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
}

/**
 * Screen reader live region component for accessible auditory notifications.
 *
 * Emits dynamic updates via an invisible (`sr-only`) DOM element configured with `role="status"`
 * and `aria-live`. Clears and re-inserts text content with a debounce interval to force
 * assistive tech screen readers (NVDA, JAWS, VoiceOver) to vocalize repeated messages.
 *
 * @param {ScreenReaderAnnouncerProps} props - Component properties.
 * @param {string} props.message - The notification message to announce.
 * @param {"polite" | "assertive"} [props.priority] - Live region urgency level.
 * @returns {JSX.Element} The visually hidden ARIA live region container.
 */
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
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

