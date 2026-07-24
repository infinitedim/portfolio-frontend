"use client";

import { useRef, useCallback, useState, type JSX } from "react";
import type { ThemeConfig } from "@/types/theme";
import { BlogContent } from "@/components/molecules/blog/blog-content";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote,
  FileCode2,
  Sparkles,
  Eye,
  Edit3,
} from "lucide-react";

export interface CustomEditorProps {
  value: string;
  onChange: (value: string) => void;
  themeConfig: ThemeConfig;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string | null>;
  minHeight?: string;
}

export function CustomEditor({
  value,
  onChange,
  themeConfig,
  placeholder = "Tulis artikel atau konten MDX di sini…",
  onImageUpload,
  minHeight = "400px",
}: CustomEditorProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);

  const applyFormatting = useCallback(
    (prefix: string, suffix: string = "", defaultText: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);

      let replacement: string;
      let newSelectionStart = start;
      let newSelectionEnd = end;

      if (selected.length > 0) {
        replacement = `${prefix}${selected}${suffix}`;
        newSelectionStart = start;
        newSelectionEnd = start + replacement.length;
      } else {
        const textToInsert = defaultText || "teks";
        replacement = `${prefix}${textToInsert}${suffix}`;
        newSelectionStart = start + prefix.length;
        newSelectionEnd = newSelectionStart + textToInsert.length;
      }

      const newValue =
        value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
      });
    },
    [value, onChange],
  );

  const applyHeading = useCallback(
    (level: 1 | 2 | 3) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      let lineEnd = value.indexOf("\n", start);
      if (lineEnd === -1) lineEnd = value.length;

      const line = value.substring(lineStart, lineEnd);
      const cleanLine = line.replace(/^(#{1,3}\s*)/, "");
      const hashes = "#".repeat(level);
      const newLine = `${hashes} ${cleanLine}`;

      const newValue =
        value.substring(0, lineStart) + newLine + value.substring(lineEnd);
      onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = lineStart + newLine.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [value, onChange],
  );

  const applyBlockPrefix = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      let lineEnd = value.indexOf("\n", start);
      if (lineEnd === -1) lineEnd = value.length;

      const line = value.substring(lineStart, lineEnd);
      const newLine = line.startsWith(prefix) ? line : `${prefix}${line}`;

      const newValue =
        value.substring(0, lineStart) + newLine + value.substring(lineEnd);
      onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = lineStart + newLine.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [value, onChange],
  );

  const applyLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);

    const url = window.prompt("Masukkan URL Link:", "https://infinitedim.dev");
    if (!url) return;

    const linkText = selected.length > 0 ? selected : "Nama Link";
    const replacement = `[${linkText}](${url})`;

    const newValue =
      value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [value, onChange]);

  const handleImageClick = useCallback(() => {
    if (onImageUpload && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      const url = window.prompt("Masukkan URL Gambar:", "https://");
      if (!url) return;
      applyFormatting("![Deskripsi Gambar](", ")", url);
    }
  }, [onImageUpload, applyFormatting]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;

      setIsUploading(true);
      try {
        const imageUrl = await onImageUpload(file);
        if (imageUrl) {
          applyFormatting(`![${file.name}](`, ")", imageUrl);
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onImageUpload, applyFormatting],
  );

  const insertMdxSnippet = useCallback(
    (type: "callout" | "codeblock" | "details") => {
      let snippet = "";
      if (type === "callout") {
        snippet = `\n<Callout type="info">\n  Tulis catatan penting MDX di sini...\n</Callout>\n`;
      } else if (type === "codeblock") {
        snippet = `\n\`\`\`tsx\n// Kode TSX / React di sini\nconsole.log("Hello MDX");\n\`\`\`\n`;
      } else if (type === "details") {
        snippet = `\n<details>\n  <summary>Klik untuk membuka detail</summary>\n  Konten tersembunyi...\n</details>\n`;
      }

      applyFormatting(snippet);
    },
    [applyFormatting],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyFormatting("**", "**", "teks tebal");
      } else if (isMod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyFormatting("*", "*", "teks miring");
      } else if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        applyLink();
      } else if (e.key === "Tab") {
        e.preventDefault();
        applyFormatting("  ");
      }
    },
    [applyFormatting, applyLink],
  );

  return (
    <div
      className="rounded-lg border overflow-hidden transition-colors"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: themeConfig.colors.bg ?? "transparent",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className="flex flex-wrap items-center justify-between gap-2 p-2 border-b text-xs font-mono select-none"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.border}20`,
        }}
      >
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            title="Judul Utama H1 (#)"
            icon={<Heading1 size={14} />}
            onClick={() => applyHeading(1)}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Sub Judul H2 (##)"
            icon={<Heading2 size={14} />}
            onClick={() => applyHeading(2)}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Sub Bagian H3 (###)"
            icon={<Heading3 size={14} />}
            onClick={() => applyHeading(3)}
            themeConfig={themeConfig}
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Teks Tebal (Ctrl+B)"
            icon={<Bold size={14} />}
            onClick={() => applyFormatting("**", "**", "teks tebal")}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Teks Miring (Ctrl+I)"
            icon={<Italic size={14} />}
            onClick={() => applyFormatting("*", "*", "teks miring")}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Kode Inline (`code`)"
            icon={<Code size={14} />}
            onClick={() => applyFormatting("`", "`", "kode")}
            themeConfig={themeConfig}
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Bullet List (-)"
            icon={<List size={14} />}
            onClick={() => applyBlockPrefix("- ")}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Numbered List (1.)"
            icon={<ListOrdered size={14} />}
            onClick={() => applyBlockPrefix("1. ")}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Kutipan Quote (>)"
            icon={<Quote size={14} />}
            onClick={() => applyBlockPrefix("> ")}
            themeConfig={themeConfig}
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Tautan Link (Ctrl+K)"
            icon={<LinkIcon size={14} />}
            onClick={applyLink}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title={isUploading ? "Mengunggah Gambar…" : "Sisipkan Gambar"}
            icon={<ImageIcon size={14} />}
            onClick={handleImageClick}
            themeConfig={themeConfig}
            disabled={isUploading}
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Sisipkan Komponen MDX Callout"
            label="MDX Callout"
            icon={
              <Sparkles
                size={13}
                className="text-amber-400"
              />
            }
            onClick={() => insertMdxSnippet("callout")}
            themeConfig={themeConfig}
          />
          <ToolbarButton
            title="Sisipkan MDX Code Block"
            icon={<FileCode2 size={14} />}
            onClick={() => insertMdxSnippet("codeblock")}
            themeConfig={themeConfig}
          />
        </div>

        <div className="flex items-center gap-1 rounded bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === "edit"
                ? "font-bold"
                : "opacity-70 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "edit"
                  ? `${themeConfig.colors.accent}30`
                  : "transparent",
              color:
                activeTab === "edit"
                  ? themeConfig.colors.accent
                  : themeConfig.colors.text,
            }}
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === "preview"
                ? "font-bold"
                : "opacity-70 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "preview"
                  ? `${themeConfig.colors.accent}30`
                  : "transparent",
              color:
                activeTab === "preview"
                  ? themeConfig.colors.accent
                  : themeConfig.colors.text,
            }}
          >
            <Eye size={13} /> Live Preview
          </button>
        </div>
      </div>

      {activeTab === "edit" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-4 font-mono text-sm leading-relaxed bg-transparent focus:outline-none resize-y"
          style={{
            minHeight,
            color: themeConfig.colors.text,
          }}
        />
      ) : (
        <div
          className="p-6 overflow-y-auto prose prose-invert max-w-none"
          style={{ minHeight, color: themeConfig.colors.text }}
        >
          <BlogContent
            html={value || "<p>Belum ada konten untuk dipreview...</p>"}
          />
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  title,
  icon,
  label,
  onClick,
  themeConfig,
  disabled = false,
}: {
  title: string;
  icon?: JSX.Element;
  label?: string;
  onClick: () => void;
  themeConfig: ThemeConfig;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors disabled:opacity-40"
      style={{
        border: `1px solid ${themeConfig.colors.border}40`,
        color: themeConfig.colors.text,
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
