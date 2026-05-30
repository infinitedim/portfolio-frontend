"use client";

import { AuthProvider } from "@/lib/auth";
import { AdminLayoutInner } from "./admin-layout-inner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps): React.JSX.Element {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
