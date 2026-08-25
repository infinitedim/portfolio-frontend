"use client";

import { type JSX } from "react";
import { ProjectsEditor } from "@/components/molecules/admin/projects-editor";
import { useTheme } from "@/hooks/use-theme";

/**
 * Administrator projects management page component.
 *
 * Hosts the {@link ProjectsEditor} molecule to provide full CRUD capabilities
 * over showcase projects, including technology tags, SLA badges, live demos, and source code links.
 *
 * @returns {JSX.Element} The rendered admin projects editor page.
 */
export default function AdminProjectsPage(): JSX.Element {
  const { themeConfig } = useTheme();

  return (
    <div className="max-w-7xl mx-auto">
      <ProjectsEditor themeConfig={themeConfig} />
    </div>
  );
}
