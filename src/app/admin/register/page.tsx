"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import { authService } from "@/lib/auth/auth-service";

export default function AdminRegisterPage() {
  const { themeConfig } = useTheme();
  const router = useRouter();
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentField, setCurrentField] = useState<string>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const handleBack = () => {
    router.push("/admin/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const result = await authService.register(email, password, firstName, lastName);

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

  const handleKeyDown = (e: React.KeyboardEvent, nextField?: string) => {
    if (e.key === "Tab" && nextField) {
      e.preventDefault();
      setCurrentField(nextField);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
        email: emailRef,
        password: passwordRef,
        confirmPassword: confirmPasswordRef,
        firstName: firstNameRef,
        lastName: lastNameRef,
      };
      refs[nextField]?.current?.focus();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text,
      }}
    >
      <TerminalHeader />

      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md"
          style={{
            backgroundColor: themeConfig.colors.bg,
            border: `1px solid ${themeConfig.colors.border}`,
            borderRadius: "8px",
            boxShadow: `0 4px 20px ${themeConfig.colors.border}20`,
          }}
        >
          
          <div
            className="flex items-center justify-between p-3 border-b"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeConfig.colors.error }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeConfig.colors.warning }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeConfig.colors.success }}
                />
              </div>
              <span
                className="text-sm font-mono"
                style={{ color: themeConfig.colors.muted }}
              >
                admin@portfolio:~$ register
              </span>
            </div>

            <button
              onClick={handleBack}
              onMouseEnter={() => setIsBackHovered(true)}
              onMouseLeave={() => setIsBackHovered(false)}
              className={`px-3 py-1 text-xs font-mono rounded transition-all duration-200 ${isBackHovered ? "scale-105" : "scale-100"
                }`}
              style={{
                backgroundColor: isBackHovered
                  ? themeConfig.colors.accent
                  : `${themeConfig.colors.accent}20`,
                color: isBackHovered
                  ? themeConfig.colors.bg
                  : themeConfig.colors.accent,
                border: `1px solid ${themeConfig.colors.accent}`,
                filter: isBackHovered
                  ? `drop-shadow(0 0 8px ${themeConfig.colors.accent}40)`
                  : "none",
              }}
            >
              ← Back to Login
            </button>
          </div>

          
          <div className="p-6">
            <div className="mb-6">
              <h1
                className="text-xl font-bold mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                🔐 Admin Registration
              </h1>
              <p
                className="text-sm"
                style={{ color: themeConfig.colors.muted }}
              >
                {success
                  ? "Account created successfully! Redirecting to login..."
                  : "Create the first admin account for your portfolio"}
              </p>
            </div>

            {error && (
              <div
                className="p-3 rounded border text-sm font-mono mb-4"
                style={{
                  backgroundColor: `${themeConfig.colors.error}10`,
                  borderColor: themeConfig.colors.error,
                  color: themeConfig.colors.error,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {success ? (
              <div
                className="p-3 rounded border text-sm font-mono"
                style={{
                  backgroundColor: `${themeConfig.colors.success}10`,
                  borderColor: themeConfig.colors.success,
                  color: themeConfig.colors.success,
                }}
              >
                ✓ Registration successful! Redirecting to login...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-mono mb-1 block"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "firstName")}
                    onFocus={() => setCurrentField("email")}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded font-mono text-sm focus:outline-none transition-all"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}`,
                      color: themeConfig.colors.text,
                      border: `1px solid ${currentField === "email" ? themeConfig.colors.accent : themeConfig.colors.border}`,
                    }}
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-sm font-mono mb-1 block"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    ref={firstNameRef}
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "lastName")}
                    onFocus={() => setCurrentField("firstName")}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded font-mono text-sm focus:outline-none transition-all"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}`,
                      color: themeConfig.colors.text,
                      border: `1px solid ${currentField === "firstName" ? themeConfig.colors.accent : themeConfig.colors.border}`,
                    }}
                    placeholder="John"
                  />
                </div>

                
                <div>
                  <label
                    htmlFor="lastName"
                    className="text-sm font-mono mb-1 block"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    ref={lastNameRef}
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "password")}
                    onFocus={() => setCurrentField("lastName")}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded font-mono text-sm focus:outline-none transition-all"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}`,
                      color: themeConfig.colors.text,
                      border: `1px solid ${currentField === "lastName" ? themeConfig.colors.accent : themeConfig.colors.border}`,
                    }}
                    placeholder="Doe"
                  />
                </div>

                
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-mono mb-1 block"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Password * (min 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "confirmPassword")}
                      onFocus={() => setCurrentField("password")}
                      disabled={isLoading}
                      className="w-full px-3 py-2 pr-10 rounded font-mono text-sm focus:outline-none transition-all"
                      style={{
                        backgroundColor: `${themeConfig.colors.bg}`,
                        color: themeConfig.colors.text,
                        border: `1px solid ${currentField === "password" ? themeConfig.colors.accent : themeConfig.colors.border}`,
                      }}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>

                
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-mono mb-1 block"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    ref={confirmPasswordRef}
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setCurrentField("confirmPassword")}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded font-mono text-sm focus:outline-none transition-all"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}`,
                      color: themeConfig.colors.text,
                      border: `1px solid ${currentField === "confirmPassword" ? themeConfig.colors.accent : themeConfig.colors.border}`,
                    }}
                    placeholder="••••••••"
                    required
                  />
                </div>

                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded font-mono font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeConfig.colors.accent,
                    color: themeConfig.colors.bg,
                    filter: `drop-shadow(0 0 10px ${themeConfig.colors.accent}40)`,
                  }}
                >
                  {isLoading ? "Creating Account..." : "Register →"}
                </button>
              </form>
            )}
          </div>

          
          <div
            className="p-3 border-t text-xs text-center"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <span style={{ color: themeConfig.colors.muted }}>
              Already have an account?{" "}
              <button
                onClick={handleBack}
                className="underline hover:no-underline"
                style={{ color: themeConfig.colors.accent }}
              >
                Login here
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
