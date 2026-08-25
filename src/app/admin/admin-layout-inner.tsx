"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { AdminSidebar } from "@/components/molecules/admin/admin-sidebar";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { LoadingSpinner } from "@/components/atoms/shared/loading-spinner";

interface AdminLayoutInnerProps {
  children: React.ReactNode;
}

const PUBLIC_ADMIN_PATHS: ReadonlySet<string> = new Set([
  "/admin/login",
  "/admin/register",
]);

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_ADMIN_PATHS.has(pathname);
}

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
