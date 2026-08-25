"use client";

import { useTheme } from "@/hooks/use-theme";
import { type JSX, useMemo } from "react";

/**
 * Props for the SkipToContent component.
 *
 * @interface SkipToContentProps
 * @property {string} [targetId] - The DOM element ID to focus and scroll into view when activated.
 * @property {string} [className] - Optional additional CSS class names for styling overrides.
 */
interface SkipToContentProps {
  targetId?: string;
  className?: string;
}

/**
 * Accessible skip-to-content navigation link component.
 *
 * Remains visually hidden off-screen (`sr-only`) until focused via keyboard navigation (`Tab`),
 * allowing screen reader users and keyboard navigators to bypass repetitive header navigation
 * and immediately jump focus and scroll to the primary content area.
 *
 * @param {SkipToContentProps} props - Component properties.
 * @param {string} [props.targetId] - Destination element ID to receive focus.
 * @param {string} [props.className] - Additional custom classes.
 * @returns {JSX.Element} The accessible skip link anchor tag.
 */
export function SkipToContent({
  targetId = "main-content",
  className = "",
}: SkipToContentProps): JSX.Element {
  const { themeConfig, mounted } = useTheme();

  const resolvedTheme = useMemo(
    () => ({
      backgroundColor: (mounted && themeConfig?.colors?.accent) || "#0284c7",
      color: (mounted && themeConfig?.colors?.bg) || "#ffffff",
      borderColor: (mounted && themeConfig?.colors?.border) || "#1e293b",
    }),
    [
      mounted,
      themeConfig?.colors?.accent,
      themeConfig?.colors?.bg,
      themeConfig?.colors?.border,
    ],
  );

  /**
   * Handles keyboard activation (Enter or Space) to shift focus and scroll to the target element.
   *
   * @param {React.KeyboardEvent<HTMLAnchorElement>} e - Keyboard event triggered on the anchor.
   * @returns {void}
   */
  const handleSkip = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  /**
   * Handles mouse click activation to shift focus and scroll to the target element.
   *
   * @param {React.MouseEvent<HTMLAnchorElement>} e - Mouse click event triggered on the anchor.
   * @returns {void}
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!mounted) {
    return (
      <a
        href={`#${targetId}`}
        className={`sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-100 px-4 py-2 rounded shadow-lg transition-all duration-200 font-mono text-sm ${className}`}
        style={{
          backgroundColor: "#0284c7",
          color: "#ffffff",
          border: "2px solid #1e293b",
        }}
        onClick={handleClick}
        onKeyDown={handleSkip}
        aria-label="Skip to main terminal content"
      >
        Skip to terminal
      </a>
    );
  }

  return (
    <a
      href={`#${targetId}`}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4 focus:z-100 px-4 py-2 rounded shadow-lg transition-all duration-200 font-mono text-sm ${className}`}
      style={{
        backgroundColor: resolvedTheme.backgroundColor,
        color: resolvedTheme.color,
        border: `2px solid ${resolvedTheme.borderColor}`,
      }}
      onClick={handleClick}
      onKeyDown={handleSkip}
      aria-label="Skip to main terminal content"
    >
      Skip to terminal
    </a>
  );
}

/**
 * Props for the SkipLinks component.
 *
 * @interface SkipLinksProps
 * @property {Array<{ id: string; label: string; icon?: string }>} links - Array of skip link items with element target ID, label text, and optional icon string.
 */
interface SkipLinksProps {
  links: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
}

/**
 * Accessible multi-target skip navigation bar component.
 *
 * Groups multiple landmark skip anchors inside a `<nav>` container that reveals when
 * any child anchor receives keyboard focus (`focus-within:not-sr-only`).
 *
 * @param {SkipLinksProps} props - Component properties.
 * @param {Array<{ id: string; label: string; icon?: string }>} props.links - Collection of skip navigation destinations.
 * @returns {JSX.Element} The rendered skip navigation container.
 */
export function SkipLinks({ links }: SkipLinksProps): JSX.Element {
  const { themeConfig, mounted } = useTheme();

  const resolvedTheme = useMemo(
    () => ({
      backgroundColor: (mounted && themeConfig?.colors?.accent) || "#0284c7",
      color: (mounted && themeConfig?.colors?.bg) || "#ffffff",
    }),
    [mounted, themeConfig?.colors?.accent, themeConfig?.colors?.bg],
  );

  /**
   * Programmatically focuses and smoothly scrolls the viewport to a specified DOM element.
   *
   * @param {string} targetId - ID attribute of the destination element.
   * @returns {void}
   */
  const handleSkipTo = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const baseStyles = {
    nav: "sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-16 focus-within:left-4 focus-within:z-[100]",
    link: "block px-4 py-2 mb-2 rounded shadow-lg transition-all duration-200 font-mono text-sm hover:opacity-80 focus:outline-none focus:ring-2",
  };

  const linkStyle = {
    backgroundColor: resolvedTheme.backgroundColor,
    color: resolvedTheme.color,
  };

  return (
    <nav
      className={baseStyles.nav}
      aria-label="Skip to content links"
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={baseStyles.link}
          style={linkStyle}
          onClick={(e) => {
            e.preventDefault();
            handleSkipTo(link.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSkipTo(link.id);
            }
          }}
        >
          {link.icon} {link.label}
        </a>
      ))}
    </nav>
  );
}

