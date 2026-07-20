"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { ThemeConfig } from "@/types/theme";
import { useI18n } from "@/hooks/use-i18n";
import { authService } from "@/lib/auth/auth-service";
import { useDraftAutosave, type DraftData } from "@/hooks/use-draft-autosave";
import {
  ImageUploadButton,
  ImageDropZone,
  uploadBlogImage,
} from "./image-upload-button";
import { TagChip } from "@/components/atoms/shared/tag-chip";
import { BlogContent } from "@/components/molecules/blog/blog-content";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addHeadingIdsToHtml } from "@/lib/blog/html-headings";
import { BLOG_CONTENT_LOCALES, DEFAULT_BLOG_LOCALE } from "@/lib/i18n/locales";
import {
  listAdminSeries,
  type BlogSeriesSummary,
} from "@/lib/services/series-service";

import { getApiUrl } from "@/lib/api/get-api-url";
import {
  Plus,
  Save,
  Send,
  Trash,
  Check,
  Clock,
  Info,
  EyeOff,
} from "lucide-react";

const TiptapEditor = dynamic(
  () =>
    import("./tiptap-editor").then((mod) => ({ default: mod.TiptapEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-80 animate-pulse rounded border border-neutral-700 bg-neutral-900/60" />
    ),
  },
);

type BlogStatus = "draft" | "scheduled" | "published";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  contentMd: string | null;
  contentHtml: string | null;
  summary: string | null;
  published: boolean;
  tags: string[];
  /** ISO-8601 timestamp; if set and in the future, post is scheduled. */
  publishAt: string | null;
  status?: BlogStatus;
  locale?: string;
  seriesId?: string | null;
  seriesOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LocalBlogPost extends BlogPost {}

interface BlogEditorProps {
  themeConfig: ThemeConfig;
}

export function BlogEditor({ themeConfig }: BlogEditorProps) {
  const { t } = useI18n();
  const [currentPost, setCurrentPost] = useState<LocalBlogPost | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  // Datetime-local input value (YYYY-MM-DDTHH:mm). Empty string = no schedule.
  const [publishAtLocal, setPublishAtLocal] = useState("");
  const [locale, setLocale] = useState(DEFAULT_BLOG_LOCALE);
  const [seriesId, setSeriesId] = useState<string>("");
  const [seriesOrder, setSeriesOrder] = useState<string>("");
  const [availableSeries, setAvailableSeries] = useState<BlogSeriesSummary[]>(
    [],
  );
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [posts, setPosts] = useState<LocalBlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const draftKey = `admin:blog-draft:${currentPost?.id && !isNewPost ? currentPost.id : "new"}`;
  const {
    savedDraft,
    saveDraft: saveDraftToLocal,
    clearDraft,
    lastSavedAt: draftSavedAt,
    hasDraft,
  } = useDraftAutosave({
    key: draftKey,
    debounceMs: 2000,
  });

  const toLocalPost = (post: BlogPost): LocalBlogPost => ({
    ...post,
    tags: post.tags ?? [],
    publishAt: post.publishAt ?? null,
    locale: post.locale ?? DEFAULT_BLOG_LOCALE,
    seriesId: post.seriesId ?? null,
    seriesOrder: post.seriesOrder ?? null,
  });

  /**
   * Convert an ISO-8601 timestamp to the `YYYY-MM-DDTHH:mm` shape that
   * `<input type="datetime-local">` expects, in the user's locale. Returns
   * an empty string for null/invalid values.
   */
  const isoToLocalInput = (iso: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /**
   * Convert the datetime-local string back to a UTC ISO timestamp.
   * Returns `null` for empty input.
   */
  const localInputToIso = (local: string): string | null => {
    if (!local) return null;
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const computeStatus = (
    published: boolean,
    publishAt: string | null,
  ): BlogStatus => {
    if (publishAt) {
      const ts = new Date(publishAt).getTime();
      if (!Number.isNaN(ts) && ts > Date.now()) return "scheduled";
      return "published";
    }
    return published ? "published" : "draft";
  };

  const resolveEditorHtml = (post: LocalBlogPost): string => {
    if (post.contentHtml) return post.contentHtml;
    if (post.contentMd) {
      return post.contentMd
        .split(/\n\n+/)
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
    }
    return "<p></p>";
  };

  const loadDraft = useCallback((draft: LocalBlogPost) => {
    setCurrentPost(draft);
    setTitle(draft.title);
    setContent(resolveEditorHtml(draft));
    setSummary(draft.summary || "");
    setSlug(draft.slug);
    setTags(draft.tags);
    setPublishAtLocal(isoToLocalInput(draft.publishAt));
    setLocale(draft.locale ?? DEFAULT_BLOG_LOCALE);
    setSeriesId(draft.seriesId ?? "");
    setSeriesOrder(draft.seriesOrder != null ? String(draft.seriesOrder) : "");
    setIsNewPost(false);
    setError(null);

    if (typeof window !== "undefined") {
      const key = `admin:blog-draft:${draft.id}`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const localDraft: DraftData = JSON.parse(raw);

          if (
            localDraft.content &&
            localDraft.content !== resolveEditorHtml(draft)
          ) {
            setShowDraftPrompt(true);
          }
        }
      } catch {
        console.warn("Failed to check for local draft");
      }
    }
  }, []);

  const fetchAvailableTags = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/blog/tags`, {
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data)) {
          setAvailableTags(data.map((t: { name: string }) => t.name));
        } else if (data.tags) {
          setAvailableTags(data.tags);
        }
      }
    } catch {
      console.warn("Failed to fetch available tags");
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/blog?pageSize=50`, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const loadedPosts = (data.items || []).map(toLocalPost);
        setPosts(loadedPosts);

        if (loadedPosts.length > 0 && !currentPost) {
          loadDraft(loadedPosts[0]);
        }
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to load posts");
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
      setError("Network error - is the backend running?");
    } finally {
      setIsLoading(false);
    }
  }, [currentPost, loadDraft]);

  const fetchAvailableSeries = useCallback(async () => {
    try {
      const data = await listAdminSeries();
      setAvailableSeries(data);
    } catch {
      console.warn("Failed to fetch blog series");
    }
  }, []);

  useEffect(() => {
    loadPosts();
    fetchAvailableTags();
    fetchAvailableSeries();
  }, [loadPosts, fetchAvailableTags, fetchAvailableSeries]);

  useEffect(() => {
    if (title || content || summary) {
      saveDraftToLocal({
        content,
        title,
        summary,
        tags,
        savedAt: new Date().toISOString(),
      });
    }
  }, [title, content, summary, tags, saveDraftToLocal]);

  useEffect(() => {
    const timeoutId = autoSaveTimeoutRef.current;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [title, content, currentPost]);

  const generateSlug = (titleText: string): string => {
    return titleText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  };

  const saveDraft = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const postSlug = slug.trim() || generateSlug(title);
    if (!postSlug) {
      setError("Slug is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const token = authService.getAccessToken();
    if (!token) {
      setError("Please log in to save posts");
      setIsSaving(false);
      return;
    }

    try {
      const apiUrl = getApiUrl();
      const isUpdate = currentPost && !isNewPost;

      const publishAtIso = localInputToIso(publishAtLocal);
      const htmlContent = addHeadingIdsToHtml(content);
      const body: Record<string, unknown> = {
        title: title.trim(),
        slug: postSlug,
        summary: summary.trim() || null,
        contentMd: null,
        contentHtml: htmlContent,
        published: currentPost?.published ?? false,
        tags,
        locale,
        seriesId: seriesId || null,
        seriesOrder: seriesOrder ? parseInt(seriesOrder, 10) : null,
      };
      // For PATCH we want to be able to *clear* the schedule explicitly,
      // hence the difference between "absent" and `null`. POST always
      // sends the chosen value so the field is unambiguous.
      if (isUpdate) {
        body.publishAt = publishAtIso;
      } else if (publishAtIso) {
        body.publishAt = publishAtIso;
      }

      const localeQuery =
        isUpdate && currentPost.locale
          ? `?locale=${encodeURIComponent(currentPost.locale)}`
          : "";

      const response = await fetch(
        isUpdate
          ? `${apiUrl}/api/blog/${currentPost.slug}${localeQuery}`
          : `${apiUrl}/api/blog`,
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        const savedPost = await response.json();
        const localPost = toLocalPost(savedPost);

        if (isUpdate) {
          setPosts((prev) =>
            prev.map((p) => (p.slug === currentPost.slug ? localPost : p)),
          );
        } else {
          setPosts((prev) => [localPost, ...prev]);
        }

        setCurrentPost(localPost);
        setSlug(localPost.slug);
        setTags(localPost.tags);
        setIsNewPost(false);
        setLastSaved(new Date());
        clearDraft();
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to save post");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Network error while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const createNewDraft = () => {
    const newDraft: LocalBlogPost = {
      id: `new-${Date.now()}`,
      title: t("blogUntitled"),
      slug: "",
      contentMd: null,
      contentHtml: "<p></p>",
      summary: null,
      tags: [],
      published: false,
      publishAt: null,
      locale: DEFAULT_BLOG_LOCALE,
      seriesId: null,
      seriesOrder: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentPost(newDraft);
    setTitle(newDraft.title);
    setContent(newDraft.contentHtml || "<p></p>");
    setSummary("");
    setSlug("");
    setTags([]);
    setPublishAtLocal("");
    setLocale(DEFAULT_BLOG_LOCALE);
    setSeriesId("");
    setSeriesOrder("");
    setIsNewPost(true);
    setError(null);
  };

  const loadLocalDraft = () => {
    if (savedDraft) {
      setTitle(savedDraft.title || title);
      setContent(savedDraft.content || content);
      setSummary(savedDraft.summary || summary);
      setTags(savedDraft.tags?.length ? savedDraft.tags : tags);
    }
    setShowDraftPrompt(false);
  };

  const dismissDraftPrompt = () => {
    setShowDraftPrompt(false);
    clearDraft();
  };

  const deletePost = async () => {
    if (!currentPost || isNewPost) return;

    if (!confirm(`Delete "${currentPost.title}"? This cannot be undone.`)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const token = authService.getAccessToken();
    if (!token) {
      setError("Please log in to delete posts");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `${getApiUrl()}/api/blog/${currentPost.slug}?locale=${encodeURIComponent(currentPost.locale ?? DEFAULT_BLOG_LOCALE)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== currentPost.slug));

        const remaining = posts.filter((p) => p.slug !== currentPost.slug);
        if (remaining.length > 0) {
          loadDraft(remaining[0]);
        } else {
          createNewDraft();
        }
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to delete post");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Network error while deleting");
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (
      trimmed &&
      !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
      setTagSuggestions([]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    if (value.trim()) {
      const filtered = availableTags.filter(
        (t) =>
          t.toLowerCase().includes(value.toLowerCase()) &&
          !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()),
      );
      setTagSuggestions(filtered.slice(0, 5));
    } else {
      setTagSuggestions([]);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      setTagSuggestions([]);
    }
  };

  const selectTagSuggestion = (tag: string) => {
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const handleImageUpload = useCallback((url: string) => {
    setContent((prev) => `${prev}<p><img src="${url}" alt="image" /></p>`);
  }, []);

  const togglePublish = async () => {
    if (!currentPost) return;

    const token = authService.getAccessToken();
    if (!token) {
      setError("Please log in to publish posts");
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isNewPost) {
      if (!title.trim()) {
        setError("Title is required");
        setIsSaving(false);
        return;
      }

      const postSlug = slug.trim() || generateSlug(title);
      if (!postSlug) {
        setError("Slug is required");
        setIsSaving(false);
        return;
      }

      try {
        const apiUrl = getApiUrl();
        const publishAtIso = localInputToIso(publishAtLocal);
        const body: Record<string, unknown> = {
          title: title.trim(),
          slug: postSlug,
          summary: summary.trim() || null,
          contentMd: null,
          contentHtml: addHeadingIdsToHtml(content),
          // If a future schedule is set, leave `published` false so the
          // status pipeline derives "scheduled". Otherwise this is an
          // immediate publish.
          published:
            !publishAtIso || new Date(publishAtIso).getTime() <= Date.now(),
          tags,
          locale,
          seriesId: seriesId || null,
          seriesOrder: seriesOrder ? parseInt(seriesOrder, 10) : null,
        };
        if (publishAtIso) {
          body.publishAt = publishAtIso;
        }

        const response = await fetch(`${apiUrl}/api/blog`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const savedPost = await response.json();
          const localPost = toLocalPost(savedPost);

          setPosts((prev) => [localPost, ...prev]);
          setCurrentPost(localPost);
          setSlug(localPost.slug);
          setTags(localPost.tags);
          setIsNewPost(false);
          setLastSaved(new Date());
          clearDraft();
        } else {
          const errData = await response.json();
          setError(errData.error || "Failed to publish post");
        }
      } catch (err) {
        console.error("Publish error:", err);
        setError("Network error while publishing");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      const response = await fetch(
        `${getApiUrl()}/api/blog/${currentPost.slug}?locale=${encodeURIComponent(currentPost.locale ?? DEFAULT_BLOG_LOCALE)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ published: !currentPost.published }),
        },
      );

      if (response.ok) {
        const updatedPost = await response.json();
        const localPost = toLocalPost(updatedPost);

        setPosts((prev) =>
          prev.map((p) => (p.slug === currentPost.slug ? localPost : p)),
        );
        setCurrentPost(localPost);
        setTags(localPost.tags);
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to update publish status");
      }
    } catch (err) {
      console.error("Publish error:", err);
      setError("Network error while updating");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span style={{ color: themeConfig.colors.accent }}>
          Loading posts...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="p-3 border rounded border-red-500 bg-red-50 dark:bg-red-900/20">
          <span className="text-sm text-red-700 dark:text-red-300">
            {error}
          </span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        className="p-4 border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-mono"
              style={{ color: themeConfig.colors.accent }}
            >
              editor@portfolio:~$
            </span>
            <span className="text-sm opacity-70">./blog-editor.sh</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewDraft}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
              }}
            >
              <span className="flex items-center gap-1">
                <Plus size={12} /> {t("blogNewPost")}
              </span>
            </button>
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.success,
                color: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.success,
              }}
            >
              <span className="flex items-center gap-1">
                <Save size={12} />{" "}
                {isSaving ? t("blogSaving") : t("blogSaveDraft")}
              </span>
            </button>
            <button
              onClick={togglePublish}
              disabled={isSaving}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.accent,
                color: isSaving
                  ? themeConfig.colors.muted
                  : themeConfig.colors.accent,
              }}
            >
              <span className="flex items-center gap-1">
                {currentPost?.published ? (
                  <>
                    <EyeOff size={12} /> Unpublish
                  </>
                ) : (
                  <>
                    <Send size={12} /> {t("blogPublish")}
                  </>
                )}
              </span>
            </button>
            {currentPost && !isNewPost && (
              <button
                onClick={deletePost}
                disabled={isSaving}
                className="px-3 py-1 text-xs border rounded transition-colors"
                style={{
                  borderColor: themeConfig.colors.error,
                  color: themeConfig.colors.error,
                }}
              >
                <span className="flex items-center gap-1">
                  <Trash size={12} /> Delete
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span>
              {t("blogDrafts")}: {posts.filter((p) => !p.published).length}
            </span>
            <span>
              {t("blogPublished")}: {posts.filter((p) => p.published).length}
            </span>
            {lastSaved && (
              <span>
                {t("blogLastSaved")}: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isNewPost && (
              <span style={{ color: themeConfig.colors.accent }}>
                (New - not saved yet)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {draftSavedAt && (
              <span className="text-xs text-gray-500">
                Draft saved {draftSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Posts sidebar */}
        <div className="lg:col-span-1">
          <div
            className="p-4 border rounded"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-sm font-bold"
                style={{ color: themeConfig.colors.accent }}
              >
                Posts
              </div>
              <button
                onClick={loadPosts}
                className="text-xs opacity-70 hover:opacity-100"
                title="Refresh posts"
              ></button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {posts.length === 0 ? (
                <div className="text-xs opacity-50 text-center py-4">
                  No posts yet. Create your first post!
                </div>
              ) : (
                posts.map((post) => {
                  const isSelected =
                    currentPost?.slug === post.slug && !isNewPost;
                  return (
                    <button
                      key={post.id}
                      onClick={() => loadDraft(post)}
                      className={`w-full p-3 text-left border rounded transition-all duration-200 ${
                        isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"
                      }`}
                      style={{
                        borderColor: isSelected
                          ? themeConfig.colors.accent
                          : themeConfig.colors.border,
                        backgroundColor: isSelected
                          ? `${themeConfig.colors.accent}20`
                          : themeConfig.colors.bg,
                      }}
                    >
                      <div className="text-xs font-mono truncate">
                        {post.title}
                      </div>
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </div>
                      {(() => {
                        const status =
                          post.status ??
                          computeStatus(post.published, post.publishAt);
                        if (status === "scheduled") {
                          return (
                            <div
                              className="text-xs mt-1"
                              style={{ color: themeConfig.colors.warning }}
                              title={post.publishAt ?? undefined}
                            >
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> Scheduled
                              </span>
                            </div>
                          );
                        }
                        if (status === "published") {
                          return (
                            <div
                              className="text-xs mt-1"
                              style={{ color: themeConfig.colors.success }}
                            >
                              <span className="flex items-center gap-1">
                                <Check size={12} /> {t("blogPublished")}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="text-xs mt-1 opacity-50">Draft</div>
                        );
                      })()}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div
            className="p-4 border rounded"
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor: themeConfig.colors.bg,
            }}
          >
            {}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">{t("blogTitle")}</div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);

                  if (isNewPost || !slug) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder={`${t("blogTitle")}...`}
              />
            </div>

            {}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">Slug (URL path)</div>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder="my-blog-post-slug"
                disabled={!isNewPost && !!currentPost}
              />
              {!isNewPost && currentPost && (
                <div className="text-xs opacity-50 mt-1">
                  Slug cannot be changed after creation
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">{t("blogSummary")}</div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono resize-none"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder={`${t("blogSummary")}...`}
              />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs opacity-70 mb-2">Content locale</div>
                <Select
                  value={locale}
                  onValueChange={setLocale}
                  disabled={!isNewPost && !!currentPost}
                >
                  <SelectTrigger
                    className="w-full px-3 py-2 h-[38px] text-sm border rounded bg-transparent font-mono"
                    style={{
                      borderColor: themeConfig.colors.border,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOG_CONTENT_LOCALES.map((loc) => (
                      <SelectItem key={loc.code} value={loc.code}>
                        {loc.flag} {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-2">Series</div>
                <Select
                  value={seriesId || "none"}
                  onValueChange={(val) => setSeriesId(val === "none" ? "" : val)}
                >
                  <SelectTrigger
                    className="w-full px-3 py-2 h-[38px] text-sm border rounded bg-transparent font-mono"
                    style={{
                      borderColor: themeConfig.colors.border,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableSeries.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-2">Series order</div>
                <input
                  type="number"
                  min={1}
                  value={seriesOrder}
                  onChange={(e) => setSeriesOrder(e.target.value)}
                  disabled={!seriesId}
                  className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">
                Publish at (leave blank for immediate)
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={publishAtLocal}
                  onChange={(e) => setPublishAtLocal(e.target.value)}
                  className="px-3 py-2 text-sm border rounded bg-transparent font-mono"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                />
                {publishAtLocal && (
                  <button
                    type="button"
                    onClick={() => setPublishAtLocal("")}
                    className="px-2 py-1 text-xs border rounded transition-colors"
                    style={{
                      borderColor: themeConfig.colors.muted,
                      color: themeConfig.colors.muted,
                    }}
                  >
                    clear
                  </button>
                )}
                {publishAtLocal && (
                  <span
                    className="text-xs"
                    style={{
                      color:
                        new Date(publishAtLocal).getTime() > Date.now()
                          ? themeConfig.colors.warning
                          : themeConfig.colors.success,
                    }}
                  >
                    {new Date(publishAtLocal).getTime() > Date.now()
                      ? "Will be scheduled"
                      : "Will be published immediately"}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">{t("blogTags")}</div>
              <div className="relative">
                <div
                  className="flex items-center flex-wrap gap-1 p-2 border rounded bg-transparent min-h-10"
                  style={{
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  {tags.map((tag) => (
                    <TagChip
                      key={tag}
                      name={tag}
                      size="sm"
                      active
                      removable
                      onRemove={() => removeTag(tag)}
                    />
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 min-w-30 px-1 py-0.5 text-sm bg-transparent font-mono outline-none"
                    style={{ color: themeConfig.colors.text }}
                    placeholder={
                      tags.length === 0
                        ? `${t("blogAddTag")}... (Enter to add)`
                        : "Add tag..."
                    }
                  />
                </div>
                {tagSuggestions.length > 0 && (
                  <div
                    className="absolute z-10 w-full mt-1 border rounded shadow-lg max-h-40 overflow-y-auto"
                    style={{
                      borderColor: themeConfig.colors.border,
                      backgroundColor: themeConfig.colors.bg,
                    }}
                  >
                    {tagSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => selectTagSuggestion(suggestion)}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-green-400/10 transition-colors"
                        style={{ color: themeConfig.colors.text }}
                      >
                        #{suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="text-xs opacity-70">{t("blogContent")}</div>
                  <div
                    className="flex border rounded overflow-hidden"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    <button
                      onClick={() => setViewMode("edit")}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === "edit" ? "bg-opacity-20" : "bg-transparent opacity-60 hover:opacity-100"}`}
                      style={{
                        backgroundColor:
                          viewMode === "edit"
                            ? themeConfig.colors.accent
                            : "transparent",
                        color:
                          viewMode === "edit"
                            ? themeConfig.colors.accent
                            : themeConfig.colors.text,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`px-3 py-1 text-xs font-medium transition-colors border-l ${viewMode === "preview" ? "bg-opacity-20" : "bg-transparent opacity-60 hover:opacity-100"}`}
                      style={{
                        backgroundColor:
                          viewMode === "preview"
                            ? themeConfig.colors.accent
                            : "transparent",
                        color:
                          viewMode === "preview"
                            ? themeConfig.colors.accent
                            : themeConfig.colors.text,
                        borderColor: themeConfig.colors.border,
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <ImageUploadButton
                  onUploadComplete={handleImageUpload}
                  disabled={isSaving || viewMode === "preview"}
                />
              </div>

              {viewMode === "edit" ? (
                <ImageDropZone onUploadComplete={handleImageUpload}>
                  <TiptapEditor
                    value={content}
                    onChange={setContent}
                    themeConfig={themeConfig}
                    placeholder="Write your post…"
                    onImageUpload={uploadBlogImage}
                    minHeight="500px"
                  />
                  <div className="mt-2 text-[10px] opacity-50 font-mono text-center flex items-center justify-center gap-1">
                    <Info size={10} /> Editor supports standard Markdown syntax.
                    Specific React/MDX components will be rendered as plain
                    text.
                  </div>
                </ImageDropZone>
              ) : (
                <div
                  className="border rounded p-6 min-h-125 overflow-y-auto bg-gray-950"
                  style={{ borderColor: themeConfig.colors.border }}
                >
                  <BlogContent html={content} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {}
      {showDraftPrompt && hasDraft && (
        <div
          className="fixed bottom-4 right-4 z-50 p-4 border rounded-lg shadow-lg max-w-sm"
          style={{
            borderColor: themeConfig.colors.accent,
            backgroundColor: themeConfig.colors.bg,
          }}
        >
          <p
            className="text-sm mb-3"
            style={{ color: themeConfig.colors.text }}
          >
            A saved draft was found. Would you like to restore it?
          </p>
          <div className="flex gap-2">
            <button
              onClick={loadLocalDraft}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
              }}
            >
              Restore Draft
            </button>
            <button
              onClick={dismissDraftPrompt}
              className="px-3 py-1 text-xs border rounded transition-colors opacity-70 hover:opacity-100"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
