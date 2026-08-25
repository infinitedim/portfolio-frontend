"use client";

import { useRef, useCallback, useState, type JSX } from "react";
import type { ThemeConfig } from "@/types/theme";
import { BlogContent } from "@/components/molecules/blog/blog-content";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

/**
 * Props for the {@link CustomEditor} component.
 *
 * @interface CustomEditorProps
 * @property {string} value - The current markdown/MDX string content being edited.
 * @property {(value: string) => void} onChange - Callback invoked whenever the editor content changes.
 * @property {ThemeConfig} themeConfig - Theme configuration object containing color schemes and styling rules.
 * @property {string} [placeholder="Write your article or MDX content here..."] - Placeholder text displayed when the textarea is empty.
 * @property {(file: File) => Promise<string | null>} [onImageUpload] - Optional async handler to upload an image file and return its hosted URL.
 * @property {string} [minHeight="400px"] - Minimum height for the editor and preview containers.
 */
export interface CustomEditorProps {
  value: string;
  onChange: (value: string) => void;
  themeConfig: ThemeConfig;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string | null>;
  minHeight?: string;
}

/**
 * A custom rich Markdown and MDX editor component featuring a formatting toolbar,
 * image upload integration, link insertion modal, and side-by-side live HTML/MDX preview.
 *
 * @component
 * @param {CustomEditorProps} props - Properties configuring the custom editor.
 * @returns {JSX.Element} The rendered Markdown/MDX editor with toolbar and preview tabs.
 */
