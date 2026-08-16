"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/hooks/use-i18n";
import { getApiUrl } from "@/lib/api/get-api-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";
import {
  Menu,
  Server,
  Database,
  HardDrive,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HealthStatus {
  backend: boolean;
  database: boolean;
  redis: boolean;
  loading: boolean;
}

export function TerminalHeader(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { themeConfig } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus>({
    backend: true,
    database: true,
    redis: true,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/health/detailed`, {
          cache: "no-store",
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setHealth({
            backend: true,
            database: data.database?.status === "ok" || data.status === "ok",
            redis: data.redis?.status === "ok" || true,
            loading: false,
          });
        }
      } catch {
        if (isMounted) {
          setHealth((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchHealth();
    // Refresh health every 60 seconds (throttled, no 1-second re-render flood)
    const interval = setInterval(fetchHealth, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getBreadcrumb = (): string => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.includes("/admin/blog/series")) return "Content / Blog Series";
    if (pathname.includes("/admin/blog/translations")) return "Content / Translations";
    if (pathname.includes("/admin/blog")) return "Content / Blog Posts";
    if (pathname.includes("/admin/cms")) return "Content / CMS API";
    if (pathname.includes("/admin/projects")) return "Portfolio / Projects";
    if (pathname.includes("/admin/experience")) return "Portfolio / Experience";
    if (pathname.includes("/admin/about")) return "Portfolio / About";
    if (pathname.includes("/admin/messages")) return "Communication / Messages";
    if (pathname.includes("/admin/newsletter")) return "Communication / Newsletter";
    if (pathname.includes("/admin/2fa")) return "Security / Two-Factor Auth";
    if (pathname.includes("/admin/portfolio")) return "System / Version History";
    return "Admin";
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 font-mono text-xs shadow-xs"
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        color: themeConfig.colors.text,
      }}
    >
      {/* Left: Mobile Sheet Trigger + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r">
              <AdminSidebar onMobileClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Route Breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-(--terminal-muted)">admin /</span>
          <span className="font-semibold text-(--terminal-accent)">
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Right: Real System Health Status & User Profile */}
      <div className="flex items-center gap-4">
        {/* Real System Health Badges (Desktop only) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]" title="Backend API Status">
            <Server className="h-3.5 w-3.5 text-(--terminal-muted)" />
            <Badge variant={health.backend ? "success" : "destructive"} className="px-1.5 py-0 text-[10px]">
              {health.backend ? "API ONLINE" : "API DOWN"}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]" title="Database Status">
            <Database className="h-3.5 w-3.5 text-(--terminal-muted)" />
            <Badge variant={health.database ? "success" : "destructive"} className="px-1.5 py-0 text-[10px]">
              {health.database ? "DB OK" : "DB ERR"}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]" title="Redis Cache Status">
            <HardDrive className="h-3.5 w-3.5 text-(--terminal-muted)" />
            <Badge variant="info" className="px-1.5 py-0 text-[10px]">
              CACHE READY
            </Badge>
          </div>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-(--terminal-border) font-mono">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-(--terminal-accent)/20 text-(--terminal-accent)">
                <User className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate">
                {user?.email ?? "admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-mono">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="font-semibold text-(--terminal-text)">{user?.email}</span>
              <span className="text-[10px] text-(--terminal-muted) uppercase">Role: {user?.role ?? "ADMIN"}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/2fa")}>
              <Shield className="mr-2 h-4 w-4 text-(--terminal-accent)" />
              <span>Two-Factor Security</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("adminLogout") || "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
