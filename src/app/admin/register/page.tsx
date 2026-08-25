"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";
import { authService } from "@/lib/auth/auth-service";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Administrator registration page component.
 *
 * Provides a terminal-themed registration form to provision new administrator accounts,
 * with client-side password validation, visibility toggling, error handling, and redirection upon success.
 *
 * @returns {React.JSX.Element} The rendered admin registration page.
 */
export default function AdminRegisterPage(): React.JSX.Element {
  const { themeConfig } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles form submission for administrator account creation.
   *
   * Validates required inputs, password matching, and minimum character length constraints,
   * invokes {@link authService.register}, and redirects to the login screen upon successful registration.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   * @returns {Promise<void>} Resolves when the registration flow completes.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError("Email and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/login");
        }, 2000);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (_err) {
      setError("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 font-mono text-sm"
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
                admin@portfolio:~$ register
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 text-xs border-(--terminal-accent)/40 text-(--terminal-accent) hover:bg-(--terminal-accent)/10"
            >
              <Link href="/admin/login">← Back to Login</Link>
            </Button>
          </div>

                           
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-1 text-(--terminal-accent)">
                Admin Registration
              </h1>
              <p className="text-xs text-(--terminal-muted)">
                {success
                  ? "Account created successfully! Redirecting to login..."
                  : "Create an administrator account for portfolio management."}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded border text-xs border-red-500/40 bg-red-500/10 text-red-400">
                {error}
              </div>
            )}

            {success ? (
              <div className="p-3 rounded border text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                ✓ Registration successful! Redirecting to login...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs text-(--terminal-muted)">
                    Email Address *
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-first-name" className="text-xs text-(--terminal-muted)">
                      First Name
                    </Label>
                    <Input
                      id="reg-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      disabled={isLoading}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-last-name" className="text-xs text-(--terminal-muted)">
                      Last Name
                    </Label>
                    <Input
                      id="reg-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      disabled={isLoading}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-xs text-(--terminal-muted)">
                    Password * (min 8 chars)
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isLoading}
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--terminal-muted) hover:text-(--terminal-text) transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm-password" className="text-xs text-(--terminal-muted)">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isLoading}
                      autoComplete="new-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--terminal-muted) hover:text-(--terminal-text) transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="terminal"
                    className="w-full"
                    disabled={isLoading || !email || !password || !confirmPassword}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                      </span>
                    ) : (
                      "Create Admin Account"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

                        
          <div
            className="p-3 border-t text-xs text-center"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <span className="text-(--terminal-muted)">
              Already have an account?{" "}
              <Link
                href="/admin/login"
                className="text-(--terminal-accent) underline hover:no-underline font-semibold"
              >
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
