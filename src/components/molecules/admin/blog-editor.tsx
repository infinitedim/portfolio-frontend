"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ThemeConfig } from "@/types/theme";
import { useI18n } from "@/hooks/use-i18n";
import { authService } from "@/lib/auth/auth-service";

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  contentMd: string | null;
  contentHtml: string | null;
  summary: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LocalBlogPost extends BlogPost {
  tags: string[];
}

interface BlogEditorProps {
  themeConfig: ThemeConfig;
}

export function BlogEditor({ themeConfig }: BlogEditorProps) {
  const { t } = useI18n();
  const [currentPost, setCurrentPost] = useState<LocalBlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [posts, setPosts] = useState<LocalBlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>(null);


  const toLocalPost = (post: BlogPost): LocalBlogPost => ({
    ...post,
    tags: [],
  });


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
  }, [currentPost]);


  useEffect(() => {
    loadPosts();

  }, [loadPosts]);


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

      const body = {
        title: title.trim(),
        slug: postSlug,
        summary: summary.trim() || null,
        contentMd: content,
        contentHtml: renderMarkdownToHtml(content),
        published: currentPost?.published ?? false,
      };

      const response = await fetch(
        isUpdate ? `${apiUrl}/api/blog/${currentPost.slug}` : `${apiUrl}/api/blog`,
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        const savedPost = await response.json();
        const localPost = toLocalPost(savedPost);
        localPost.tags = tags;

        if (isUpdate) {
          setPosts((prev) =>
            prev.map((p) => (p.slug === currentPost.slug ? localPost : p))
          );
        } else {
          setPosts((prev) => [localPost, ...prev]);
        }

        setCurrentPost(localPost);
        setSlug(localPost.slug);
        setIsNewPost(false);
        setLastSaved(new Date());
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
      contentMd: "# New Blog Post\n\nStart writing here...",
      contentHtml: null,
      summary: null,
      tags: [],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentPost(newDraft);
    setTitle(newDraft.title);
    setContent(newDraft.contentMd || "");
    setSummary("");
    setSlug("");
    setTags([]);
    setIsNewPost(true);
    setError(null);
  };


  const loadDraft = (draft: LocalBlogPost) => {
    setCurrentPost(draft);
    setTitle(draft.title);
    setContent(draft.contentMd || "");
    setSummary(draft.summary || "");
    setSlug(draft.slug);
    setTags(draft.tags);
    setIsNewPost(false);
    setError(null);
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
        `${getApiUrl()}/api/blog/${currentPost.slug}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
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
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };


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
        const body = {
          title: title.trim(),
          slug: postSlug,
          summary: summary.trim() || null,
          contentMd: content,
          contentHtml: renderMarkdownToHtml(content),
          published: true,
        };

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
          localPost.tags = tags;

          setPosts((prev) => [localPost, ...prev]);
          setCurrentPost(localPost);
          setSlug(localPost.slug);
          setIsNewPost(false);
          setLastSaved(new Date());
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
        `${getApiUrl()}/api/blog/${currentPost.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ published: !currentPost.published }),
        }
      );

      if (response.ok) {
        const updatedPost = await response.json();
        const localPost = toLocalPost(updatedPost);
        localPost.tags = tags;

        setPosts((prev) =>
          prev.map((p) => (p.slug === currentPost.slug ? localPost : p))
        );
        setCurrentPost(localPost);
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


  const renderMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/gim, "<em>$1</em>")
      .replace(/```(\w+)?\n([\s\S]*?)```/gim, "<pre><code>$2</code></pre>")
      .replace(/`([^`]+)`/gim, "<code>$1</code>")
      .replace(/\n/gim, "<br>");
  };

  /**
   * Sanitizes HTML content to prevent XSS attacks
   * Removes dangerous tags and attributes while preserving safe formatting
   */
  const sanitizeHtml = (html: string): string => {
    const allowedTags = [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "strong",
      "em", "code", "pre", "ul", "ol", "li", "blockquote", "a",
    ];
    const allowedAttributes: Record<string, string[]> = {
      a: ["href", "title"],
    };

    if (typeof document === "undefined") return html;

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const sanitizeNode = (node: Node): void => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        if (!allowedTags.includes(tagName)) {
          const text = document.createTextNode(element.textContent || "");
          element.parentNode?.replaceChild(text, element);
          return;
        }

        const attrs = Array.from(element.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          if (
            attrName.startsWith("on") ||
            (attrName === "href" && attr.value.toLowerCase().includes("javascript:"))
          ) {
            element.removeAttribute(attr.name);
          } else if (!allowedAttributes[tagName]?.includes(attrName)) {
            element.removeAttribute(attr.name);
          }
        }
      }

      Array.from(node.childNodes).forEach(sanitizeNode);
    };

    sanitizeNode(temp);
    return temp.innerHTML;
  };

  const renderMarkdownPreview = (markdown: string) => {
    return sanitizeHtml(renderMarkdownToHtml(markdown));
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span style={{ color: themeConfig.colors.accent }}>Loading posts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div
          className="p-3 border rounded border-red-500 bg-red-50 dark:bg-red-900/20"
        >
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
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
              ✏️ {t("blogNewPost")}
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
              {isSaving ? `💾 ${t("blogSaving")}` : `💾 ${t("blogSaveDraft")}`}
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
              {currentPost?.published ? "📤 Unpublish" : `🚀 ${t("blogPublish")}`}
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
                🗑️ Delete
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
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-2 py-1 border rounded transition-colors"
            style={{
              borderColor: isPreview
                ? themeConfig.colors.accent
                : themeConfig.colors.border,
              color: isPreview
                ? themeConfig.colors.accent
                : themeConfig.colors.text,
            }}
          >
            {isPreview ? `📝 ${t("commandEdit")}` : `👁️ ${t("blogPreview")}`}
          </button>
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
              >
                🔄
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {posts.length === 0 ? (
                <div className="text-xs opacity-50 text-center py-4">
                  No posts yet. Create your first post!
                </div>
              ) : (
                posts.map((post) => {
                  const isSelected = currentPost?.slug === post.slug && !isNewPost;
                  return (
                    <button
                      key={post.id}
                      onClick={() => loadDraft(post)}
                      className={`w-full p-3 text-left border rounded transition-all duration-200 ${isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"
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
                      {post.published ? (
                        <div
                          className="text-xs mt-1"
                          style={{ color: themeConfig.colors.success }}
                        >
                          ✅ {t("blogPublished")}
                        </div>
                      ) : (
                        <div className="text-xs mt-1 opacity-50">
                          Draft
                        </div>
                      )}
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
            {/* Title */}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">{t("blogTitle")}</div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // Auto-generate slug if empty or new post
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

            {/* Slug */}
            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">Slug (URL path)</div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder="my-blog-post-slug"
                disabled={!isNewPost && !!currentPost} // Can't change slug after creation
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

            <div className="mb-4">
              <div className="text-xs opacity-70 mb-2">{t("blogTags")}</div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  className="flex-1 px-3 py-2 text-sm border rounded bg-transparent font-mono"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                  placeholder={`${t("blogAddTag")}...`}
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 text-xs border rounded transition-colors"
                  style={{
                    borderColor: themeConfig.colors.accent,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {t("blogAddTag")}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs border rounded flex items-center space-x-1"
                    style={{
                      borderColor: themeConfig.colors.border,
                      backgroundColor: themeConfig.colors.bg,
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="opacity-50 hover:opacity-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs opacity-70 mb-2">{t("blogContent")}</div>
              {isPreview ? (
                <div
                  className="w-full min-h-100 px-3 py-2 text-sm border rounded font-mono overflow-y-auto"
                  style={{
                    borderColor: themeConfig.colors.border,
                    backgroundColor: themeConfig.colors.bg,
                    color: themeConfig.colors.text,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownPreview(content),
                  }}
                />
              ) : (
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-100 px-3 py-2 text-sm border rounded bg-transparent font-mono resize-none"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                  placeholder="Write your content in Markdown..."
                />
              )}
            </div>

            {!isPreview && (
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: themeConfig.colors.border }}
              >
                <div className="text-xs opacity-70 mb-2">
                  Markdown Quick Reference
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs opacity-50">
                  <div>
                    <div># Heading 1</div>
                    <div>## Heading 2</div>
                    <div>**Bold text**</div>
                    <div>*Italic text*</div>
                  </div>
                  <div>
                    <div>`code`</div>
                    <div>```javascript</div>
                    <div>console.log('code block');</div>
                    <div>```</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
