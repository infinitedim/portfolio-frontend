"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Props for the {@link ProtectedRoute} component.
 *
 * @interface ProtectedRouteProps
 * @property {React.ReactNode} children - The protected child components rendered when authenticated.
 * @property {React.ReactNode} [fallback] - Optional custom loading fallback element shown during authentication verification.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Route protection wrapper component for client-side administration pages.
 *
 * Checks current user authentication status via {@link useAuth}. If unauthenticated,
 * automatically redirects user to the `/admin/login` page while preventing unauthorized rendering.
 *
 * @component
 * @param {ProtectedRouteProps} props - Properties configuring the protected route wrapper.
 * @returns {React.JSX.Element | null} The rendered protected child tree, loading spinner fallback, or null during redirection.
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const t = setTimeout(() => {
        router.push("/admin/login");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
