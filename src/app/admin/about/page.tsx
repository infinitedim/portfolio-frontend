"use client";

import { type JSX, useState, useEffect, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { getApiUrl } from "@/lib/api/get-api-url";
import { authService } from "@/lib/auth/auth-service";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { getSupportedLocales } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

  const apiUrl = getApiUrl();

  const fetchAboutData = useCallback(async () => {
    setLoading(true);
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
      toast.error(e instanceof Error ? e.message : "Failed to load About data");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  const handleGenerateTranslations = async () => {
    setTranslating(true);
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
        throw new Error(errJson?.error ?? errJson?.message ?? `HTTP ${res.status}`);
      }

      const translated = await res.json();
      setForm((prev) => ({
        ...prev,
        title: { ...prev.title, ...translated.title },
        bio: { ...prev.bio, ...translated.bio },
        location: { ...prev.location, ...translated.location },
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
      const payload = {
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
        method: "PUT",
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

      toast.success("About profile updated successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const missingLocalesCount = locales.filter(
    (loc) => !form.title[loc.code] || !form.bio[loc.code],
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-mono text-sm">
                        
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              About & Developer Profile (i18n)
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              Manage bio, titles, location, and social links with AI auto-translations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="h-8 gap-2 border-(--terminal-border)">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-(--terminal-muted) animate-pulse">
          Loading profile data...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
                                          
          <div
            className="p-6 rounded-lg border space-y-4"
            style={{
              backgroundColor: themeConfig.colors.bg,
              borderColor: themeConfig.colors.border,
            }}
          >
            <h2 className="text-sm font-bold text-(--terminal-accent) uppercase tracking-wider border-b pb-2 border-(--terminal-border)">
              Global Developer Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="about-name">Full Name *</Label>
                <Input
                  id="about-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dimas Saputra"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="about-email">Contact Email *</Label>
                <Input
                  id="about-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@infinitedim.dev"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="about-github">GitHub Profile URL</Label>
                <Input
                  id="about-github"
                  type="url"
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  placeholder="https://github.com/infinitedim"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="about-linkedin">LinkedIn Profile URL</Label>
                <Input
                  id="about-linkedin"
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/yourblooo"
                />
              </div>
            </div>
          </div>

                                           
          <div
            className="p-6 rounded-lg border space-y-4"
            style={{
              backgroundColor: themeConfig.colors.bg,
              borderColor: themeConfig.colors.border,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-(--terminal-border)">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-(--terminal-accent) uppercase tracking-wider">
                  Multilingual Profile
                </h2>
                <div role="status" aria-live="polite">
                  {missingLocalesCount > 0 && (
                    <Badge variant="warning" className="text-[10px]">
                      {missingLocalesCount} missing locales
                    </Badge>
                  )}
                </div>
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

                               
            <div className="flex flex-wrap items-center gap-2 pt-1" role="tablist" aria-label="Locale Selection Tabs">
              {locales.map((loc) => {
                const active = activeLocale === loc.code;
                const hasData = Boolean(form.title[loc.code] && form.bio[loc.code]);
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

                                          
            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`about-title-${activeLocale}`}>
                    Professional Title ({activeLocale})
                  </Label>
                  <Input
                    id={`about-title-${activeLocale}`}
                    value={form.title[activeLocale] || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: { ...form.title, [activeLocale]: e.target.value },
                      })
                    }
                    placeholder="Systems & Fullstack Engineer"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`about-loc-${activeLocale}`}>
                    Location ({activeLocale})
                  </Label>
                  <Input
                    id={`about-loc-${activeLocale}`}
                    value={form.location[activeLocale] || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: { ...form.location, [activeLocale]: e.target.value },
                      })
                    }
                    placeholder="Jakarta, Indonesia"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`about-bio-${activeLocale}`}>
                  Biography ({activeLocale})
                </Label>
                <Textarea
                  id={`about-bio-${activeLocale}`}
                  value={form.bio[activeLocale] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bio: { ...form.bio, [activeLocale]: e.target.value },
                    })
                  }
                  rows={5}
                  placeholder="Fullstack engineer focused on high-performance web systems..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" variant="terminal" size="lg" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving Profile..." : "Save About Profile"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
