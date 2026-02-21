"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="w-full border border-gray-700 rounded-lg bg-gray-900 animate-pulse flex items-center justify-center" style={{ minHeight: 500 }}>
      <span className="text-sm text-gray-500">Loading editor...</span>
    </div>
  ),
});

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  previewMode?: "edit" | "live" | "preview";
  onSave?: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  height = 500,
  previewMode = "live",
  onSave,
}: MarkdownEditorProps) {
  const [colorMode, setColorMode] = useState<"light" | "dark">("dark");

  // Detect theme from document
  useEffect(() => {
    const detectTheme = () => {
      if (typeof document === "undefined") return;
      const html = document.documentElement;
      const isDark =
        html.classList.contains("dark") ||
        html.getAttribute("data-theme") === "dark" ||
        html.style.colorScheme === "dark" ||
        // Default to dark for our terminal-themed portfolio
        !html.classList.contains("light");
      setColorMode(isDark ? "dark" : "light");
    };

    detectTheme();

    // Observe class changes on html element
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    return () => observer.disconnect();
  }, []);

  // Ctrl+S handler
  useEffect(() => {
    if (!onSave) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  const handleChange = useCallback(
    (val?: string) => {
      onChange(val ?? "");
    },
    [onChange],
  );

  return (
    <div data-color-mode={colorMode} className="rounded-lg overflow-hidden border border-gray-700">
      <MDEditor
        value={value}
        onChange={handleChange}
        preview={previewMode}
        height={height}
        textareaProps={{
          placeholder,
        }}
        visibleDragbar={false}
      />
    </div>
  );
}
