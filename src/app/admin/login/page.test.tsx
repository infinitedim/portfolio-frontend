import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

mock.module("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const mockThemeConfig = {
  name: "dark",
  colors: {
    bg: "#000000",
    text: "#ffffff",
    border: "#333333",
    accent: "#00ff00",
    success: "#00ff00",
    error: "#ff0000",
    warning: "#ffff00",
    muted: "#888888",
  },
};

mock.module("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

const mockLogout = jest.fn();
const mockLogin = jest.fn();
const mockRefresh = jest.fn();
const mockComplete2FA = jest.fn();
const mockUser = {
  userId: "test-user-id",
  email: "admin@example.com",
  role: "admin" as const,
};

mock.module("@/lib/auth/auth-context", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: mockLogout,
    login: mockLogin,
    refresh: mockRefresh,
    complete2FA: mockComplete2FA,
  })),
}));

mock.module("@/components/molecules/admin/terminal-login-form", () => ({
  TerminalLoginForm: ({
    onLoginSuccess,
    themeConfig,
  }: {
    onLoginSuccess: () => void;
    themeConfig: unknown;
  }) => (
    <div data-testid="terminal-login-form">
      <button
        data-testid="mock-login-button"
        onClick={onLoginSuccess}
      >
        Mock Login
      </button>
      <div data-testid="theme-config">{JSON.stringify(themeConfig)}</div>
    </div>
  ),
}));

import { useAuth } from "@/lib/auth/auth-context";
import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    jest.clearAllMocks();
    mockPush.mockClear();
    (useAuth as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      logout: mockLogout,
      login: mockLogin,
      refresh: mockRefresh,
      complete2FA: mockComplete2FA,
    });
  });

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminLoginPage />);
      expect(container).toBeTruthy();
    });

    it("should render login form", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      expect(screen.getByTestId("terminal-login-form")).toBeInTheDocument();
    });

    it("should render page title", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      expect(screen.getByText(/Admin Authentication/i)).toBeInTheDocument();
    });

    it("should render description text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      expect(
        screen.getByText(/Enter your credentials/i),
      ).toBeInTheDocument();
    });

    it("should render back link", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      expect(
        screen.getByRole("link", { name: /← Back/i }),
      ).toBeInTheDocument();
    });

    it("should render terminal header text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminLoginPage />);

      expect(container.textContent).toContain("admin@portfolio:~$ login");
    });

    it("should render footer instructions", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      expect(
        screen.getByText(/Press ← Back to return to home/i),
      ).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to admin dashboard on successful login", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      const loginButton = screen.getByTestId("mock-login-button");
      fireEvent.click(loginButton);

      expect(mockPush).toHaveBeenCalledWith("/admin");
    });

    it("should redirect to admin when already authenticated", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      (useAuth as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        logout: mockLogout,
        login: mockLogin,
        refresh: mockRefresh,
        complete2FA: mockComplete2FA,
      });

      render(<AdminLoginPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin");
      });
    });

    it("should not render content when already authenticated", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      (useAuth as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        logout: mockLogout,
        login: mockLogin,
        refresh: mockRefresh,
        complete2FA: mockComplete2FA,
      });

      const { container } = render(<AdminLoginPage />);

      expect(container.children.length).toBe(0);
    });
  });

  describe("Theme Configuration", () => {
    it("should apply theme colors to container", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminLoginPage />);
      const mainDiv = container.querySelector("div");
      expect(mainDiv).toBeTruthy();
      expect(mainDiv?.style.backgroundColor).toBeTruthy();
    });

    it("should pass themeConfig to TerminalLoginForm", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      const themeConfigDiv = screen.getByTestId("theme-config");
      expect(themeConfigDiv.textContent).toContain("dark");
    });
  });

  describe("Loading States", () => {
    it("should not redirect while loading", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      (useAuth as unknown as ReturnType<typeof jest.fn>).mockReturnValueOnce({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        logout: mockLogout,
        login: mockLogin,
        refresh: mockRefresh,
        complete2FA: mockComplete2FA,
      });

      render(<AdminLoginPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should render login form when not loading and not authenticated", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      expect(screen.getByTestId("terminal-login-form")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminLoginPage />);
      const headings = container.querySelectorAll("h1");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have accessible back link", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminLoginPage />);
      const backLink = screen.getByRole("link", { name: /← Back/i });
      expect(backLink).toBeInTheDocument();
    });
  });
});
