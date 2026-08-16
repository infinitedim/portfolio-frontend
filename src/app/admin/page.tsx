"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/hooks/use-i18n";
import { getApiUrl } from "@/lib/api/get-api-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Inbox,
  ShieldCheck,
  Mail,
  TrendingUp,
  Briefcase,
  FolderKanban,
  Plus,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  unreadMessages: number;
  newsletterSubscribers: number;
  totalProjects: number;
  totalPosts: number;
  loading: boolean;
}

export default function AdminDashboardPage() {
  const { themeConfig } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    unreadMessages: 0,
    newsletterSubscribers: 0,
    totalProjects: 0,
    totalPosts: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardStats = async () => {
      const apiUrl = getApiUrl();
      try {
        const [msgRes, newsRes, projRes, blogRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/admin/messages?unreadOnly=true`),
          fetch(`${apiUrl}/api/admin/newsletter/subscribers`),
          fetch(`${apiUrl}/api/portfolio`),
          fetch(`${apiUrl}/api/blog/posts`),
        ]);

        if (isMounted) {
          let unreadCount = 0;
          if (msgRes.status === "fulfilled" && msgRes.value.ok) {
            const data = await msgRes.value.json();
            unreadCount = Array.isArray(data) ? data.filter((m: { read?: boolean }) => !m.read).length : (data.unreadCount ?? 0);
          }

          let subCount = 0;
          if (newsRes.status === "fulfilled" && newsRes.value.ok) {
            const data = await newsRes.value.json();
            subCount = Array.isArray(data) ? data.length : (data.count ?? 0);
          }

          let projCount = 0;
          if (projRes.status === "fulfilled" && projRes.value.ok) {
            const data = await projRes.value.json();
            projCount = data.projects ? data.projects.length : (Array.isArray(data) ? data.length : 0);
          }

          let postCount = 0;
          if (blogRes.status === "fulfilled" && blogRes.value.ok) {
            const data = await blogRes.value.json();
            postCount = Array.isArray(data) ? data.length : (data.posts ? data.posts.length : 0);
          }

          setStats({
            unreadMessages: unreadCount,
            newsletterSubscribers: subCount,
            totalProjects: projCount,
            totalPosts: postCount,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchDashboardStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 font-mono text-sm max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div
        className="p-6 rounded-lg border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-(--terminal-accent)">
              {t("adminDashboard") || "Admin Overview"}
            </h1>
            <Badge variant="terminal" className="text-[10px] uppercase">
              {user?.role ?? "ADMIN"}
            </Badge>
          </div>
          <p className="text-xs text-(--terminal-muted)">
            Welcome back, <span className="text-(--terminal-text) font-semibold">{user?.email}</span>. Manage portfolio content, blog posts, messages, and system security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="terminal" size="sm" asChild className="gap-2">
            <Link href={"/admin/blog" as Route}>
              <Plus className="h-4 w-4" /> New Blog Post
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2 border-(--terminal-border)">
            <Link href={"/admin/messages" as Route}>
              <Inbox className="h-4 w-4" /> View Inbox
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards (Steady borders, NO hover scale) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Blog Posts */}
        <div
          className="p-4 rounded-lg border transition-colors hover:border-(--terminal-accent)/50 shadow-xs"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-(--terminal-muted)">Blog Articles</span>
            <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-(--terminal-text)">
            {stats.loading ? "..." : stats.totalPosts}
          </div>
          <div className="text-[11px] text-(--terminal-muted) mt-1 flex items-center gap-1">
            <Link href="/admin/blog" className="text-(--terminal-accent) hover:underline inline-flex items-center gap-1">
              Manage Articles <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stat 2: Unread Messages */}
        <div
          className="p-4 rounded-lg border transition-colors hover:border-(--terminal-accent)/50 shadow-xs"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-(--terminal-muted)">Unread Messages</span>
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-(--terminal-text)">
            {stats.loading ? "..." : stats.unreadMessages}
          </div>
          <div className="text-[11px] text-(--terminal-muted) mt-1">
            <Link href="/admin/messages" className="text-amber-400 hover:underline inline-flex items-center gap-1">
              Open Inbox <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stat 3: Newsletter Subscribers */}
        <div
          className="p-4 rounded-lg border transition-colors hover:border-(--terminal-accent)/50 shadow-xs"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-(--terminal-muted)">Subscribers</span>
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-400">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-(--terminal-text)">
            {stats.loading ? "..." : stats.newsletterSubscribers}
          </div>
          <div className="text-[11px] text-(--terminal-muted) mt-1">
            <Link href="/admin/newsletter" className="text-blue-400 hover:underline inline-flex items-center gap-1">
              Broadcast Email <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stat 4: Total Projects */}
        <div
          className="p-4 rounded-lg border transition-colors hover:border-(--terminal-accent)/50 shadow-xs"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-(--terminal-muted)">Portfolio Projects</span>
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-(--terminal-text)">
            {stats.loading ? "..." : stats.totalProjects}
          </div>
          <div className="text-[11px] text-(--terminal-muted) mt-1">
            <Link href="/admin/projects" className="text-emerald-400 hover:underline inline-flex items-center gap-1">
              Edit Projects <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Management Group */}
        <div
          className="p-5 rounded-lg border space-y-4"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <h2 className="text-sm font-bold text-(--terminal-accent) flex items-center gap-2">
            <FileText className="h-4 w-4" /> Content Workspace
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/blog"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Blog Posts Editor</div>
                <div className="text-[10px] text-(--terminal-muted)">Write, edit, and publish MDX articles</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href={"/admin/blog/series" as Route}
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Blog Series</div>
                <div className="text-[10px] text-(--terminal-muted)">Organize articles into structured series</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/blog/translations"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">AI Translations Review</div>
                <div className="text-[10px] text-(--terminal-muted)">Review and approve auto-generated translations</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/cms"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Headless CMS API</div>
                <div className="text-[10px] text-(--terminal-muted)">API keys and headless content documentation</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>
          </div>
        </div>

        {/* Portfolio & Profile Group */}
        <div
          className="p-5 rounded-lg border space-y-4"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <h2 className="text-sm font-bold text-(--terminal-accent) flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Portfolio & Profile
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/projects"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Manage Projects</div>
                <div className="text-[10px] text-(--terminal-muted)">Add projects, tech stacks, and SLA metrics</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/experience"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Experience i18n</div>
                <div className="text-[10px] text-(--terminal-muted)">Work history with AI auto-translation</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/about"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">About & Profile i18n</div>
                <div className="text-[10px] text-(--terminal-muted)">Bio, contact links, and location data</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/portfolio"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Version History Snapshots</div>
                <div className="text-[10px] text-(--terminal-muted)">Inspect and restore previous portfolio state</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>
          </div>
        </div>

        {/* Security & Communication Group */}
        <div
          className="p-5 rounded-lg border space-y-4"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          <h2 className="text-sm font-bold text-(--terminal-accent) flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Security & Outreach
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/messages"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Contact Inbox</div>
                <div className="text-[10px] text-(--terminal-muted)">View and manage visitor contact inquiries</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/newsletter"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Newsletter Subscribers</div>
                <div className="text-[10px] text-(--terminal-muted)">Manage audience list and send broadcasts</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            <Link
              href="/admin/2fa"
              className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
            >
              <div>
                <div className="font-semibold text-xs text-(--terminal-text)">Two-Factor Auth (2FA)</div>
                <div className="text-[10px] text-(--terminal-muted)">Configure TOTP authenticator security</div>
              </div>
              <ArrowRight className="h-4 w-4 text-(--terminal-muted)" />
            </Link>

            {process.env.NEXT_PUBLIC_GRAFANA_URL ? (
              <a
                href={process.env.NEXT_PUBLIC_GRAFANA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-md border border-(--terminal-border) hover:border-(--terminal-accent)/50 hover:bg-(--terminal-accent)/5 transition-colors"
              >
                <div>
                  <div className="font-semibold text-xs text-(--terminal-text)">Grafana Telemetry</div>
                  <div className="text-[10px] text-(--terminal-muted)">Prometheus and Loki metrics dashboards</div>
                </div>
                <TrendingUp className="h-4 w-4 text-(--terminal-muted)" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
