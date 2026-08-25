"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  listAdminSeries,
  createAdminSeries,
  updateAdminSeries,
  deleteAdminSeries,
  type BlogSeriesSummary,
} from "@/lib/services/series-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/molecules/admin/confirm-dialog";
import { toast } from "sonner";
import { Layers, Plus, Pencil, Trash, RefreshCw, FolderKanban } from "lucide-react";

/**
 * Administrator dashboard page for managing blog article series collections.
 *
 * @description
 * Provides a comprehensive CRUD management interface for organizing related blog posts into structured series:
 * - Lists all existing series with article count metrics, slugs, and creation timestamps.
 * - Opens a creation / edition modal dialog with automated URL slug generation from the series title.
 * - Allows updating series titles, slugs, and optional descriptions.
 * - Provides confirmation dialogs for safely deleting series without deleting constituent blog posts.
 *
 * @returns {JSX.Element} The rendered blog series administration view.
 */
export default function BlogSeriesAdminPage() {
  const { themeConfig } = useTheme();
  const [seriesList, setSeriesList] = useState<BlogSeriesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

                  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<BlogSeriesSummary | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

                 
  const [deleteSeriesItem, setDeleteSeriesItem] = useState<BlogSeriesSummary | null>(null);

  const loadSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminSeries();
      setSeriesList(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load series";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleOpenCreate = () => {
    setEditingSeries(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (item: BlogSeriesSummary) => {
    setEditingSeries(item);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setFormDialogOpen(true);
  };

  const generateSlug = (raw: string): string => {
    return raw
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSeries) {
        await updateAdminSeries(editingSeries.id, {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Blog series updated successfully");
      } else {
        await createAdminSeries({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Blog series created successfully");
      }
      setFormDialogOpen(false);
      await loadSeries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSeriesItem) return;
    try {
      await deleteAdminSeries(deleteSeriesItem.id);
      toast.success(`Deleted series "${deleteSeriesItem.title}"`);
      setDeleteSeriesItem(null);
      await loadSeries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete series";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 font-mono text-sm max-w-7xl mx-auto">
                        
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              Blog Series Management
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              Group related blog articles into structured multi-part series collections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSeries}
            disabled={loading}
            className="gap-2 border-(--terminal-border)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="terminal" size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Create New Series
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-xs">
          {error}
        </div>
      )}

                               
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Series Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-(--terminal-muted)">
                  Loading blog series collections...
                </TableCell>
              </TableRow>
            ) : seriesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-(--terminal-muted)">
                  <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No blog series created yet.</p>
                </TableCell>
              </TableRow>
            ) : (
              seriesList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-(--terminal-text)">
                    {item.title}
                    {item.description && (
                      <span className="block text-[11px] font-normal text-(--terminal-muted) truncate max-w-xs mt-0.5">
                        {item.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-(--terminal-accent)">
                    {item.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="terminal" className="text-xs">
                      {item.postCount} post{item.postCount === 1 ? "" : "s"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-(--terminal-muted)">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 text-(--terminal-accent)"
                        title="Edit Series"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSeriesItem(item)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete Series"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

                                       
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md font-mono text-xs">
          <DialogHeader>
            <DialogTitle>
              {editingSeries ? "Edit Blog Series" : "Create New Blog Series"}
            </DialogTitle>
            <DialogDescription>
              Series allow you to group related blog posts sequentially.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="series-title">Series Title *</Label>
              <Input
                id="series-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingSeries) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="e.g. Building Rust APIs with Axum"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="series-slug">Slug (URL path) *</Label>
              <Input
                id="series-slug"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="building-rust-apis-with-axum"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="series-desc">Description (Optional)</Label>
              <Textarea
                id="series-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A comprehensive guide to building production Rust backends..."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFormDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="terminal" size="sm" disabled={submitting}>
                {submitting ? "Saving..." : editingSeries ? "Update Series" : "Create Series"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

                                   
      <ConfirmDialog
        open={Boolean(deleteSeriesItem)}
        onOpenChange={(open) => !open && setDeleteSeriesItem(null)}
        title="Delete Blog Series"
        description={`Are you sure you want to delete "${deleteSeriesItem?.title}"? Posts inside the series will not be deleted, but will be unlinked.`}
        confirmLabel="Delete Series"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
