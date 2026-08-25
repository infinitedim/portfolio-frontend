"use client";

import { type JSX, useState, useEffect, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  X,
  Globe,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Briefcase,
} from "lucide-react";
import { getSupportedLocales } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/molecules/admin/confirm-dialog";
import { toast } from "sonner";

/**
 * Data model for a career work experience record stored in the database.
 *
 * @description
 * Represents a localized employment entry containing company details, multilingual position titles,
 * durations, bullet point descriptions, tech stack tags, employment classification, and sequence sorting index.
 */
interface ExperienceEntry {
  /** Unique record identifier (UUID) */
  id: string;
  /** Company or organization name */
  company: string;
  /** Map of locale code to localized job title (e.g. `{"en_US": "Senior Engineer"}`) */
  position: Record<string, string>;
  /** Map of locale code to localized employment tenure (e.g. `{"en_US": "2022 - Present"}`) */
  duration: Record<string, string>;
  /** Map of locale code to localized list of responsibility bullet points */
  description: Record<string, string[]>;
  /** Array of associated technology and skill keywords */
  technologies: string[];
  /** Employment type classification (e.g., "full-time", "contract") */
  type: string;
  /** Display sort order index for chronological rendering */
  display_order: number;
}

/**
 * State shape for the work experience creation and editing form.
 *
 * @description
 * Form fields match the database model, with textarea-friendly newline-separated string descriptions
 * and comma-separated technology tags for streamlined editing before payload serialization.
 */
interface ExperienceForm {
  /** Company or organization name */
  company: string;
  /** Map of locale code to localized position title */
  position: Record<string, string>;
  /** Map of locale code to localized employment duration */
  duration: Record<string, string>;
  /** Map of locale code to localized newline-separated description string */
  description: Record<string, string>;
  /** Comma-separated list of technologies */
  technologies: string;
  /** Employment type (e.g. "full-time") */
  type: string;
  /** Numeric display sequence order */
  display_order: number;
}

/**
 * Default empty form state used when initializing a new experience entry.
 */
const EMPTY_FORM: ExperienceForm = {
  company: "",
  position: {},
  duration: {},
  description: {},
  technologies: "",
  type: "full-time",
  display_order: 0,
};

/**
 * Administrator dashboard page for managing work experience and career timeline entries.
 *
 * @description
 * Provides a comprehensive CRUD management interface for developer work history:
 * - Lists existing work experiences with locale coverage badges and reordering controls (move up / down).
 * - Multi-tab localized editor for modifying company, job title, duration, responsibilities, and tech stack per locale.
 * - AI auto-translation integration (`/api/admin/portfolio/experience/translate`) to translate experience details
 * from a source locale to all configured locales.
 * - Deletion modal dialog with confirmation handling.
 *
 * @returns {JSX.Element} The rendered career experience administration view.
 */
