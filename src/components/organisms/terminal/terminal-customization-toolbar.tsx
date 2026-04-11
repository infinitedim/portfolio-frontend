/**
 * @fileoverview TerminalCustomizationToolbar
 *
 * Renders the floating customization button, the full CustomizationManager
 * modal, and the active toast notification (if any).
 *
 * @description
 * Local `isCustomizationOpen` state is managed here since it is purely UI
 * state that no other component needs. Notification state is read from context.
 *
 * @example
 * ```tsx
 * <TerminalCustomizationToolbar />
 * ```
 *
 * @dependencies
 * - useTerminalContext – notification, clearNotification
 * - CustomizationButton
 * - CustomizationManager
 * - NotificationToast
 */

"use client";

import { useState, useEffect, type JSX } from "react";
import { CustomizationButton } from "@/components/molecules/customization/customization-button";
import { CustomizationManager } from "@/components/organisms/customization/customization-manager";
import { NotificationToast } from "@/components/molecules/shared/notification-toast";
import { useTerminalContext } from "@/lib/context/terminal-context";

/**
 * TerminalCustomizationToolbar
 *
 * Contains the floating "customize" button, the slide-in customization
 * manager panel, and the toast notification that appears after terminal
 * events (theme change, font change, etc.).
 */
export function TerminalCustomizationToolbar(): JSX.Element {
  const { notification, clearNotification } = useTerminalContext();

  const [isOpen, setIsOpen] = useState(false);

  /**
   * Listen for the imperative event dispatched by handleSubmit when the
   * `customize` command is typed. This keeps the open-state out of context
   * while still allowing the command to trigger the UI.
   */
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("terminal:open-customization", handleOpenEvent);
    return () => window.removeEventListener("terminal:open-customization", handleOpenEvent);
  }, []);

  return (
    <>
      {/* Floating customization button */}
      <div id="customization" tabIndex={-1}>
        <CustomizationButton />
      </div>

      {/* Full customization manager panel */}
      <CustomizationManager
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* Toast notification */}
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
