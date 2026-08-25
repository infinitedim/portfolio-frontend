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
import { PlatformBadge } from "@/components/atoms/platform-badge";
import { type Project, type ProjectCategory, type TargetPlatform } from "@/lib/data/data-fetching";
import { Plus, Save, Trash, X, Edit, Check, ChevronUp, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/molecules/admin/confirm-dialog";
import { toast } from "sonner";
import { ProjectImageUpload } from "@/components/molecules/admin/project-image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props for the {@link ProjectsEditor} component.
 *
 * @interface ProjectsEditorProps
 * @property {ThemeConfig} themeConfig - Theme configuration object supplying color styles and borders.
 */
interface ProjectsEditorProps {
  themeConfig: ThemeConfig;
}

/**
 * Maximum character limit for an individual technology tag.
 * @constant {number}
 */
const MAX_TAG_LENGTH = 30;

/**
 * Maximum number of technology tags allowed per project entry.
 * @constant {number}
 */
const MAX_TAGS_PER_PROJECT = 15;

/**
 * Regular expression pattern for validating valid characters in technology tags.
 * @constant {RegExp}
 */
const TAG_VALIDATION_REGEX = /^[a-zA-Z0-9\s.\-_#+/()]+$/;

/**
 * List of available target deployment platform choices and their display labels.
 * @constant {Array<{ id: TargetPlatform; label: string }>}
 */
const PLATFORM_OPTIONS: { id: TargetPlatform; label: string }[] = [
  { id: "android", label: "Android" },
  { id: "ios", label: "iOS" },
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
  { id: "web", label: "Web" },
];

/**
 * Admin management panel component for listing, creating, editing, reordering,
 * and deleting portfolio projects with metrics, platform tags, and GCS image uploads.
 *
 * @component
 * @param {ProjectsEditorProps} props - Properties configuring the projects editor.
 * @returns {JSX.Element} The rendered project management interface.
 */
export function ProjectsEditor({
  themeConfig,
}: ProjectsEditorProps): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("frontend");
  const [platforms, setPlatforms] = useState<TargetPlatform[]>([]);
  const [demoUrl, setDemoUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [apiDocsUrl, setApiDocsUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [packageUrl, setPackageUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [architectureImageUrl, setArchitectureImageUrl] = useState("");
  const [status, setStatus] = useState<Project["status"]>("completed");
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const [latencyP95, setLatencyP95] = useState("");
  const [throughputRps, setThroughputRps] = useState("");
  const [uptimeSla, setUptimeSla] = useState("");
  const [lighthouseScore, setLighthouseScore] = useState<string>("");
  const [bundleSize, setBundleSize] = useState("");
  const [appSize, setAppSize] = useState("");
  const [minOsVersion, setMinOsVersion] = useState("");
  const [testCoverage, setTestCoverage] = useState("");

  const suggestions = tagInput.trim()
    ? POPULAR_TECH_PRESETS.filter(
        (tech) =>
          tech.toLowerCase().includes(tagInput.toLowerCase().trim()) &&
          !tags.some((t) => t.toLowerCase() === tech.toLowerCase()),
      )
    : [];

  /**
   * Fetches the current list of projects from the backend portfolio API.
   *
   * @async
   * @returns {Promise<void>} Resolves when project list is loaded into state.
   */
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

  /**
   * Generates a cryptographically random UUID v4 string with fallback for non-crypto environments.
   *
   * @returns {string} A randomly generated UUID string.
   */
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

  /**
   * Initializes the editor form state with data from an existing project.
   *
   * @param {Project} project - The project to edit.
   * @returns {void}
   */
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsNewProject(false);
    setName(project.name);
    setDescription(project.description);
    setCategory(project.category || "frontend");
    setPlatforms(project.platforms || []);
    setDemoUrl(project.demoUrl || "");
    setGithubUrl(project.githubUrl || "");
    setApiDocsUrl(project.apiDocsUrl || "");
    setPlayStoreUrl(project.playStoreUrl || "");
    setAppStoreUrl(project.appStoreUrl || "");
    setDownloadUrl(project.downloadUrl || "");
    setPackageUrl(project.packageUrl || "");
    setImageUrl(project.imageUrl || "");
    setArchitectureImageUrl(project.architectureImageUrl || "");
    setStatus(project.status);
    setFeatured(project.featured);
    setTags([...project.technologies]);
    setTagInput("");
    setSelectedSuggestionIndex(-1);

    setLatencyP95(project.metrics?.latencyP95 || "");
    setThroughputRps(project.metrics?.throughputRps || "");
    setUptimeSla(project.metrics?.uptimeSla || "");
    setLighthouseScore(
      project.metrics?.lighthouseScore !== undefined
        ? String(project.metrics.lighthouseScore)
        : "",
    );
    setBundleSize(project.metrics?.bundleSize || "");
    setAppSize(project.metrics?.appSize || "");
    setMinOsVersion(project.metrics?.minOsVersion || "");
    setTestCoverage(project.metrics?.testCoverage || "");
  };

  /**
   * Resets the form fields and initializes a blank project template for creation.
   *
   * @returns {void}
   */
  const handleCreateNew = () => {
    const newProject: Project = {
      id: "",
      name: "",
      slug: "",
      description: "",
      technologies: [],
      category: "frontend",
      status: "completed",
      featured: false,
    };
    setEditingProject(newProject);
    setIsNewProject(true);
    setName("");
    setDescription("");
    setCategory("frontend");
    setPlatforms([]);
    setDemoUrl("");
    setGithubUrl("");
    setApiDocsUrl("");
    setPlayStoreUrl("");
    setAppStoreUrl("");
    setDownloadUrl("");
    setPackageUrl("");
    setImageUrl("");
    setArchitectureImageUrl("");
    setStatus("completed");
    setFeatured(false);
    setTags([]);
    setTagInput("");
    setSelectedSuggestionIndex(-1);

    setLatencyP95("");
    setThroughputRps("");
    setUptimeSla("");
    setLighthouseScore("");
    setBundleSize("");
    setAppSize("");
    setMinOsVersion("");
    setTestCoverage("");
  };

  /**
   * Toggles the selection state of a target deployment platform.
   *
   * @param {TargetPlatform} platformId - The platform identifier to toggle.
   * @returns {void}
   */
  const togglePlatform = (platformId: TargetPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  };

  /**
   * Cancels the active create or edit operation and closes the form drawer.
   *
   * @returns {void}
   */
  const handleCancel = () => {
    setEditingProject(null);
    setIsNewProject(false);
    setSelectedSuggestionIndex(-1);
  };

  /**
   * Validates and appends a technology tag to the current project's tag list.
   *
   * @param {string} valueToAdd - The tag text or framework name to add.
   * @returns {void}
   */
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

  /**
   * Removes a technology tag from the project's active tag list.
   *
   * @param {string} tagToRemove - The name of the tag to remove.
   * @returns {void}
   */
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  /**
   * Handles keyboard navigation and auto-completion shortcuts within the technology tag input.
   *
   * @param {KeyboardEvent<HTMLInputElement>} e - The keyboard event.
   * @returns {void}
   */
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

  /**
   * Validates the project form, builds the project payload, and persists changes via the backend API.
   *
   * @async
   * @returns {Promise<void>} Resolves when the save operation completes.
   */
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
        category,
        platforms: platforms.length > 0 ? platforms : undefined,
        demoUrl: demoUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        apiDocsUrl: apiDocsUrl.trim() || undefined,
        playStoreUrl: playStoreUrl.trim() || undefined,
        appStoreUrl: appStoreUrl.trim() || undefined,
        downloadUrl: downloadUrl.trim() || undefined,
        packageUrl: packageUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        architectureImageUrl: architectureImageUrl.trim() || undefined,
        status,
        featured,
        technologies: tags,
        metrics: {
          latencyP95: latencyP95.trim() || undefined,
          throughputRps: throughputRps.trim() || undefined,
          uptimeSla: uptimeSla.trim() || undefined,
          lighthouseScore:
            lighthouseScore.trim() && Number.isFinite(Number(lighthouseScore))
              ? Number(lighthouseScore)
              : undefined,
          bundleSize: bundleSize.trim() || undefined,
          appSize: appSize.trim() || undefined,
          minOsVersion: minOsVersion.trim() || undefined,
          testCoverage: testCoverage.trim() || undefined,
        },
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

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /**
   * Shifts the display position of a project up or down in the portfolio ordering and updates the backend.
   *
   * @async
   * @param {number} index - Current index of the project in the list.
   * @param {"up" | "down"} direction - Direction to shift the project.
   * @returns {Promise<void>} Resolves when the reordered list is persisted.
   */
  const handleMoveProject = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const token = authService.getAccessToken();
    if (!token) return;

    const newProjects = [...projects];
    const temp = newProjects[index]!;
    newProjects[index] = newProjects[targetIndex]!;
    newProjects[targetIndex] = temp;

    setProjects(newProjects);

    try {
      await fetch(`${getApiUrl()}/api/portfolio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: "projects",
          data: newProjects,
        }),
      });
      toast.success("Project order updated");
    } catch {
      toast.error("Failed to persist project order");
    }
  };

  /**
   * Deletes a project by ID from the portfolio database after confirmation.
   *
   * @async
   * @param {string} idToDelete - The unique identifier of the project to remove.
   * @returns {Promise<void>} Resolves when deletion completes.
   */
  const handleDelete = async (idToDelete: string) => {
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
        setDeleteConfirmId(null);
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

                                                
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="block opacity-80">Project Category *</span>
                <Select
                  value={category}
                  onValueChange={(val: ProjectCategory) => setCategory(val)}
                >
                  <SelectTrigger
                    className="w-full border rounded text-xs bg-transparent"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-xs">
                    <SelectItem value="frontend">Frontend Web</SelectItem>
                    <SelectItem value="backend">Backend Service / API</SelectItem>
                    <SelectItem value="fullstack">Fullstack Web</SelectItem>
                    <SelectItem value="mobile-native">Mobile Native (Android/iOS)</SelectItem>
                    <SelectItem value="desktop-native">Desktop Native</SelectItem>
                    <SelectItem value="library">Library / CLI Tool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </div>

                                                                               
            <div className="space-y-2 md:col-span-2 p-2.5 border rounded bg-black/20 border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: themeConfig.colors.accent }}
                  />
                  <span className="font-semibold text-emerald-400">Featured Project (Highlight on Landing)</span>
                </label>
              </div>

                                               
              <div className="pt-1">
                <span className="block text-[11px] opacity-70 mb-1">Target Platforms:</span>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((opt) => {
                    const isChecked = platforms.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => togglePlatform(opt.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all ${
                          isChecked
                            ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-semibold"
                            : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

                               
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

                                            
            <div className="space-y-2 md:col-span-2 relative">
              <div className="flex items-center justify-between">
                <label htmlFor="project-tech" className="block opacity-80">
                  Technologies ({tags.length}/{MAX_TAGS_PER_PROJECT})
                </label>
                <span className="text-[10px] text-neutral-500">
                  Press Enter or comma to add
                </span>
              </div>

                                         
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

                                             
            <div className="space-y-2 md:col-span-2 pt-2 border-t border-neutral-800">
              <span className="block font-semibold text-neutral-300">Project Links & Access</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                <div className="space-y-1">
                  <label htmlFor="project-demo" className="block opacity-80">
                    Demo URL (Live Web)
                  </label>
                  <input
                    id="project-demo"
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="w-full bg-transparent border rounded p-2 focus:outline-none"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="https://my-app.com"
                  />
                </div>

                {(category === "backend" || category === "fullstack") && (
                  <div className="space-y-1">
                    <label htmlFor="project-apidocs" className="block opacity-80 text-emerald-400">
                      API Docs / Scalar URL
                    </label>
                    <input
                      id="project-apidocs"
                      type="url"
                      value={apiDocsUrl}
                      onChange={(e) => setApiDocsUrl(e.target.value)}
                      className="w-full bg-transparent border rounded p-2 focus:outline-none border-emerald-500/40"
                      placeholder="https://api.my-app.com/docs"
                    />
                  </div>
                )}

                {(category === "mobile-native" || category === "desktop-native") && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="project-playstore" className="block opacity-80 text-emerald-400">
                        Google Play Store URL
                      </label>
                      <input
                        id="project-playstore"
                        type="url"
                        value={playStoreUrl}
                        onChange={(e) => setPlayStoreUrl(e.target.value)}
                        className="w-full bg-transparent border rounded p-2 focus:outline-none"
                        style={{ borderColor: themeConfig.colors.border }}
                        placeholder="https://play.google.com/store/apps/details?id=..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="project-appstore" className="block opacity-80 text-indigo-400">
                        Apple App Store URL
                      </label>
                      <input
                        id="project-appstore"
                        type="url"
                        value={appStoreUrl}
                        onChange={(e) => setAppStoreUrl(e.target.value)}
                        className="w-full bg-transparent border rounded p-2 focus:outline-none"
                        style={{ borderColor: themeConfig.colors.border }}
                        placeholder="https://apps.apple.com/app/..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="project-download" className="block opacity-80 text-sky-400">
                        Direct Download URL (.apk / .exe / .dmg)
                      </label>
                      <input
                        id="project-download"
                        type="url"
                        value={downloadUrl}
                        onChange={(e) => setDownloadUrl(e.target.value)}
                        className="w-full bg-transparent border rounded p-2 focus:outline-none"
                        style={{ borderColor: themeConfig.colors.border }}
                        placeholder="https://github.com/.../releases/download/v1.0.apk"
                      />
                    </div>
                  </>
                )}

                {category === "library" && (
                  <div className="space-y-1">
                    <label htmlFor="project-package" className="block opacity-80 text-amber-400">
                      Package Registry URL (crates.io / npm)
                    </label>
                    <input
                      id="project-package"
                      type="url"
                      value={packageUrl}
                      onChange={(e) => setPackageUrl(e.target.value)}
                      className="w-full bg-transparent border rounded p-2 focus:outline-none border-amber-500/40"
                      placeholder="https://crates.io/crates/..."
                    />
                  </div>
                )}
              </div>
            </div>

                                              
            <div className="space-y-2 md:col-span-2 pt-2 border-t border-neutral-800">
              <span className="block font-semibold text-neutral-300">Engineering Metrics (Optional)</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label htmlFor="metric-p95" className="block text-[11px] opacity-70">
                    P95 Latency
                  </label>
                  <input
                    id="metric-p95"
                    type="text"
                    value={latencyP95}
                    onChange={(e) => setLatencyP95(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. < 45ms"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-rps" className="block text-[11px] opacity-70">
                    Throughput RPS
                  </label>
                  <input
                    id="metric-rps"
                    type="text"
                    value={throughputRps}
                    onChange={(e) => setThroughputRps(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. 10k req/sec"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-sla" className="block text-[11px] opacity-70">
                    Uptime SLA
                  </label>
                  <input
                    id="metric-sla"
                    type="text"
                    value={uptimeSla}
                    onChange={(e) => setUptimeSla(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. 99.9%"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-coverage" className="block text-[11px] opacity-70">
                    Test Coverage
                  </label>
                  <input
                    id="metric-coverage"
                    type="text"
                    value={testCoverage}
                    onChange={(e) => setTestCoverage(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. 94%"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-lighthouse" className="block text-[11px] opacity-70">
                    Lighthouse (1-100)
                  </label>
                  <input
                    id="metric-lighthouse"
                    type="number"
                    value={lighthouseScore}
                    onChange={(e) => setLighthouseScore(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="98"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-appsize" className="block text-[11px] opacity-70">
                    App Size
                  </label>
                  <input
                    id="metric-appsize"
                    type="text"
                    value={appSize}
                    onChange={(e) => setAppSize(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. 14 MB"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-bundle" className="block text-[11px] opacity-70">
                    Bundle Size
                  </label>
                  <input
                    id="metric-bundle"
                    type="text"
                    value={bundleSize}
                    onChange={(e) => setBundleSize(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. 45 KB"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="metric-minos" className="block text-[11px] opacity-70">
                    Min OS Version
                  </label>
                  <input
                    id="metric-minos"
                    type="text"
                    value={minOsVersion}
                    onChange={(e) => setMinOsVersion(e.target.value)}
                    className="w-full bg-transparent border rounded p-1.5 focus:outline-none text-xs"
                    style={{ borderColor: themeConfig.colors.border }}
                    placeholder="e.g. Android 10+"
                  />
                </div>
              </div>
            </div>

                                
            <div className="space-y-1 md:col-span-2">
              <ProjectImageUpload
                imageUrl={imageUrl}
                onUploadComplete={(url) => setImageUrl(url || "")}
                themeConfig={themeConfig}
              />
            </div>
          </div>

                              
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

                           
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs opacity-60 font-mono border border-dashed rounded border-neutral-800">
            No projects found. Click "Add Project" to create one.
          </div>
        ) : (
          projects.map((proj, index) => (
            <div
              key={proj.id}
              className="p-4 border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs transition-colors hover:border-neutral-700"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.bg,
              }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white">{proj.name}</span>
                  {proj.category && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
                      {proj.category}
                    </span>
                  )}
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
                {proj.platforms && proj.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center pt-0.5">
                    <span className="text-[10px] text-neutral-500">Platforms:</span>
                    {proj.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                  </div>
                )}
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
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveProject(index, "up")}
                    className="p-1 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                    title="Move project up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === projects.length - 1}
                    onClick={() => handleMoveProject(index, "down")}
                    className="p-1 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                    title="Move project down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

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
                  onClick={() => setDeleteConfirmId(proj.id)}
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

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete Project"
        variant="destructive"
        onConfirm={() => {
          if (deleteConfirmId) void handleDelete(deleteConfirmId);
        }}
      />
    </div>
  );
}
