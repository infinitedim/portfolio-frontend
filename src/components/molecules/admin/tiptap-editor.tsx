"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import { useEffect, useCallback } from "react";
import type { ThemeConfig } from "@/types/theme";
import { slugifyHeading } from "@/lib/blog/html-headings";

export interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  themeConfig: ThemeConfig;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string | null>;
  minHeight?: string;
}

const HeadingWithIds = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level as number;
    const text = node.textContent;
    const id = slugifyHeading(text) || `heading-${level}`;
    return [`h${level}`, { ...HTMLAttributes, id }, 0];
  },
});

export function TiptapEditor({
  value,
  onChange,
  themeConfig,
  placeholder = "Write your post…",
  onImageUpload,
  minHeight = "320px",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      HeadingWithIds.configure({ levels: [2, 3] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none px-3 py-2",
        style: `min-height: ${minHeight}; color: ${themeConfig.colors.text}`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== editor.getText()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const handleImage = useCallback(async () => {
    if (!editor || !onImageUpload) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await onImageUpload(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  if (!editor) {
    return (
      <div
        className="rounded border p-4 text-sm font-mono opacity-60"
        style={{ borderColor: themeConfig.colors.border }}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className="rounded border overflow-hidden"
      style={{ borderColor: themeConfig.colors.border }}
    >
      <div
        className="flex flex-wrap gap-1 p-2 border-b text-xs font-mono"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.border}20`,
        }}
      >
        <ToolbarButton
          label="B"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          themeConfig={themeConfig}
        />
        <ToolbarButton
          label="I"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          themeConfig={themeConfig}
        />
        <ToolbarButton
          label="H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          themeConfig={themeConfig}
        />
        <ToolbarButton
          label="H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          themeConfig={themeConfig}
        />
        <ToolbarButton
          label="• List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          themeConfig={themeConfig}
        />
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          themeConfig={themeConfig}
        />
        {onImageUpload && (
          <ToolbarButton
            label="Image"
            active={false}
            onClick={handleImage}
            themeConfig={themeConfig}
          />
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  themeConfig,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  themeConfig: ThemeConfig;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 rounded"
      style={{
        backgroundColor: active
          ? `${themeConfig.colors.accent}30`
          : "transparent",
        color: active ? themeConfig.colors.accent : themeConfig.colors.text,
        border: `1px solid ${themeConfig.colors.border}`,
      }}
    >
      {label}
    </button>
  );
}
