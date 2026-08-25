"use client";

import { AuthProvider } from "@/lib/auth";
import { AdminLayoutInner } from "./admin-layout-inner";

/**
 * Props for the {@link AdminLayout} component.
 *
 * @interface AdminLayoutProps
 * @property {React.ReactNode} children - The child page or layout elements to render within the admin layout hierarchy.
 */
interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Root administration layout component for the portfolio management system.
 * Wraps all nested administrative routes with the global {@link AuthProvider}
 * and delegates shell navigation and route guarding to {@link AdminLayoutInner}.
 *
 * @param {AdminLayoutProps} props - The component props containing child nodes.
 * @param {React.ReactNode} props.children - Child routes and pages to be rendered inside the authenticated layout.
 * @returns {React.JSX.Element} The rendered admin layout with authentication provider boundary.
 */
export default function AdminLayout({
  children,
}: AdminLayoutProps): React.JSX.Element {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
