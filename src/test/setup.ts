import { vi, afterEach, beforeAll, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    private _headers: Map<string, string>;
    nextUrl: { pathname: string };
    private _cookies: Map<string, unknown>;
    geo?: { country?: string; region?: string };

    constructor(
      url = "http://127.0.0.1:3000",
      options: Record<string, unknown> = {},
    ) {
      this.url = url;
      this.method = (options.method as string) || "GET";
      this._headers = new Map((options.headers as [string, string][]) || []);
      this.nextUrl = { pathname: (options.pathname as string) || "/" };
      this._cookies = new Map((options.cookies as [string, unknown][]) || []);
      this.geo = (options.geo as { country?: string; region?: string }) || {
        country: "US",
        region: "CA",
      };
    }

    get headers() {
      return {
        get: (name: string) => this._headers.get(name) || null,
        set: (name: string, value: string) => this._headers.set(name, value),
        entries: () => Array.from(this._headers.entries()),
      };
    }

    get cookies() {
      return {
        get: (name: string) => this._cookies.get(name) || null,
        set: (
          name: string,
          value: unknown,
          options?: Record<string, unknown>,
        ) => {
          this._cookies.set(name, { value, ...options });
        },
      };
    }
  },

  NextResponse: {
    next: () => ({
      headers: {
        set: vi.fn(),
        get: vi.fn(),
        entries: () => [],
      },
      cookies: {
        set: vi.fn(),
        get: vi.fn(),
      },
    }),
  },
}));

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "test-uuid-12345"),
    randomBytes: vi.fn(() => ({
      toString: () => "test-nonce-base64",
    })),
  },
  writable: true,
});

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
  },
  logSecurity: vi.fn(),
  logPerformance: vi.fn(),
  logAPICall: vi.fn(),
}));

vi.mock("@/lib/security/csp", () => ({
  generateNonce: vi.fn(() => "test-nonce"),
  getSecurityHeaders: vi.fn(() => ({
    "Content-Security-Policy": "test-csp",
    "X-XSS-Protection": "1; mode=block",
  })),
  getCORSHeaders: vi.fn(() => ({
    "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  })),
}));

process.env.ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS || "http://127.0.0.1:3000,https://example.com";

function ensureDOMReady() {
  if (typeof document === "undefined") {
    return;
  }

  if (!document.documentElement) {
    const html = document.createElement("html");
    try {
      if (typeof document.appendChild === "function") {
        document.appendChild(html);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          "Failed to append documentElement to document: " + error.message,
          { cause: error },
        );
      }
    }
  }

  if (!document.body && document.documentElement) {
    const body = document.createElement("body");
    document.documentElement.appendChild(body);
  }

  if (!document.body && document.documentElement) {
    try {
      const body = document.createElement("body");
      document.documentElement.appendChild(body);
    } catch (error) {
      console.log("Failed to append body to documentElement:", error);

      try {
        document.body = document.createElement("body");
      } catch {
        throw new Error("Failed to create and assign body element to document");
      }
    }
  }
}

ensureDOMReady();

beforeAll(() => {
  ensureDOMReady();
});

global.ResizeObserver = class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {}
} as unknown as typeof ResizeObserver;

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      protocol: "http:",
      host: "localhost:3000",
      hostname: "localhost",
      port: "3000",
      pathname: "/",
      search: "",
      hash: "",
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
  });
}

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

global.fetch = vi.fn();

Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn(() => "mock-blob-url"),
  writable: true,
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});

Element.prototype.scrollIntoView = vi.fn();

if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollTo = vi.fn();
}

if (typeof window !== "undefined") {
  window.scrollTo = vi.fn();
}

beforeAll(() => {
  ensureDOMReady();
});

beforeEach(() => {
  ensureDOMReady();
});

afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
