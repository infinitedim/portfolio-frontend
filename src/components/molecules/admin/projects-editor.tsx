"use client";

import { useState, useEffect, useCallback, type JSX, type KeyboardEvent } from "react";
import type { ThemeConfig } from "@/types/theme";
import { authService } from "@/lib/auth/auth-service";
import { TechBadge } from "@/components/atoms/tech-badge";
import {
  POPULAR_TECH_PRESETS,
  getTechConfig,
} from "@/components/atoms/tech-icon-registry";
import { getApiUrl } from "@/lib/api/get-api-url";
import { type Project } from "@/lib/data/data-fetching";
import { Plus, Save, Trash, X, Edit, Check } from "lucide-react";
import { toast } from "sonner";
import { ProjectImageUpload } from "@/components/molecules/admin/project-image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectsEditorProps {
  themeConfig: ThemeConfig;
}

const MAX_TAG_LENGTH = 30;
const MAX_TAGS_PER_PROJECT = 15;
const TAG_VALIDATION_REGEX = /^[a-zA-Z0-9\s.\-_#+/()]+$/;

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
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Compute filtered AutoComplete suggestions
  const suggestions = tagInput.trim()
    ? POPULAR_TECH_PRESETS.filter(
        (tech) =>
          tech.toLowerCase().includes(tagInput.toLowerCase().trim()) &&
          !tags.some((t) => t.toLowerCase() === tech.toLowerCase()),
      )
    : [];

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/portfolio?section=projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
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
    loadProjects();
  }, [loadProjects]);

  const generateUuid = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
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
    setSelectedSuggestionIndex(-1);
  };

  const handleCreateNew = () => {
    const newProject: Project = {
      id: "",
      name: "",
      slug: "",
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
    setSelectedSuggestionIndex(-1);
  };

  const handleCancel = () => {
    setEditingProject(null);
    setIsNewProject(false);
    setSelectedSuggestionIndex(-1);
  };

  const addTagValue = (valueToAdd: string) => {
    const trimmed = valueToAdd.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_TAG_LENGTH) {
      toast.error(`Tag exceeds maximum length of ${MAX_TAG_LENGTH} characters`);
      return;
    }

    if (tags.length >= MAX_TAGS_PER_PROJECT) {
      toast.error(`Maximum of ${MAX_TAGS_PER_PROJECT} tags allowed per project`);
      return;
    }

    if (!TAG_VALIDATION_REGEX.test(trimmed)) {
      toast.error("Tag contains invalid characters");
      return;
    }

    if (!tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags([...tags, trimmed]);
      setTagInput("");
      setSelectedSuggestionIndex(-1);
    } else {
      toast.error("Tag already exists");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
      }
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (
        selectedSuggestionIndex >= 0 &&
        selectedSuggestionIndex < suggestions.length
      ) {
        const selectedTech = suggestions[selectedSuggestionIndex];
        if (selectedTech) addTagValue(selectedTech);
      } else {
        addTagValue(tagInput);
      }
    } else if (e.key === "Escape") {
      setSelectedSuggestionIndex(-1);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
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

    const token = authService.getAccessToken();
    if (!token) {
      toast.error("Please log in to save projects");
      return;
    }

    setIsSaving(true);
    try {
      const projectId = isNewProject ? generateUuid() : editingProject!.id;
      const projectSlug = isNewProject ? projectId : (editingProject!.slug || projectId);

      const projectToSave: Project = {
        id: projectId,
        name: name.trim(),
        slug: projectSlug,
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
          type="button"
          onClick={handleCreateNew}
          disabled={!!editingProject}
          className="px-3 py-1 text-xs border rounded transition-colors disabled:opacity-50"
          style={{
            borderColor: themeConfig.colors.accent,
            color: themeConfig.colors.accent,
          }}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </span>
        </button>
      </div>

      {/* Edit Form Modal/Panel */}
      {editingProject && (
        <div
          className="p-4 border rounded space-y-4"
          style={{
            borderColor: themeConfig.colors.accent,
            backgroundColor: `${themeConfig.colors.bg}ee`,
          }}
        >
          <div className="flex items-center justify-between border-b pb-2">
            <h3
              className="text-base font-semibold font-mono"
              style={{ color: themeConfig.colors.accent }}
            >
              {isNewProject ? "Create New Project" : `Editing: ${editingProject.name}`}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="project-name" className="block opacity-80">
                Project Name *
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border rounded p-2 focus:outline-none"
                style={{ borderColor: themeConfig.colors.border }}
                placeholder="e.g. Portfolio System"
              />
            </div>

            {/* Status & Featured */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="block opacity-80">Status</span>
                <Select
                  value={status}
                  onValueChange={(val: Project["status"]) => setStatus(val)}
                >
                  <SelectTrigger
                    className="w-full border rounded text-xs bg-transparent"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-xs">
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 flex flex-col justify-end pb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: themeConfig.colors.accent }}
                  />
                  <span className="opacity-80">Featured Project</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="project-description" className="block opacity-80">
                Description *
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-transparent border rounded p-2 focus:outline-none resize-y text-xs"
                style={{ borderColor: themeConfig.colors.border }}
                placeholder="Brief description of the project..."
              />
            </div>

            {/* Tech Stack Input Section */}
            <div className="space-y-2 md:col-span-2 relative">
              <div className="flex items-center justify-between">
                <label htmlFor="project-tech" className="block opacity-80">
                  Technologies ({tags.length}/{MAX_TAGS_PER_PROJECT})
                </label>
                <span className="text-[10px] text-neutral-500">
                  Press Enter or comma to add
                </span>
              </div>

              {/* Tag Chips Container */}
              <div
                className="flex flex-wrap gap-2 p-2.5 border rounded min-h-12 bg-black/40"
                style={{ borderColor: themeConfig.colors.border }}
              >
                {tags.map((tag) => (
                  <TechBadge
                    key={tag}
                    name={tag}
                    size="md"
                    removable
                    onRemove={() => removeTag(tag)}
                  />
                ))}
                <div className="relative flex-1 min-w-36">
                  <input
                    id="project-tech"
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setSelectedSuggestionIndex(-1);
                    }}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput.trim() && suggestions.length === 0) {
                        addTagValue(tagInput);
                      }
                    }}
                    className="w-full bg-transparent focus:outline-none text-xs text-white"
                    placeholder={
                      tags.length === 0 ? "Type tech (e.g. React, Rust)..." : "Add tech..."
                    }
                  />

                  {/* AutoComplete Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-60 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-900/95 py-1 shadow-xl backdrop-blur-md">
                      {suggestions.map((tech, idx) => {
                        const isSelected = idx === selectedSuggestionIndex;
                        const config = getTechConfig(tech);
                        const { Icon, color } = config;
                        return (
                          <button
                            key={tech}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addTagValue(tech);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                                : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" style={{ color }} />
                            <span>{tech}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Pick Chips Bar */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-neutral-400">Quick Pick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TECH_PRESETS.slice(0, 12).map((tech) => {
                    const isSelected = tags.some(
                      (t) => t.toLowerCase() === tech.toLowerCase(),
                    );
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            removeTag(tags.find((t) => t.toLowerCase() === tech.toLowerCase()) || tech);
                          } else {
                            addTagValue(tech);
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] transition-all ${
                          isSelected
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                            : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{tech}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* URLs */}
            <div className="space-y-1">
              <label htmlFor="project-demo" className="block opacity-80">
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
              <label htmlFor="project-github" className="block opacity-80">
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

            {/* Image Upload */}
            <div className="space-y-1 md:col-span-2">
              <ProjectImageUpload
                imageUrl={imageUrl}
                onUploadComplete={(url) => setImageUrl(url || "")}
                themeConfig={themeConfig}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs border border-neutral-700 rounded text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              style={{
                backgroundColor: themeConfig.colors.accent,
                color: "#000",
              }}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save Project"}
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs opacity-60 font-mono border border-dashed rounded border-neutral-800">
            No projects found. Click "Add Project" to create one.
          </div>
        ) : (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs transition-colors hover:border-neutral-700"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.bg,
              }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{proj.name}</span>
                  {proj.featured && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Featured
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      proj.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>
                <p className="text-neutral-400 text-xs line-clamp-1">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.technologies.map((t) => (
                    <TechBadge key={t} name={t} size="sm" variant="minimal" />
                  ))}
                  {proj.technologies.length === 0 && (
                    <span className="text-neutral-600 italic">No tags</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(proj)}
                  className="px-3 py-1.5 border border-neutral-700 rounded text-neutral-300 hover:border-neutral-500 hover:text-white flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(proj.id)}
                  className="px-3 py-1.5 border border-red-900/50 bg-red-950/20 rounded text-red-400 hover:bg-red-900/30 flex items-center gap-1"
                >
                  <Trash className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
