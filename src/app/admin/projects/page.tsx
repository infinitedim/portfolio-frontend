"use client";

import { type JSX } from "react";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { ProjectsEditor } from "@/components/molecules/admin/projects-editor";
import { useTheme } from "@/hooks/use-theme";

export default function AdminProjectsPage(): JSX.Element {
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
          <ProjectsEditor themeConfig={themeConfig} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
