"use client";

import { type JSX } from "react";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { BlogEditor } from "@/components/molecules/admin/blog-editor";
import { useTheme } from "@/hooks/use-theme";

/**
 * Admin blog management page component.
 *
 * @description
 * Serves as the primary admin interface for creating, editing, categorizing, and publishing
 * blog articles. Protected by {@link ProtectedRoute} to ensure only authenticated administrators
 * can access the {@link BlogEditor} within a styled terminal themed container.
 *
 * @returns {JSX.Element} The rendered admin blog editor view wrapped in authentication guard.
 */
export default function AdminBlogPage(): JSX.Element {
  const { themeConfig } = useTheme();

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
        <TerminalHeader />
        <div className="flex-1 p-4">
          <BlogEditor themeConfig={themeConfig} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
