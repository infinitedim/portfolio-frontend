"use client";

import { type JSX } from "react";
import { ProjectsEditor } from "@/components/molecules/admin/projects-editor";
import { useTheme } from "@/hooks/use-theme";

export default function AdminProjectsPage(): JSX.Element {
  const { themeConfig } = useTheme();

  return (
    <div className="max-w-7xl mx-auto">
      <ProjectsEditor themeConfig={themeConfig} />
    </div>
  );
}
