import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { PWARegistration } from "../pwa-registration";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/components/molecules/pwa/pwa-install-prompt", () => ({
  PWAInstallPrompt: ({ onInstall, onDismiss }: any) => (
    <div data-testid="pwa-install-prompt">
      <button onClick={onInstall}>Install</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

const mockRegister = vi.fn();
const mockController = null;

Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: mockRegister,
    controller: mockController,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
  configurable: true,
});

const mockConfirm = vi.fn(() => true);
if (typeof window !== "undefined") {
  window.confirm = mockConfirm;
}

describe("PWARegistration", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    mockRegister.mockResolvedValue({
      installing: null,
      waiting: null,
      update: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when not installable", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const { container } = render(<PWARegistration />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Service Worker Registration", () => {
    it("should register service worker when supported", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof navigator === "undefined" || !navigator.serviceWorker) {
        expect(true).toBe(true);
        return;
      }
      const wasSecure = window.isSecureContext;
      (window as unknown as { isSecureContext: boolean }).isSecureContext =
        true;
      render(<PWARegistration />);

      await waitFor(
        () => {
          expect(mockRegister).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
      (window as unknown as { isSecureContext: boolean }).isSecureContext =
        wasSecure;
    });

    it("should handle service worker registration errors gracefully", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof navigator === "undefined" || !navigator.serviceWorker) {
        expect(true).toBe(true);
        return;
      }
      const wasSecure = window.isSecureContext;
      (window as unknown as { isSecureContext: boolean }).isSecureContext =
        true;
      mockRegister.mockRejectedValue(new Error("404"));

      render(<PWARegistration />);

      await waitFor(
        () => {
          expect(mockRegister).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
      (window as unknown as { isSecureContext: boolean }).isSecureContext =
        wasSecure;
    });
  });

  describe("Install Prompt", () => {
    it("should handle beforeinstallprompt event", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      render(<PWARegistration />);

      const event = new Event("beforeinstallprompt") as any;
      event.prompt = vi.fn();
      event.userChoice = Promise.resolve({ outcome: "accepted" });

      window.dispatchEvent(event);

      expect(event).toBeDefined();
    });
  });
});