export default function AdminExperiencePage(): JSX.Element {
  const { themeConfig } = useTheme();
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExperienceForm>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const locales = getSupportedLocales();
  const [activeLocale, setActiveLocale] = useState<string>("en_US");

  const apiUrl = getApiUrl();

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    try {
      const token = authService.getAccessToken();
      const res = await fetch(`${apiUrl}/api/admin/portfolio/experience`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const sorted = (json.data ?? []).sort((a: ExperienceEntry, b: ExperienceEntry) => a.display_order - b.display_order);
      setExperiences(sorted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load experiences");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleGenerateTranslations = async () => {
    setTranslating(true);
    try {
      const token = authService.getAccessToken();
      const body = {
        sourceLocale: activeLocale,
        position: form.position[activeLocale] || "",
        duration: form.duration[activeLocale] || "",
        description: (form.description[activeLocale] || "").split("\n").filter(Boolean),
      };

      const res = await fetch(`${apiUrl}/api/admin/portfolio/experience/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error ?? errJson?.message ?? `HTTP ${res.status}`);
      }

      const translated = await res.json();
      const descMap: Record<string, string> = {};
      for (const loc in translated.description) {
        descMap[loc] = translated.description[loc].join("\n");
      }

      setForm((prev) => ({
        ...prev,
        position: { ...prev.position, ...translated.position },
        duration: { ...prev.duration, ...translated.duration },
        description: { ...prev.description, ...descMap },
      }));

      toast.success("AI Translations generated successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate translations");
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = authService.getAccessToken();
      const descObj: Record<string, string[]> = {};
      for (const loc in form.description) {
        descObj[loc] = form.description[loc].split("\n").filter(Boolean);
      }

      const payload = {
        company: form.company,
        position: form.position,
        duration: form.duration,
        description: descObj,
        technologies: form.technologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        type: form.type,
        display_order: form.display_order,
      };

      const url = editingId
        ? `${apiUrl}/api/admin/portfolio/experience/${editingId}`
        : `${apiUrl}/api/admin/portfolio/experience`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error ?? `HTTP ${res.status}`);
      }

      toast.success(editingId ? "Experience entry updated!" : "Experience entry created!");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchExperiences();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save experience");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (exp: ExperienceEntry) => {
    setEditingId(exp.id);
    const descMap: Record<string, string> = {};
    if (exp.description) {
      for (const loc in exp.description) {
        descMap[loc] = exp.description[loc].join("\n");
      }
    }

    const extractMap = (val: unknown): Record<string, string> => {
      if (typeof val === "object" && val !== null) {
        return val as Record<string, string>;
      }
      if (typeof val === "string") {
        return { en_US: val };
      }
      return {};
    };

    setForm({
      company: exp.company,
      position: extractMap(exp.position),
      duration: extractMap(exp.duration),
      description: descMap,
      technologies: exp.technologies.join(", "),
      type: exp.type,
      display_order: exp.display_order,
    });
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const token = authService.getAccessToken();
      const res = await fetch(`${apiUrl}/api/admin/portfolio/experience/${deleteConfirmId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Experience entry deleted.");
      setDeleteConfirmId(null);
      await fetchExperiences();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete experience");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= experiences.length) return;

    const newExps = [...experiences];
    const temp = newExps[index]!;
    newExps[index] = newExps[targetIndex]!;
    newExps[targetIndex] = temp;

                                  
    newExps.forEach((exp, idx) => {
      exp.display_order = idx;
    });

    setExperiences(newExps);

    try {
      const token = authService.getAccessToken();
      await Promise.all(
        newExps.map((exp) =>
          fetch(`${apiUrl}/api/admin/portfolio/experience/${exp.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(exp),
          }),
        ),
      );
      toast.success("Experience order updated!");
    } catch {
      toast.error("Failed to persist experience reorder");
    }
  };

  const localeCount = (exp: ExperienceEntry): number => {
    if (!exp.position || typeof exp.position !== "object") return 0;
    return Object.keys(exp.position).length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-sm">
                        
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              Work Experience Management (i18n)
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              Manage multilingual career experience entries with AI auto-translation support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="h-8 gap-2 border-(--terminal-border)">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <Button
            variant="terminal"
            size="sm"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(EMPTY_FORM);
            }}
            className="h-8 gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Experience
          </Button>
        </div>
      </div>

                                    
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-lg border space-y-6"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.accent,
          }}
        >
          <div className="flex items-center justify-between border-b pb-3 border-(--terminal-border)">
            <h2 className="text-base font-bold text-(--terminal-accent)">
              {editingId ? "Edit Experience Entry" : "Create New Experience Entry"}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="h-8 w-8 text-(--terminal-muted)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-company">Company / Organization *</Label>
              <Input
                id="exp-company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp-type">Employment Type</Label>
                <Input
                  id="exp-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="full-time / contract"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-technologies">Tech Stack (comma separated)</Label>
                <Input
                  id="exp-technologies"
                  value={form.technologies}
                  onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                  placeholder="Rust, Next.js, GCP"
                />
              </div>
            </div>
          </div>

                                   
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-(--terminal-border)">
              <div className="flex items-center gap-2" role="tablist" aria-label="Locale Tabs">
                {locales.map((loc) => {
                  const active = activeLocale === loc.code;
                  const hasData =
                    form.position[loc.code] ||
                    form.duration[loc.code] ||
                    form.description[loc.code];
                  return (
                    <button
                      key={loc.code}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveLocale(loc.code)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                        active
                          ? "bg-(--terminal-accent)/20 text-(--terminal-accent) border border-(--terminal-accent)/40 font-bold"
                          : "border border-(--terminal-border) text-(--terminal-muted) hover:text-(--terminal-text)"
                      }`}
                    >
                      <span>{loc.name}</span>
                      {hasData && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateTranslations}
                disabled={translating}
                className="gap-1.5 text-xs border-(--terminal-accent)/40 text-(--terminal-accent)"
              >
                {translating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI Auto-Translate ({activeLocale} → All)
              </Button>
            </div>

                                        
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`exp-pos-${activeLocale}`}>
                    Position ({activeLocale}) *
                  </Label>
                  <Input
                    id={`exp-pos-${activeLocale}`}
                    value={form.position[activeLocale] || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        position: { ...form.position, [activeLocale]: e.target.value },
                      })
                    }
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`exp-dur-${activeLocale}`}>
                    Duration ({activeLocale})
                  </Label>
                  <Input
                    id={`exp-dur-${activeLocale}`}
                    value={form.duration[activeLocale] || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration: { ...form.duration, [activeLocale]: e.target.value },
                      })
                    }
                    placeholder="e.g. 2022 - Present"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`exp-desc-${activeLocale}`}>
                  Bullet Points Description ({activeLocale}) — One point per line
                </Label>
                <Textarea
                  id={`exp-desc-${activeLocale}`}
                  value={form.description[activeLocale] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: { ...form.description, [activeLocale]: e.target.value },
                    })
                  }
                  rows={4}
                  placeholder="Architected distributed microservices in Rust..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--terminal-border)">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="terminal" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Experience" : "Save Experience"}
            </Button>
          </div>
        </form>
      )}

                             
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-(--terminal-muted) animate-pulse">
            Loading experience entries...
          </div>
        ) : experiences.length === 0 ? (
          <div className="p-12 text-center text-xs text-(--terminal-muted) border border-dashed rounded-lg">
            No work experience entries recorded yet.
          </div>
        ) : (
          experiences.map((exp, index) => (
            <div
              key={exp.id}
              className="p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-(--terminal-accent)/40"
              style={{
                backgroundColor: themeConfig.colors.bg,
                borderColor: themeConfig.colors.border,
              }}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-(--terminal-text)">
                    {exp.company}
                  </span>
                  <Badge variant="terminal" className="text-[10px] uppercase">
                    {exp.type}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Globe className="h-3 w-3" /> {localeCount(exp)} / {locales.length} Locales
                  </Badge>
                </div>

                <div className="text-xs text-(--terminal-accent) font-semibold">
                  {exp.position["en_US"] || Object.values(exp.position)[0] || "No position title"}
                  {" • "}
                  <span className="font-normal text-(--terminal-muted)">
                    {exp.duration["en_US"] || Object.values(exp.duration)[0] || "No duration"}
                  </span>
                </div>

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {exp.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-[10px]">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

                                              
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, "up")}
                    className="h-6 w-6 text-(--terminal-muted) hover:text-(--terminal-text)"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === experiences.length - 1}
                    onClick={() => handleMoveOrder(index, "down")}
                    className="h-6 w-6 text-(--terminal-muted) hover:text-(--terminal-text)"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(exp)}
                  className="h-8 gap-1 border-(--terminal-border)"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(exp.id)}
                  className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Experience Entry"
        description="Are you sure you want to delete this experience entry? This action cannot be undone."
        confirmLabel="Delete Experience"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