export function CustomEditor({
  value,
  onChange,
  themeConfig,
  placeholder = "Write your article or MDX content here...",
  onImageUpload,
  minHeight = "400px",
}: CustomEditorProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://infinitedim.dev");
  const [linkText, setLinkText] = useState("");

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("https://");

  /**
   * Applies prefix and suffix formatting delimiters around selected text, or inserts default placeholder text.
   *
   * @param {string} prefix - Delimiter to prepend before the selection or inserted text.
   * @param {string} [suffix=""] - Delimiter to append after the selection or inserted text.
   * @param {string} [defaultText=""] - Default fallback text to insert when no text is currently selected.
   * @returns {void}
   */
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
        const textToInsert = defaultText || "text";
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

  /**
   * Transforms the current line at the cursor into a Markdown heading of specified level.
   *
   * @param {1 | 2 | 3} level - Heading level corresponding to the number of '#' characters (H1, H2, or H3).
   * @returns {void}
   */
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

  /**
   * Prepends a line prefix (such as bullet, numbered list, or blockquote) to the current line.
   *
   * @param {string} prefix - The prefix string to add at the beginning of the active line.
   * @returns {void}
   */
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

  /**
   * Opens the hyperlink insertion dialog, pre-populating display text with current cursor selection.
   *
   * @returns {void}
   */
  const openLinkDialog = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      setLinkText(selected || "Link Text");
    }
    setLinkDialogOpen(true);
  }, [value]);

  /**
   * Inserts the configured hyperlink into the editor at cursor position and closes the link dialog.
   *
   * @returns {void}
   */
  const confirmInsertLink = () => {
    if (!linkUrl) return;
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;

    const replacement = `[${linkText || "Link Text"}](${linkUrl})`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setLinkDialogOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
    });
  };

  /**
   * Handles user click on image action button, triggering file picker or URL dialog.
   *
   * @returns {void}
   */
  const handleImageClick = useCallback(() => {
    if (onImageUpload && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setImageDialogOpen(true);
    }
  }, [onImageUpload]);

  /**
   * Inserts Markdown image syntax with the specified image URL and closes the image dialog.
   *
   * @returns {void}
   */
  const confirmInsertImage = () => {
    if (!imageUrl) return;
    applyFormatting("![Image Description](", ")", imageUrl);
    setImageDialogOpen(false);
  };

  /**
   * Handles file input change event to upload an image and insert markdown image tag with resulting URL.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event from the hidden file input element.
   * @returns {Promise<void>} Resolves when the file upload and text insertion completes.
   */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;

      setIsUploading(true);
      try {
        const url = await onImageUpload(file);
        if (url) {
          applyFormatting(`![${file.name}](`, ")", url);
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

  /**
   * Inserts predefined MDX template snippets (callouts, code blocks, expandable details) at cursor position.
   *
   * @param {"callout" | "codeblock" | "details"} type - The MDX snippet template type to inject.
   * @returns {void}
   */
  const insertMdxSnippet = useCallback(
    (type: "callout" | "codeblock" | "details") => {
      let snippet = "";
      if (type === "callout") {
        snippet = `\n<Callout type="info">\n  Write important MDX note here...\n</Callout>\n`;
      } else if (type === "codeblock") {
        snippet = `\n\`\`\`tsx\n// TSX / React code example\nconsole.log("Hello MDX");\n\`\`\`\n`;
      } else if (type === "details") {
        snippet = `\n<details>\n  <summary>Click to expand details</summary>\n  Hidden content here...\n</details>\n`;
      }

      applyFormatting(snippet);
    },
    [applyFormatting],
  );

  /**
   * Intercepts keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, Tab) to apply corresponding Markdown formatting.
   *
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - Keyboard event triggered from the textarea.
   * @returns {void}
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyFormatting("**", "**", "bold text");
      } else if (isMod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyFormatting("*", "*", "italic text");
      } else if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openLinkDialog();
      } else if (e.key === "Tab") {
        e.preventDefault();
        applyFormatting("  ");
      }
    },
    [applyFormatting, openLinkDialog],
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
            title="Heading 1 (#)"
            icon={<Heading1 size={14} />}
            onClick={() => applyHeading(1)}
            themeConfig={themeConfig}
            ariaLabel="Insert Heading 1"
          />
          <ToolbarButton
            title="Heading 2 (##)"
            icon={<Heading2 size={14} />}
            onClick={() => applyHeading(2)}
            themeConfig={themeConfig}
            ariaLabel="Insert Heading 2"
          />
          <ToolbarButton
            title="Heading 3 (###)"
            icon={<Heading3 size={14} />}
            onClick={() => applyHeading(3)}
            themeConfig={themeConfig}
            ariaLabel="Insert Heading 3"
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Bold Text (Ctrl+B)"
            icon={<Bold size={14} />}
            onClick={() => applyFormatting("**", "**", "bold text")}
            themeConfig={themeConfig}
            ariaLabel="Bold Text"
          />
          <ToolbarButton
            title="Italic Text (Ctrl+I)"
            icon={<Italic size={14} />}
            onClick={() => applyFormatting("*", "*", "italic text")}
            themeConfig={themeConfig}
            ariaLabel="Italic Text"
          />
          <ToolbarButton
            title="Inline Code (`code`)"
            icon={<Code size={14} />}
            onClick={() => applyFormatting("`", "`", "code")}
            themeConfig={themeConfig}
            ariaLabel="Inline Code"
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
            ariaLabel="Bullet List"
          />
          <ToolbarButton
            title="Numbered List (1.)"
            icon={<ListOrdered size={14} />}
            onClick={() => applyBlockPrefix("1. ")}
            themeConfig={themeConfig}
            ariaLabel="Numbered List"
          />
          <ToolbarButton
            title="Blockquote (>)"
            icon={<Quote size={14} />}
            onClick={() => applyBlockPrefix("> ")}
            themeConfig={themeConfig}
            ariaLabel="Blockquote"
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Hyperlink (Ctrl+K)"
            icon={<LinkIcon size={14} />}
            onClick={openLinkDialog}
            themeConfig={themeConfig}
            ariaLabel="Insert Link"
          />
          <ToolbarButton
            title={isUploading ? "Uploading Image..." : "Insert Image"}
            icon={<ImageIcon size={14} />}
            onClick={handleImageClick}
            themeConfig={themeConfig}
            disabled={isUploading}
            ariaLabel="Insert Image"
          />

          <div
            className="h-4 w-px mx-1 opacity-20"
            style={{ backgroundColor: themeConfig.colors.text }}
          />

          <ToolbarButton
            title="Insert MDX Callout Component"
            label="MDX Callout"
            icon={<Sparkles size={13} className="text-amber-400" />}
            onClick={() => insertMdxSnippet("callout")}
            themeConfig={themeConfig}
            ariaLabel="Insert MDX Callout"
          />
          <ToolbarButton
            title="Insert MDX Code Block"
            icon={<FileCode2 size={14} />}
            onClick={() => insertMdxSnippet("codeblock")}
            themeConfig={themeConfig}
            ariaLabel="Insert MDX Code Block"
          />
        </div>

        <div className="flex items-center gap-1 rounded bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === "edit" ? "font-bold" : "opacity-70 hover:opacity-100"
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
              activeTab === "preview" ? "font-bold" : "opacity-70 hover:opacity-100"
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
            html={value || "<p>No content available to preview...</p>"}
          />
        </div>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Hyperlink</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="link-text">Display Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link Text"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-url">URL Destination</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="terminal" size="sm" onClick={confirmInsertLink}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="img-url">Image Resource URL</Label>
              <Input
                id="img-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="terminal" size="sm" onClick={confirmInsertImage}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Props for the {@link ToolbarButton} component.
 *
 * @interface ToolbarButtonProps
 * @property {string} title - Tooltip title text displayed on hover.
 * @property {JSX.Element} [icon] - Icon element rendered inside the button.
 * @property {string} [label] - Optional text label rendered alongside the icon.
 * @property {() => void} onClick - Callback triggered when the button is clicked or activated.
 * @property {ThemeConfig} themeConfig - Active theme configuration for styling borders and text colors.
 * @property {boolean} [disabled=false] - Whether the button is disabled.
 * @property {string} [ariaLabel] - Accessible label for screen readers. Defaults to title if not provided.
 */
interface ToolbarButtonProps {
  title: string;
  icon?: JSX.Element;
  label?: string;
  onClick: () => void;
  themeConfig: ThemeConfig;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Reusable action button component rendered inside the Markdown editor toolbar.
 *
 * @component
 * @param {ToolbarButtonProps} props - Properties configuring the toolbar button.
 * @returns {JSX.Element} The rendered toolbar button element.
 */
function ToolbarButton({
  title,
  icon,
  label,
  onClick,
  themeConfig,
  disabled = false,
  ariaLabel,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel || title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors disabled:opacity-40 hover:bg-(--terminal-accent)/10 hover:text-(--terminal-accent)"
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
