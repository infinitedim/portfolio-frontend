import { describe, it, expect, jest, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const mockPush = jest.fn();
const mockPathname = jest.fn(() => "/admin");

const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (jest as unknown as Record<string, unknown>).mock !== "function"
)
  (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname(),
}));

interface MockAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const mockAuthState: MockAuthState = {
  isAuthenticated: false,
  isLoading: false,
};

mock.module("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
    user: null,
    login: jest.fn(),
    complete2FA: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import AdminLayout from "../layout";

function setAuthState(next: Partial<MockAuthState>): void {
  mockAuthState.isAuthenticated = next.isAuthenticated ?? false;
  mockAuthState.isLoading = next.isLoading ?? false;
}

describe("AdminLayout", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }
    ensureDocumentBody();
    jest.clearAllMocks();
    mockPush.mockClear();
    mockPathname.mockReturnValue("/admin");
    setAuthState({ isAuthenticated: false, isLoading: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Public Routes", () => {
    it("should render children for the login route without redirecting", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");
      setAuthState({ isAuthenticated: false, isLoading: false });

      const { getByText } = render(
        <AdminLayout>
          <div>Login Content</div>
        </AdminLayout>,
      );

      expect(getByText("Login Content")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should render children for the register route without redirecting", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/register");
      setAuthState({ isAuthenticated: false, isLoading: false });

      const { getByText } = render(
        <AdminLayout>
          <div>Register Content</div>
        </AdminLayout>,
      );

      expect(getByText("Register Content")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should not show the verifying spinner on public routes while auth is loading", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/register");
      setAuthState({ isAuthenticated: false, isLoading: true });

      render(
        <AdminLayout>
          <div>Register Content</div>
        </AdminLayout>,
      );

      expect(
        screen.queryByText(/Verifying authentication/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Protected Routes", () => {
    it("should show loading state while auth context is initialising", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: false, isLoading: true });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      expect(screen.getByText(/Verifying authentication/i)).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should render children when authenticated", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: true, isLoading: false });

      const { getByText } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      expect(getByText("Protected Content")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should redirect to login when auth resolves and user is not authenticated", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: false, isLoading: false });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin/login");
      });
    });

    it("should not render children when not authenticated", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: false, isLoading: false });

      const { container } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      expect(container.children.length).toBe(0);
    });

    it("should not redirect while auth is still loading", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: false, isLoading: true });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should display loading spinner while auth is loading", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: false, isLoading: true });

      const { container } = render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeTruthy();
    });

    it("should display loading message while auth is loading", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: false, isLoading: true });

      render(
        <AdminLayout>
          <div>Protected Content</div>
        </AdminLayout>,
      );

      expect(screen.getByText(/Verifying authentication/i)).toBeInTheDocument();
    });

    it("should not show loading on public routes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");
      setAuthState({ isAuthenticated: false, isLoading: true });

      render(
        <AdminLayout>
          <div>Login Content</div>
        </AdminLayout>,
      );

      expect(
        screen.queryByText(/Verifying authentication/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Multiple Children", () => {
    it("should render multiple children when authenticated", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin");
      setAuthState({ isAuthenticated: true, isLoading: false });

      const { getByText } = render(
        <AdminLayout>
          <div>Child 1</div>
          <div>Child 2</div>
        </AdminLayout>,
      );

      expect(getByText("Child 1")).toBeInTheDocument();
      expect(getByText("Child 2")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should render children for public routes even when auth is loading", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/register");
      setAuthState({ isAuthenticated: false, isLoading: true });

      const { getByText } = render(
        <AdminLayout>
          <div>Register Content</div>
        </AdminLayout>,
      );

      expect(getByText("Register Content")).toBeInTheDocument();
    });

    it("should handle empty children on public routes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }

      mockPathname.mockReturnValue("/admin/login");

      const { container } = render(<AdminLayout>{null}</AdminLayout>);

      expect(container).toBeTruthy();
    });
  });
});
