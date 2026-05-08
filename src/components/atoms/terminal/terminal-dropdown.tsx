"use client";

import { useState, useRef, useEffect, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

export interface DropdownOption {
  label: string;
  value: string;
}

interface TerminalDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function TerminalDropdown({
  options,
  value,
  onChange,
  className = "",
  disabled = false,
}: TerminalDropdownProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const { isReducedMotion } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Re-render when theme changes to ensure all styles are correct
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [theme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      key={`terminal-dropdown-${theme}-${renderKey}`}
      className={`relative inline-block w-full sm:w-auto ${className}`}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-3 py-2 rounded border text-sm font-medium
          focus:outline-none focus:ring-1 transition-all duration-200
          ${!isReducedMotion && !disabled ? "hover:scale-[1.02]" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        style={{
          backgroundColor: `${themeConfig.colors.muted}20`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.text,
          boxShadow: isOpen ? `0 0 0 1px ${themeConfig.colors.accent}` : "none",
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate mr-2 font-mono">{selectedOption?.label}</span>
        <span
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: themeConfig.colors.accent }}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          className={`
            absolute left-0 right-0 z-100 mt-1 border rounded shadow-2xl overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-200
          `}
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(option.value);
                  }
                }}
                tabIndex={0}
                className={`
                  px-3 py-2 text-sm cursor-pointer transition-colors font-mono
                  focus:outline-none focus:ring-1
                  ${option.value === value ? "font-bold" : ""}
                `}
                style={{
                  backgroundColor:
                    option.value === value
                      ? `${themeConfig.colors.accent}20`
                      : "transparent",
                  color:
                    option.value === value
                      ? themeConfig.colors.accent
                      : themeConfig.colors.text,
                }}
                onMouseEnter={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = `${themeConfig.colors.accent}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                role="option"
                aria-selected={option.value === value}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.value === value && (
                    <span style={{ color: themeConfig.colors.accent }}>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
