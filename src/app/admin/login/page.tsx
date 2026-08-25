"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TerminalLoginForm } from "@/components/molecules/admin/terminal-login-form";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/hooks/use-i18n";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const { themeConfig } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        router.push("/admin");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  if (!isLoading && isAuthenticated) {
    return null;
  }

  const handleLoginSuccess = () => {
    router.push("/admin");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 font-mono"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text,
      }}
    >
      <div className="w-full max-w-md space-y-6">
                          
        <div
          className="rounded-lg border shadow-xl overflow-hidden"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
                             
          <div
            className="flex items-center justify-between p-3 border-b"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-(--terminal-accent)" />
              <span className="text-xs font-semibold text-(--terminal-accent)">
                admin@portfolio:~$ login
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 text-xs border-(--terminal-accent)/40 text-(--terminal-accent) hover:bg-(--terminal-accent)/10"
            >
              <Link href="/">{t("adminLoginBack") || "Back to Site"}</Link>
            </Button>
          </div>

                           
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-1 text-(--terminal-accent)">
                {t("adminLoginTitle") || "Admin Authentication"}
              </h1>
              <p className="text-xs text-(--terminal-muted)">
                {t("adminLoginDesc") || "Enter your administrator credentials to access the management portal."}
              </p>
            </div>

            <TerminalLoginForm
              onLoginSuccess={handleLoginSuccess}
              themeConfig={themeConfig}
            />
          </div>

                             
          <div
            className="p-3 border-t text-xs text-center space-y-1"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <p className="text-(--terminal-muted)">
              {t("adminLoginHint") || "Secure JWT Authentication"}
            </p>
            <p className="text-(--terminal-muted)">
              {t("adminLoginNoAccount") || "Need an admin account?"}{" "}
              <Link
                href="/admin/register"
                className="text-(--terminal-accent) underline hover:no-underline font-semibold"
              >
                {t("adminLoginRegister") || "Register Admin"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
