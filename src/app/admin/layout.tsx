"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin pages that don't require an authenticated session. Any path not in
 * this set is gated behind `useAuth().isAuthenticated`.
 *
 * `/admin/register` is included so the very first admin user can create an
 * account when no session yet exists. The backend separately enforces the
 * "registration is closed once an admin exists" rule, so leaving this open
 * here is safe.
 */
const PUBLIC_ADMIN_PATHS: ReadonlySet<string> = new Set([
  "/admin/login",
  "/admin/register",
]);

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_ADMIN_PATHS.has(pathname);
}

export default function AdminLayout({
  children,
}: AdminLayoutProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const publicPath = isPublicPath(pathname);

  useEffect(() => {
    if (publicPath) return;
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [publicPath, isAuthenticated, isLoading, router]);

  if (publicPath) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <></>;
}
