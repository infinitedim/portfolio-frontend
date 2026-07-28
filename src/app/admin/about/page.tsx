"use client";

import { type JSX, useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Globe,
  Loader2,
  Sparkles,
} from "lucide-react";
import { getSupportedLocales } from "@/lib/i18n/locales";

interface AboutFormData {
  name: string;
  title: Record<string, string>;
  bio: Record<string, string>;
  location: Record<string, string>;
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
}

export default function AdminAboutPage(): JSX.Element {
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  
  const locales = getSupportedLocales();
  const [activeLocale, setActiveLocale] = useState<string>("en_US");

  const [form, setForm] = useState<AboutFormData>({
    name: "",
    title: {},
    bio: {},
    location: {},
    email: "",
    github: "",
    linkedin: "",
    twitter: "",
  });
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiUrl = getApiUrl();

  const fetchAboutData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = authService.getAccessToken();
      const res = await fetch(`${apiUrl}/api/admin/portfolio/about`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data ?? {};

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
        name: data.name ?? "Dimas Saputra",
        title: extractMap(data.title),
        bio: extractMap(data.bio),
        location: extractMap(data.location),
        email: data.contact?.email ?? "",
        github: data.contact?.github ?? "",
        linkedin: data.contact?.linkedin ?? "",
        twitter: data.contact?.twitter ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load About data");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  const handleGenerateTranslations = async () => {
    setTranslating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const token = authService.getAccessToken();
      const body = {
        sourceLocale: activeLocale,
        title: form.title[activeLocale] || "",
        bio: form.bio[activeLocale] || "",
        location: form.location[activeLocale] || "",
      };

      const res = await fetch(`${apiUrl}/api/admin/portfolio/about/translate`, {
        method: "POST",
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
      
      const translated = await res.json();
      setForm((prev) => ({
        ...prev,
        title: { ...prev.title, ...translated.title },
        bio: { ...prev.bio, ...translated.bio },
        location: { ...prev.location, ...translated.location },
      }));

      setSuccessMessage("Translations generated successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate translations");
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const token = authService.getAccessToken();
      const body = {
        name: form.name,
        title: form.title,
        bio: form.bio,
        location: form.location,
        contact: {
          email: form.email,
          github: form.github,
          linkedin: form.linkedin,
          twitter: form.twitter,
        },
      };

      const res = await fetch(`${apiUrl}/api/admin/portfolio/about`, {
        method: "POST",
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

      setSuccessMessage("About section saved successfully!");
      await fetchAboutData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getMissingLocalesCount = () => {
    let count = 0;
    locales.forEach((l) => {
      if (!form.title[l.code] || !form.bio[l.code] || !form.location[l.code]) {
        count++;
      }
    });
    return count;
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
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
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
                admin@portfolio:~$ manage-about
              </span>
              <div className="w-12" />
            </div>

            {/* Content */}
            <div
              className="p-4 md:p-6"
              style={{ backgroundColor: themeConfig.colors.bg }}
            >
              {/* Header with back */}
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
                    about
                  </h1>
                </div>
                {getMissingLocalesCount() > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {getMissingLocalesCount()} locales missing
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-xs"
                    style={{
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      color: "#22c55e",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    All {locales.length} locales active
                  </span>
                )}
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

              {loading ? (
                <div className="flex items-center gap-2 font-mono text-sm opacity-50 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading About section data...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Universal fields */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-sm font-semibold" style={{ color: themeConfig.colors.accent }}>
                      Universal Fields
                    </h3>
                    <div>
                      <label
                        htmlFor="about-name"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Full Name
                      </label>
                      <input
                        id="about-name"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="Dimas Saputra"
                      />
                    </div>
                  </div>

                  {/* Localized fields */}
                  <div className="space-y-4 pt-4 border-t" style={{ borderColor: `${themeConfig.colors.border}60` }}>
                    <div className="flex items-center justify-between">
                       <h3 className="font-mono text-sm font-semibold" style={{ color: themeConfig.colors.accent }}>
                        Localized Fields
                      </h3>
                      <button
                        type="button"
                        onClick={handleGenerateTranslations}
                        disabled={translating || !form.title[activeLocale] || !form.bio[activeLocale]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all disabled:opacity-40 hover:opacity-80"
                        style={{
                          backgroundColor: `${themeConfig.colors.accent}20`,
                          color: themeConfig.colors.accent,
                          border: `1px solid ${themeConfig.colors.accent}40`,
                        }}
                      >
                        {translating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {translating ? "Translating..." : "Generate Translations"}
                      </button>
                    </div>

                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
                      {locales.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => setActiveLocale(l.code)}
                          className="px-3 py-1.5 rounded font-mono text-xs whitespace-nowrap transition-colors"
                          style={{
                            backgroundColor: activeLocale === l.code ? themeConfig.colors.accent : `${themeConfig.colors.border}30`,
                            color: activeLocale === l.code ? themeConfig.colors.bg : themeConfig.colors.text,
                            border: `1px solid ${activeLocale === l.code ? themeConfig.colors.accent : themeConfig.colors.border}`,
                            opacity: activeLocale === l.code ? 1 : 0.7,
                          }}
                        >
                          {l.flag} {l.name}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="about-title"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          Professional Title
                        </label>
                        <input
                          id="about-title"
                          type="text"
                          value={form.title[activeLocale] || ""}
                          onChange={(e) =>
                            setForm({ ...form, title: { ...form.title, [activeLocale]: e.target.value } })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                          placeholder="Full-Stack Developer"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="about-location"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          Location
                        </label>
                        <input
                          id="about-location"
                          type="text"
                          value={form.location[activeLocale] || ""}
                          onChange={(e) =>
                            setForm({ ...form, location: { ...form.location, [activeLocale]: e.target.value } })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                          placeholder="Indonesia"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="about-bio"
                        className="block font-mono text-xs mb-1 opacity-70"
                      >
                        Bio Description
                      </label>
                      <textarea
                        id="about-bio"
                        value={form.bio[activeLocale] || ""}
                        onChange={(e) =>
                          setForm({ ...form, bio: { ...form.bio, [activeLocale]: e.target.value } })
                        }
                        rows={5}
                        className="w-full px-3 py-2 rounded font-mono text-sm resize-y"
                        style={{
                          backgroundColor: `${themeConfig.colors.border}40`,
                          border: `1px solid ${themeConfig.colors.border}`,
                          color: themeConfig.colors.text,
                        }}
                        placeholder="A software developer with nearly three years of professional experience..."
                      />
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="pt-4 border-t" style={{ borderColor: `${themeConfig.colors.border}60` }}>
                    <h3 className="font-mono text-sm font-semibold mb-3" style={{ color: themeConfig.colors.accent }}>
                      Contact Links (Universal)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="about-email"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          Email Address
                        </label>
                        <input
                          id="about-email"
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                          placeholder="dragdimas9@gmail.com"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="about-github"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          GitHub URL
                        </label>
                        <input
                          id="about-github"
                          type="url"
                          value={form.github}
                          onChange={(e) =>
                            setForm({ ...form, github: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                          placeholder="https://github.com/infinitedim"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="about-linkedin"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          LinkedIn URL
                        </label>
                        <input
                          id="about-linkedin"
                          type="url"
                          value={form.linkedin}
                          onChange={(e) =>
                            setForm({ ...form, linkedin: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                          placeholder="https://linkedin.com/in/infinitedim"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="about-twitter"
                          className="block font-mono text-xs mb-1 opacity-70"
                        >
                          Twitter / X URL (Optional)
                        </label>
                        <input
                          id="about-twitter"
                          type="url"
                          value={form.twitter}
                          onChange={(e) =>
                            setForm({ ...form, twitter: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded font-mono text-sm"
                          style={{
                            backgroundColor: `${themeConfig.colors.border}40`,
                            border: `1px solid ${themeConfig.colors.border}`,
                            color: themeConfig.colors.text,
                          }}
                          placeholder="https://x.com/infinitedim"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-6 border-t" style={{ borderColor: `${themeConfig.colors.border}60` }}>
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-mono text-sm transition-all disabled:opacity-40 hover:opacity-90"
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
                      {saving ? "Saving..." : "Save About Section"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
