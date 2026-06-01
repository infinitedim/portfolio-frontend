"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

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
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
