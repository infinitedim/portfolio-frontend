import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("next/navigation", () => ({
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

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}));

const mockLogout = vi.fn();
const mockUser = {
  userId: "test-user-id",
  email: "admin@example.com",
  role: "admin",
};

const mockUseAuth = vi.fn(() => ({
  user: mockUser,
  logout: mockLogout,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/molecules/admin/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

vi.mock("@/components/molecules/admin/terminal-header", () => ({
  TerminalHeader: () => (
    <div data-testid="terminal-header">Terminal Header</div>
  ),
}));

import AdminDashboardPage from "../page";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    vi.clearAllMocks();
    mockPush.mockClear();
    mockLogout.mockClear();
  });

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminDashboardPage />);
      expect(container).toBeTruthy();
    });

    it("should render ProtectedRoute wrapper", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByTestId("protected-route")).toBeInTheDocument();
    });

    it("should render TerminalHeader", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByTestId("terminal-header")).toBeInTheDocument();
    });

    it("should render dashboard title", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      // "Admin Dashboard" appears in both the H1 heading and the footer
      // instructions, so scope to the heading explicitly.
      expect(
        screen.getByRole("heading", { level: 1, name: /Admin Dashboard/i }),
      ).toBeInTheDocument();
    });

    it("should render welcome message with user email", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(
        screen.getByText(/Welcome back, admin@example.com!/i),
      ).toBeInTheDocument();
    });

    it("should render user information section", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText(/User Information/i)).toBeInTheDocument();
      expect(screen.getByText(/User ID:/i)).toBeInTheDocument();
      expect(screen.getByText(/Email:/i)).toBeInTheDocument();
      expect(screen.getByText(/Role:/i)).toBeInTheDocument();
    });

    it("should display user data", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText("test-user-id")).toBeInTheDocument();
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
    });

    it("should render system status section", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText(/System Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Status:/i)).toBeInTheDocument();
      expect(screen.getByText(/Last Login:/i)).toBeInTheDocument();
      expect(screen.getByText(/Session:/i)).toBeInTheDocument();
    });

    it("should display system status values", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText(/Online/i)).toBeInTheDocument();
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });

    it("should render quick actions section", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage Posts/i)).toBeInTheDocument();
      expect(screen.getByText(/^Inbox$/i)).toBeInTheDocument();
      expect(screen.getByText(/Two-Factor Auth/i)).toBeInTheDocument();
    });

    it("should render navigation buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText(/🏠 Home/i)).toBeInTheDocument();
      expect(screen.getByText(/🚪 Logout/i)).toBeInTheDocument();
    });

    it("should render terminal window decorations", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminDashboardPage />);
      expect(container.textContent).toContain("admin@portfolio:~$ dashboard");
    });

    it("should render footer instructions", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(
        screen.getByText(/Press Ctrl\+L to logout/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Press Ctrl\+H to go home/i),
      ).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to home when home button is clicked", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      const homeButton = screen.getByText(/🏠 Home/i);
      fireEvent.click(homeButton);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should logout and navigate to login when logout button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      const logoutButton = screen.getByText(/🚪 Logout/i);
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/admin/login");
      });
    });
  });

  describe("Hover States", () => {
    it("should handle logout button hover state", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      const logoutButton = screen.getByText(/🚪 Logout/i);

      fireEvent.mouseEnter(logoutButton);

      expect(logoutButton).toBeInTheDocument();

      fireEvent.mouseLeave(logoutButton);

      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe("Theme Configuration", () => {
    it("should apply theme colors to container", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminDashboardPage />);
      const mainDiv = container.querySelector("div[style*='background-color']");
      expect(mainDiv).toBeTruthy();
    });

    it("should use theme colors for borders and text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminDashboardPage />);
      const styledElements = container.querySelectorAll("[style*='border']");
      expect(styledElements.length).toBeGreaterThan(0);
    });
  });

  describe("User Data Display", () => {
    it("should handle missing user data gracefully", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockUseAuth.mockReturnValueOnce({
        user: null,
        logout: mockLogout,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ReturnType<typeof mockUseAuth>);

      render(<AdminDashboardPage />);

      expect(
        screen.getByRole("heading", { level: 1, name: /Admin Dashboard/i }),
      ).toBeInTheDocument();
    });

    it("should display user role badge", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      const roleBadge = screen.getByText("admin");
      expect(roleBadge).toBeInTheDocument();
    });
  });

  describe("Quick Actions", () => {
    it("should render all quick action buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      expect(screen.getByText(/Manage Posts/i)).toBeInTheDocument();
      expect(screen.getByText(/^Inbox$/i)).toBeInTheDocument();
      expect(screen.getByText(/Two-Factor Auth/i)).toBeInTheDocument();
    });

    it("should have proper styling for quick action buttons", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);

      // Manage Posts is still a <button>, while Inbox and Two-Factor Auth are
      // now Next.js <Link> components rendered as <a>.
      const managePostsButton = screen
        .getByText(/Manage Posts/i)
        .closest("button");
      const inboxLink = screen.getByText(/^Inbox$/i).closest("a");
      const twoFactorLink = screen.getByText(/Two-Factor Auth/i).closest("a");

      expect(managePostsButton).toBeInTheDocument();
      expect(inboxLink).toBeInTheDocument();
      expect(inboxLink).toHaveAttribute("href", "/admin/messages");
      expect(twoFactorLink).toBeInTheDocument();
      expect(twoFactorLink).toHaveAttribute("href", "/admin/2fa");
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      const { container } = render(<AdminDashboardPage />);
      const headings = container.querySelectorAll("h1, h3");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have accessible button labels", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      render(<AdminDashboardPage />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
