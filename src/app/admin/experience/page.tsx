"use client";

import { type JSX, useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Globe,
  Loader2,
} from "lucide-react";

interface ExperienceEntry {
  id: string;
  company: string;
  position: Record<string, string>;
  duration: Record<string, string>;
  description: Record<string, string[]>;
  technologies: string[];
  type: string;
  display_order: number;
}

interface ExperienceForm {
  company: string;
  position: string;
  duration: string;
  description: string;
  technologies: string;
  type: string;
  display_order: number;
}

const EMPTY_FORM: ExperienceForm = {
  company: "",
  position: "",
  duration: "",
  description: "",
  technologies: "",
  type: "full-time",
  display_order: 0,
};

export default function AdminExperiencePage(): JSX.Element {
  const { themeConfig } = useTheme();
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExperienceForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiUrl = getApiUrl();

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getAccessToken();
      const res = await fetch(`${apiUrl}/api/admin/portfolio/experience`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setExperiences(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load experiences");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const token = authService.getAccessToken();
      const body = {
        company: form.company,
        position: form.position,
        duration: form.duration,
        description: form.description
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        technologies: form.technologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        type: form.type,
        displayOrder: form.display_order,
      };

      const url = editingId
        ? `${apiUrl}/api/admin/portfolio/experience/${editingId}`
        : `${apiUrl}/api/admin/portfolio/experience`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error ?? errJson?.message ?? `HTTP ${res.status}`,
        );
      }

      setSuccessMessage(
        editingId
          ? "Experience updated & auto-translated!"
          : "Experience created & auto-translated to 17 locales!",
      );
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchExperiences();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (exp: ExperienceEntry) => {
    setEditingId(exp.id);
    setForm({
      company: exp.company,
      position: exp.position?.en_US ?? Object.values(exp.position)[0] ?? "",
      duration: exp.duration?.en_US ?? Object.values(exp.duration)[0] ?? "",
      description:
        (exp.description?.en_US ?? Object.values(exp.description)[0] ?? [])
          .join("\n"),
      technologies: exp.technologies.join(", "),
      type: exp.type,
      display_order: exp.display_order,
    });
    setShowForm(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    try {
      const token = authService.getAccessToken();
      const res = await fetch(
        `${apiUrl}/api/admin/portfolio/experience/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccessMessage("Experience deleted.");
      await fetchExperiences();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const localeCount = (exp: ExperienceEntry): number => {
    if (!exp.position || typeof exp.position !== "object") return 0;
    return Object.keys(exp.position).length;
  };

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
        <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
          {/* Terminal window */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: themeConfig.colors.border }}
          >
            {/* Title bar */}
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{
                borderColor: themeConfig.colors.border,
                backgroundColor: themeConfig.colors.bg,
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span
                className="font-mono text-xs opacity-70"
                style={{ color: themeConfig.colors.text }}
              >
                admin@portfolio:~$ manage-experience
              </span>
              <div className="w-12" />
            </div>

            {/* Content */}
            <div
              className="p-4 md:p-6"
              style={{ backgroundColor: themeConfig.colors.bg }}
            >
              {/* Header with actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 font-mono text-sm opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    back
                  </Link>
                  <h1
                    className="font-mono text-xl font-bold"
                    style={{ color: themeConfig.colors.text }}
                  >
                    <span style={{ color: themeConfig.colors.accent }}>~/</span>
                    experience
                  </h1>
                </div>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded font-mono text-sm transition-colors"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}20`,
                    color: themeConfig.colors.accent,
                    border: `1px solid ${themeConfig.colors.accent}40`,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  new
                </button>
              </div>

              {/* Messages */}
              {error && (
                <div
                  className="mb-4 p-3 rounded font-mono text-sm"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                  }}
                >
                  {error}
                </div>
              )}
              {successMessage && (
                <div
                  className="mb-4 p-3 rounded font-mono text-sm"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}10`,
                    border: `1px solid ${themeConfig.colors.accent}30`,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {successMessage}
                </div>
              )}

              {/* Form */}
              {showForm && (
                <div
                  className="mb-6 p-4 rounded-lg border"
                  style={{
                    borderColor: themeConfig.colors.border,
                    backgroundColor: `${themeConfig.colors.bg}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      className="font-mono text-sm font-semibold"
                      style={{ color: themeConfig.colors.accent }}
                    >
                      $ {editingId ? "edit" : "create"} --experience
                    </h2>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="exp-company"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Company
                      </label>
                      <input
                        id="exp-company"
                        type="text"
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="PT Voltras International"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="exp-position"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Position (English)
                      </label>
                      <input
                        id="exp-position"
                        type="text"
                        value={form.position}
                        onChange={(e) =>
                          setForm({ ...form, position: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="Software Developer"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="exp-duration"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Duration (English)
                      </label>
                      <input
                        id="exp-duration"
                        type="text"
                        value={form.duration}
                        onChange={(e) =>
                          setForm({ ...form, duration: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="June 2023 - Present"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="exp-description"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Description (one bullet per line, English)
                      </label>
                      <textarea
                        id="exp-description"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={4}
                        className="w-full px-3 py-2 rounded font-mono text-sm resize-y"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="Developed and maintained cross-platform mobile applications&#10;Engineered a reusable seat mapping system"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="exp-technologies"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Technologies (comma-separated)
                      </label>
                      <input
                        id="exp-technologies"
                        type="text"
                        value={form.technologies}
                        onChange={(e) =>
                          setForm({ ...form, technologies: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="Flutter, Kubernetes, Grafana"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label
                          htmlFor="exp-type"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          Type
                        </label>
                        <select
                          id="exp-type"
                          value={form.type}
                          onChange={(e) =>
                            setForm({ ...form, type: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                        >
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="freelance">Freelance</option>
                          <option value="intern">Intern</option>
                        </select>
                      </div>
                      <div className="w-32">
                        <label
                          htmlFor="exp-order"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          Order
                        </label>
                        <input
                          id="exp-order"
                          type="number"
                          value={form.display_order}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              display_order: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleSubmit}
                        disabled={saving || !form.company || !form.position}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all disabled:opacity-40"
                        style={{
                          backgroundColor: themeConfig.colors.accent,
                          color: themeConfig.colors.bg,
                        }}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving
                          ? "Translating to 17 locales..."
                          : editingId
                            ? "Save & Re-translate"
                            : "Save & Auto-Translate"}
                      </button>
                      <span
                        className="font-mono text-xs opacity-50"
                        aria-live="polite"
                      >
                        {saving
                          ? "AI is translating your content..."
                          : "Input in English — AI translates to 17 languages"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Experience list */}
              {loading ? (
                <div className="flex items-center gap-2 font-mono text-sm opacity-50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading experiences...
                </div>
              ) : experiences.length === 0 ? (
                <div className="font-mono text-sm opacity-50">
                  No experience entries yet. Click "new" to add one.
                </div>
              ) : (
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-lg border transition-colors hover:border-opacity-60"
                      style={{
                        borderColor: themeConfig.colors.border,
                        backgroundColor: `${themeConfig.colors.border}10`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className="font-mono text-sm font-semibold"
                              style={{ color: themeConfig.colors.text }}
                            >
                              {exp.position?.en_US ??
                                Object.values(exp.position)[0] ??
                                "—"}
                            </h3>
                            <span
                              className="px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider"
                              style={{
                                backgroundColor: `${themeConfig.colors.accent}15`,
                                color: themeConfig.colors.accent,
                                border: `1px solid ${themeConfig.colors.accent}30`,
                              }}
                            >
                              {exp.type}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px]"
                              style={{
                                backgroundColor: "rgba(96, 165, 250, 0.1)",
                                color: "rgb(96, 165, 250)",
                                border: "1px solid rgba(96, 165, 250, 0.2)",
                              }}
                            >
                              <Globe className="w-3 h-3" />
                              {localeCount(exp)} locales
                            </span>
                          </div>
                          <p
                            className="font-mono text-xs mt-1"
                            style={{ color: themeConfig.colors.accent }}
                          >
                            @ {exp.company}
                          </p>
                          <p className="font-mono text-xs opacity-50 mt-0.5">
                            {exp.duration?.en_US ??
                              Object.values(exp.duration)[0] ??
                              "—"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exp.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                                style={{
                                  backgroundColor: `${themeConfig.colors.accent}08`,
                                  color: themeConfig.colors.accent,
                                  border: `1px solid ${themeConfig.colors.accent}20`,
                                }}
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-3">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="p-1.5 rounded transition-colors hover:bg-white/5"
                            title="Edit"
                          >
                            <Pencil
                              className="w-3.5 h-3.5"
                              style={{ color: themeConfig.colors.accent }}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 rounded transition-colors hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
