"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import { useTerminalAnimations } from "@/hooks/use-animations";
import type { CommandOutput as CommandOutputType } from "@/types/terminal";
import type { JSX } from "react";

/**
 * Properties for the CommandOutput component.
 *
 * @interface CommandOutputProps
 * @property {CommandOutputType} output - The terminal command output data object to render.
 */
interface CommandOutputProps {
  output: CommandOutputType;
}

/**
 * Terminal output renderer component supporting typed animated text streaming,
 * multi-line formatting, custom React node rendering, theme-aware error/success styling,
 * accessible screen reader log roles, and animation skip handling.
 *
 * @param {CommandOutputProps} props - Component properties.
 * @param {CommandOutputType} props.output - Output entity containing type, id, and content payload.
 * @returns {JSX.Element} The rendered command output block.
 */
export function CommandOutput({ output }: CommandOutputProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const { isReducedMotion } = useAccessibility();
  const { animateCommandOutput } = useTerminalAnimations();
  const textRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<boolean>(false);
  const hasAnimatedRef = useRef<boolean>(false);
  const mountedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, [output.id]);

  /**
   * Resolves the theme color corresponding to the current output severity level (success, info, error, warning).
   *
   * @returns {string} Hex or rgba color string for text styling.
   */
  const getOutputColor = () => {
    switch (output.type) {
      case "success":
      case "info":
        return themeConfig.colors.accent || themeConfig.colors.success || "#00ff41";
      case "error":
        return themeConfig.colors.error || "#ff4444";
      case "warning":
        return themeConfig.colors.warning || "#ffaa00";
      default:
        return themeConfig.colors.accent || themeConfig.colors.text;
    }
  };

  /**
   * Normalizes output content into a unified newline-delimited string format.
   *
   * @param {CommandOutputType["content"]} content - Raw content payload (string, array of strings, or React component).
   * @returns {string} Serialized string representation of the output content.
   */
  const formatContent = (content: CommandOutputType["content"]): string => {
    if (typeof content === "string") {
      return content;
    } else if (Array.isArray(content)) {
      return content.join("\n");
    } else {
      return "";
    }
  };

  const isError = output.type === "error";
  const rawText = formatContent(output.content);

  /**
   * Interrupts the active typing animation to immediately reveal full text content.
   */
  const triggerSkip = useCallback(() => {
    if (!skipRef.current) {
      skipRef.current = true;
      if (textRef.current) {
        textRef.current.textContent = rawText;
        textRef.current.classList.remove("typing-cursor");
        if (typeof textRef.current.scrollIntoView === "function") {
          textRef.current.scrollIntoView({ block: "nearest", behavior: "auto" });
        }
      }
    }
  }, [rawText]);

  useEffect(() => {
    if (hasAnimatedRef.current) {
      if (textRef.current && rawText) {
        textRef.current.textContent = rawText;
        textRef.current.classList.remove("typing-cursor");
      }
      return;
    }

    skipRef.current = false;
    if (
      textRef.current &&
      rawText &&
      output.allowAnimation !== false &&
      !isReducedMotion
    ) {
      hasAnimatedRef.current = true;
      animateCommandOutput(textRef.current, rawText, skipRef);
    }
  }, [rawText, output.allowAnimation, isReducedMotion, animateCommandOutput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
                                                                           
      if (Date.now() - mountedAtRef.current < 150) {
        return;
      }
      if (e.key === "Enter" || e.key === "Escape") {
        triggerSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [triggerSkip]);

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div
      key={`command-output-${theme}`}
      className={`font-mono whitespace-pre-wrap ${!isReducedMotion ? "transition-colors duration-300" : ""}`}
      style={{
        color: getOutputColor(),
      }}
      role="log"
      aria-live={isError ? "assertive" : "polite"}
      aria-label={isError ? "Error output" : "Command output"}
      onClick={triggerSkip}
    >
      {typeof output.content === "string" || Array.isArray(output.content) ? (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div ref={textRef}>
              {isReducedMotion || output.allowAnimation === false
                ? rawText
                : ""}
            </div>
            {isError && (
              <div className="mt-2 text-sm opacity-75">
                Try typing 'help' to see available commands or 'clear' to reset
                the terminal.
              </div>
            )}
          </div>
        </div>
      ) : (
        <output.content />
      )}
    </div>
  );
}
