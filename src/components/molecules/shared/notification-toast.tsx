"use client";

import { type JSX, useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";

/**
 * Props for the NotificationToast component.
 */
interface NotificationToastProps {
  /**
   * The notification message string displayed in the toast body.
   */
  message: string;
  /**
   * The semantic severity type of the toast notification.
   */
  type: "info" | "success" | "warning" | "error";
  /**
   * Auto-dismiss delay in milliseconds. Set to 0 to disable automatic dismissal.
   * @defaultValue 4000
   */
  duration?: number;
  /**
   * Callback function executed when the toast is closed or dismisses.
   */
  onClose: () => void;
  /**
   * Controlled visibility boolean for the toast.
   * @defaultValue true
   */
  visible?: boolean;
}

/**
 * NotificationToast component renders a floating banner for alert messages and action feedback.
 *
 * Positions in the top-right corner with slide-in animations, auto-dismiss timers,
 * manual dismiss buttons, and theme-synchronized alert color schemes.
 *
 * @param props - Component configuration props.
 * @param props.message - Text message to present to the user.
 * @param props.type - Severity type ('info' | 'success' | 'warning' | 'error').
 * @param props.visible - Whether the toast is actively visible.
 * @param props.onClose - Callback triggered after toast closure animation.
 * @param props.duration - Auto-dismiss timeout in milliseconds.
 * @returns A floating alert toast element or null if not visible.
 */
export function NotificationToast({
  message,
  type,
  visible = true,
  onClose,
  duration = 4000,
}: NotificationToastProps): JSX.Element | null {
  const { themeConfig, theme } = useTheme();
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  /**
   * Computes background, text, icon, and border styling according to notification type and active theme.
   *
   * @returns An object containing style definitions and icon representation for the notification type.
   */
  const getTypeStyles = () => {
    const colors = themeConfig?.colors;

    if (!colors) {
      return {
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        icon: "ℹ️",
        borderColor: "#4f46e5",
      };
    }

    switch (type) {
      case "success":
        return {
          backgroundColor: colors.success || colors.accent,
          color: colors.bg,
          icon: "",
          borderColor: colors.success || colors.accent,
        };
      case "error":
        return {
          backgroundColor: colors.error || "#ff4444",
          color: colors.bg,
          icon: "",
          borderColor: colors.error || "#ff4444",
        };
      case "warning":
        return {
          backgroundColor: colors.warning || "#f5a623",
          color: colors.bg,
          icon: "️",
          borderColor: colors.warning || "#f5a623",
        };
      case "info":
      default:
        return {
          backgroundColor: colors.info || colors.accent,
          color: colors.bg,
          icon: "ℹ️",
          borderColor: colors.info || colors.accent,
        };
    }
  };

  const typeStyles = getTypeStyles();

  /**
   * Initiates the exit animation and triggers the onClose callback after transition ends.
   */
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      key={`notification-toast-${theme}`}
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out max-w-sm
        ${
          isVisible
            ? "opacity-100 translate-x-0 animate-in slide-in-from-right"
            : "opacity-0 translate-x-full animate-out slide-out-to-right"
        }
      `}
      style={{
        backgroundColor: `${typeStyles.backgroundColor}dd`,
        color: typeStyles.color,
        border: `1px solid ${typeStyles.borderColor}`,
        boxShadow: `0 8px 32px ${typeStyles.backgroundColor}40`,
      }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-3">
        <span
          className="text-lg shrink-0"
          aria-hidden="true"
          role="img"
        >
          {typeStyles.icon}
        </span>
        <div className="flex-1">
          <p
            className="text-sm font-medium leading-5"
            style={{ color: typeStyles.color }}
          >
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className={`
            opacity-70 hover:opacity-100 transition-all duration-200
            p-1 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50
            hover:scale-110 focus:scale-110
          `}
          style={{
            color: typeStyles.color,
          }}
          aria-label="Close notification"
          type="button"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}
