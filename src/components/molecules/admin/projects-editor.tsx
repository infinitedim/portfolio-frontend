"use client";

import { useState, useEffect, useCallback, type JSX } from "react";
import type { ThemeConfig } from "@/types/theme";
import { authService } from "@/lib/auth/auth-service";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { getApiUrl } from "@/lib/api/get-api-url";
import { type Project } from "@/lib/data/data-fetching";
import { Plus, Save, Trash, X, Edit } from "lucide-react";
import { toast } from "sonner";

interface ProjectsEditorProps {
  themeConfig: ThemeConfig;
}

export function ProjectsEditor({
  themeConfig,
}: ProjectsEditorProps): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<Project["status"]>("completed");
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/api/portfolio?section=projects`,
      );
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data ?? []);
      } else {
        toast.error("Failed to load projects");
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      toast.error("Network error while loading projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const generateSlug = (titleText: string, excludeId?: string): string => {
    const baseSlug = titleText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    let currentSlug = baseSlug;
    let counter = 2;

    // Check for collisions
    while (projects.some((p) => p.id === currentSlug && p.id !== excludeId)) {
      currentSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return currentSlug;
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (
      trimmed &&
      !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsNewProject(false);
    setName(project.name);
    setDescription(project.description);
    setDemoUrl(project.demoUrl || "");
    setGithubUrl(project.githubUrl || "");
    setImageUrl(project.imageUrl || "");
    setStatus(project.status);
    setFeatured(project.featured);
    setTags([...project.technologies]);
    setTagInput("");
  };

  const handleCreateNew = () => {
    const newProject: Project = {
      id: "", // Will be generated on save
      name: "",
      description: "",
      technologies: [],
      status: "completed",
      featured: false,
    };
    setEditingProject(newProject);
    setIsNewProject(true);
    setName("");
    setDescription("");
    setDemoUrl("");
    setGithubUrl("");
    setImageUrl("");
    setStatus("completed");
    setFeatured(false);
    setTags([]);
    setTagInput("");
  };

  const handleCancel = () => {
    setEditingProject(null);
    setIsNewProject(false);
  };

  const isValidUrl = (url: string) => {
    if (!url.trim()) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Project description is required");
      return;
    }
    if (demoUrl && !isValidUrl(demoUrl)) {
      toast.error("Demo URL must be a valid URL");
      return;
    }
    if (githubUrl && !isValidUrl(githubUrl)) {
      toast.error("GitHub URL must be a valid URL");
      return;
    }
    if (imageUrl && !isValidUrl(imageUrl)) {
      toast.error("Image URL must be a valid URL");
      return;
    }

    const token = authService.getAccessToken();
    if (!token) {
      toast.error("Please log in to save projects");
      return;
    }

    setIsSaving(true);
    try {
      const projectId = isNewProject ? generateSlug(name) : editingProject!.id;

      const projectToSave: Project = {
        id: projectId,
        name: name.trim(),
        description: description.trim(),
        demoUrl: demoUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        status,
        featured,
        technologies: tags,
      };

      const updatedProjects = isNewProject
        ? [...projects, projectToSave]
        : projects.map((p) => (p.id === projectId ? projectToSave : p));

      const response = await fetch(`${getApiUrl()}/api/portfolio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: "projects",
          data: updatedProjects,
        }),
      });

      if (response.ok) {
        toast.success("Project saved successfully");
        setProjects(updatedProjects);
        setEditingProject(null);
        setIsNewProject(false);
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to save project");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Network error while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (idToDelete: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;

    const token = authService.getAccessToken();
    if (!token) {
      toast.error("Please log in to delete projects");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProjects = projects.filter((p) => p.id !== idToDelete);

      const response = await fetch(`${getApiUrl()}/api/portfolio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: "projects",
          data: updatedProjects,
        }),
      });

      if (response.ok) {
        toast.success("Project deleted successfully");
        setProjects(updatedProjects);
        if (editingProject?.id === idToDelete) {
          setEditingProject(null);
          setIsNewProject(false);
        }
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Network error while deleting");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span style={{ color: themeConfig.colors.accent }}>
          Loading projects...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="p-4 border rounded flex items-center justify-between"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div className="flex items-center space-x-2">
          <span
            className="text-sm font-mono"
            style={{ color: themeConfig.colors.accent }}
          >
            editor@portfolio:~$
          </span>
          <span className="text-sm opacity-70">./manage-projects.sh</span>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={!!editingProject}
          className="px-3 py-1 text-xs border rounded transition-colors disabled:opacity-50"
          style={{
            borderColor: themeConfig.colors.accent,
            color: themeConfig.colors.accent,
          }}
        >
          <span className="flex items-center gap-1">
            <Plus size={12} /> Add Project
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List View */}
        <div
          className={`space-y-4 ${editingProject ? "lg:col-span-1" : "lg:col-span-3"}`}
        >
          {projects.length === 0 && !editingProject ? (
            <p className="opacity-70 text-sm">
              No projects found. Add one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 border rounded transition-colors"
                  style={{
                    borderColor:
                      editingProject?.id === project.id
                        ? themeConfig.colors.accent
                        : themeConfig.colors.border,
                    backgroundColor:
                      editingProject?.id === project.id
                        ? `${themeConfig.colors.accent}10`
                        : "transparent",
                  }}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-medium truncate">{project.name}</div>
                    <div className="flex items-center space-x-2 mt-1 text-xs opacity-70">
                      <span className="capitalize">{project.status}</span>
                      <span>•</span>
                      <span>{project.technologies.length} tags</span>
                      {project.featured && (
                        <>
                          <span>•</span>
                          <span style={{ color: themeConfig.colors.accent }}>
                            Featured
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-1 hover:opacity-100 opacity-70 transition-opacity"
                      aria-label="Edit project"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => void handleDelete(project.id)}
                      className="p-1 hover:opacity-100 opacity-70 transition-opacity"
                      style={{ color: themeConfig.colors.error }}
                      aria-label="Delete project"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Form */}
        {editingProject && (
          <div
            className="lg:col-span-2 p-4 border rounded bg-opacity-50"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            <div
              className="flex items-center justify-between mb-4 border-b pb-2"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <h3 className="font-semibold text-lg">
                {isNewProject ? "Add Project" : "Edit Project"}
              </h3>
              <button
                onClick={handleCancel}
                className="p-1 opacity-70 hover:opacity-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label
                    htmlFor="project-name"
                    className="block opacity-80"
                  >
                    Name *
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border rounded p-2 focus:outline-none"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="Project Name"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="project-status"
                    className="block opacity-80"
                  >
                    Status
                  </label>
                  <select
                    id="project-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as Project["status"])
                    }
                    className="w-full bg-transparent border rounded p-2 focus:outline-none"
                    style={{
                      borderColor: themeConfig.colors.border,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <option
                      value="completed"
                      className="bg-neutral-900"
                    >
                      Completed
                    </option>
                    <option
                      value="in-progress"
                      className="bg-neutral-900"
                    >
                      In Progress
                    </option>
                    <option
                      value="planned"
                      className="bg-neutral-900"
                    >
                      Planned
                    </option>
                  </select>
                </div>

                <div className="space-y-1 flex items-center pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="form-checkbox h-4 w-4 rounded"
                      style={{ accentColor: themeConfig.colors.accent }}
                    />
                    <span className="opacity-80">Featured Project</span>
                  </label>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label
                    htmlFor="project-description"
                    className="block opacity-80"
                  >
                    Description *
                  </label>
                  <textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border rounded p-2 focus:outline-none resize-y"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="Brief description of the project..."
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label
                    htmlFor="project-tech"
                    className="block opacity-80"
                  >
                    Technologies
                  </label>
                  <div
                    className="flex flex-wrap gap-2 p-2 border rounded min-h-10.5"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    {tags.map((tag) => (
                      <TagChip
                        key={tag}
                        name={tag}
                        removable
                        onRemove={() => removeTag(tag)}
                        active
                      />
                    ))}
                    <input
                      id="project-tech"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={addTag}
                      className="flex-1 bg-transparent focus:outline-none min-w-30 text-sm"
                      placeholder={
                        tags.length === 0 ? "Add tech (press Enter)..." : ""
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="project-demo"
                    className="block opacity-80"
                  >
                    Demo URL
                  </label>
                  <input
                    id="project-demo"
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="w-full bg-transparent border rounded p-2 focus:outline-none"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="project-github"
                    className="block opacity-80"
                  >
                    GitHub URL
                  </label>
                  <input
                    id="project-github"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-transparent border rounded p-2 focus:outline-none"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label
                    htmlFor="project-image"
                    className="block opacity-80"
                  >
                    Image URL
                  </label>
                  <input
                    id="project-image"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-transparent border rounded p-2 focus:outline-none"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs border rounded transition-colors"
                  style={{
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs border rounded transition-colors flex items-center space-x-2"
                  style={{
                    borderColor: themeConfig.colors.accent,
                    backgroundColor: `${themeConfig.colors.accent}10`,
                    color: themeConfig.colors.accent,
                  }}
                >
                  <Save size={14} />
                  <span>{isSaving ? "Saving..." : "Save Project"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
