/**
 * @fileoverview Customization toolbar organism component providing access to terminal customization options,
 * theme management modal dialogs, and floating notification toasts.
 * @module components/organisms/terminal/terminal-customization-toolbar
 */

"use client";

import { useState, useEffect, type JSX } from "react";
import { CustomizationButton } from "@/components/molecules/customization/customization-button";
import { CustomizationManager } from "@/components/organisms/customization/customization-manager";
import { NotificationToast } from "@/components/molecules/shared/notification-toast";
import { useTerminalContext } from "@/lib/context/terminal-context";

/**
 * Customization toolbar organism component managing terminal preference controls.
 *
 * Houses the customization action trigger button, modal customization dialog manager,
 * and context notification toasts. Listens to custom window `"terminal:open-customization"` events
 * to open the customization drawer programmatically via terminal commands or keyboard shortcuts.
 *
 * @returns {JSX.Element} The rendered toolbar buttons, dialog manager, and notification toast elements.
 */
export function TerminalCustomizationToolbar(): JSX.Element {
  const { notification, clearNotification } = useTerminalContext();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    /**
     * Event listener callback to open the customization manager modal.
     * @returns {void}
     */
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("terminal:open-customization", handleOpenEvent);
    return () =>
      window.removeEventListener(
        "terminal:open-customization",
        handleOpenEvent,
      );
  }, []);

  return (
    <>
      <div
        id="customization"
        tabIndex={-1}
      >
        <CustomizationButton />
      </div>

      <CustomizationManager
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </>
  );
}
