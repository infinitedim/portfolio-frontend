"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { AdminSidebar } from "@/components/molecules/admin/admin-sidebar";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { LoadingSpinner } from "@/components/atoms/shared/loading-spinner";

/**
 * Properties for the {@link AdminLayoutInner} layout wrapper component.
 */
interface AdminLayoutInnerProps {
  /** The child React nodes representing admin subpages to render within the layout */
  children: React.ReactNode;
}

/**
 * Set of administrative route pathnames that are publicly accessible without authentication.
 *
 * @description
 * Requests to paths in this set (such as `/admin/login` and `/admin/register`) bypass
 * the authenticated layout wrapper and authentication redirect guards.
 */
const PUBLIC_ADMIN_PATHS: ReadonlySet<string> = new Set([
  "/admin/login",
  "/admin/register",
]);

/**
 * Evaluates whether a given URL pathname belongs to the public admin route whitelist.
 *
 * @param pathname - The current URL pathname or null.
 * @returns `true` if the pathname matches a public admin route; otherwise `false`.
 */
function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_ADMIN_PATHS.has(pathname);
}

/**
 * Core client layout container for the administrative dashboard area.
 *
 * @description
 * Enforces route-level authentication guards and manages structural layout presentation:
 * - Allows unrestricted access to unauthenticated public admin routes (login, register).
 * - Displays a loading spinner while authentication state is resolving.
 * - Redirects unauthenticated visitors attempting to access protected admin views to `/admin/login`.
 * - Renders the responsive administrator shell with {@link AdminSidebar} and {@link TerminalHeader}
 * for authenticated sessions.
 *
 * @param props - Layout props containing child route content.
 * @param props.children - The child React nodes representing admin subpages to render within the layout.
 * @returns {React.JSX.Element} The rendered admin layout or fallback view.
 */
export function AdminLayoutInner({
  children,
}: AdminLayoutInnerProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { themeConfig } = useTheme();

  const publicPath = isPublicPath(pathname);

  useEffect(() => {
    if (publicPath) return;
    if (isLoading) return;
    if (!isAuthenticated) {
      const t = setTimeout(() => {
        router.push("/admin/login");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [publicPath, isAuthenticated, isLoading, router]);

                                                                               
  if (publicPath) {
    return <>{children}</>;
  }

                                                                          
  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center font-mono text-sm"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" text="Verifying authentication..." />
        </div>
      </div>
    );
  }

                                                                          
  if (isAuthenticated) {
    return (
      <div
        className="flex min-h-screen overflow-hidden"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
                                                                                   
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

                                      
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TerminalHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    );
  }

  return <></>;
}
