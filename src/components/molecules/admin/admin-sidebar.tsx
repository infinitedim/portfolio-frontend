"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/hooks/use-i18n";
import { getApiUrl } from "@/lib/api/get-api-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Languages,
  Key,
  Briefcase,
  UserCheck,
  History,
  Inbox,
  Mail,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
  Layers,
} from "lucide-react";

/**
 * Props for the AdminSidebar component.
 *
 * @interface AdminSidebarProps
 * @property {number} [unreadMessagesCount] - The number of unread contact messages to show as a badge on the Messages link.
 * @property {boolean} [mobileOpen] - Whether the mobile navigation drawer is currently open.
 * @property {() => void} [onMobileClose] - Callback invoked to close the mobile navigation drawer.
 */
export interface AdminSidebarProps {
  unreadMessagesCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Structure representing an individual navigation link within the admin sidebar.
 *
 * @interface NavItem
 * @property {string} label - Display name or localized string for the navigation link.
 * @property {string} href - Target URL or Next.js route path.
 * @property {React.ComponentType<{ className?: string }>} icon - Icon component rendered beside the link label.
 * @property {boolean} [isExternal] - Indicates whether the link targets an external destination opening in a new tab.
 * @property {string | number} [badge] - Optional badge counter or text tag shown alongside the link.
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
  badge?: string | number;
}

/**
 * Group of related navigation items with a category header.
 *
 * @interface NavGroup
 * @property {string} title - Section category heading label.
 * @property {NavItem[]} items - Array of navigation item entries belonging to this category.
 */
interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Admin navigation sidebar component.
 *
 * Provides hierarchical sectioned navigation across administration modules:
 * - Overview (Dashboard)
 * - Content (Blog Posts, Blog Series, Translations, CMS API)
 * - Portfolio (Projects, Experience i18n, About i18n)
 * - Communication (Inbox messages with unread counts, Newsletter subscribers)
 * - Security (Two-Factor Authentication)
 * - System (Portfolio snapshots, Grafana metrics, Scalar API docs)
 *
 * Supports collapsible rail layout mode, active route highlighting, user authentication state display,
 * and authenticated session logout.
 *
 * @param {AdminSidebarProps} props - Component properties.
 * @param {number} [props.unreadMessagesCount] - Number of unread inbox communications.
 * @param {boolean} [props.mobileOpen] - Whether the mobile navigation drawer is currently open.
 * @param {() => void} [props.onMobileClose] - Callback invoked to close the mobile navigation drawer.
 * @returns {React.JSX.Element} The rendered admin navigation sidebar.
 */
export function AdminSidebar({
  unreadMessagesCount = 0,
}: AdminSidebarProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { themeConfig } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      title: "Overview",
      items: [
        {
          label: t("adminDashboard") || "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          label: t("adminManagePosts") || "Blog Posts",
          href: "/admin/blog",
          icon: FileText,
        },
        {
          label: "Blog Series",
          href: "/admin/blog/series",
          icon: Layers,
        },
        {
          label: "Translations",
          href: "/admin/blog/translations",
          icon: Languages,
        },
        {
          label: t("adminHeadlessCMS") || "CMS API",
          href: "/admin/cms",
          icon: Key,
        },
      ],
    },
    {
      title: "Portfolio",
      items: [
        {
          label: "Projects",
          href: "/admin/projects",
          icon: FolderKanban,
        },
        {
          label: "Experience i18n",
          href: "/admin/experience",
          icon: Briefcase,
        },
        {
          label: "About i18n",
          href: "/admin/about",
          icon: UserCheck,
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          label: t("adminInbox") || "Messages",
          href: "/admin/messages",
          icon: Inbox,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        },
        {
          label: t("adminNewsletter") || "Newsletter",
          href: "/admin/newsletter",
          icon: Mail,
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          label: t("adminTwoFactor") || "Two-Factor Auth",
          href: "/admin/2fa",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          label: t("adminPortfolioHistory") || "Version Snapshots",
          href: "/admin/portfolio",
          icon: History,
        },
        ...(process.env.NEXT_PUBLIC_GRAFANA_URL
          ? [
              {
                label: "Grafana",
                href: process.env.NEXT_PUBLIC_GRAFANA_URL,
                icon: TrendingUp,
                isExternal: true,
              },
            ]
          : []),
        {
          label: "API Docs (Scalar)",
          href: `${getApiUrl()}/api/docs`,
          icon: BookOpen,
          isExternal: true,
        },
      ],
    },
  ];

  /**
   * Logs the current user out via `authService`, invalidating session tokens, and navigates to the login view.
   *
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };


  return (
    <aside
      className={`relative flex flex-col h-screen border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text,
      }}
    >
                    
      <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: themeConfig.colors.border }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-(--terminal-accent)/15 text-(--terminal-accent)">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-bold tracking-wider text-(--terminal-accent)">
              ADMIN PANEL
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 ml-auto text-(--terminal-muted) hover:text-(--terminal-text)"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

                      
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 font-mono text-xs">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2 text-[10px] font-semibold tracking-wider text-(--terminal-muted) uppercase">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => {
              const isActive = !item.isExternal && pathname === item.href;
              const Icon = item.icon;

              if (item.isExternal) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors hover:bg-(--terminal-accent)/10 hover:text-(--terminal-accent) ${
                      collapsed ? "justify-center" : ""
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-(--terminal-muted)" />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && <ExternalLink className="h-3 w-3 opacity-50" />}
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-(--terminal-accent)/15 text-(--terminal-accent) font-semibold border border-(--terminal-accent)/40"
                      : "hover:bg-(--terminal-accent)/10 hover:text-(--terminal-accent) text-(--terminal-text)"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-(--terminal-accent)" : "text-(--terminal-muted)"
                    }`}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <Badge variant="terminal" className="px-1.5 py-0 text-[10px]">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <Separator />

                         
      <div className="p-3 shrink-0 flex items-center justify-between gap-2">
        {!collapsed && (
          <div className="flex flex-col min-w-0 font-mono text-[11px]">
            <span className="font-semibold truncate text-(--terminal-text)">
              {user?.email ?? "admin"}
            </span>
            <span className="text-[10px] text-emerald-400 truncate">
              ● authenticated
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
          title={t("adminLogout") || "Logout"}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
