/**
 * Test setup for Bun's native test runner (`bun test`).
 *
 * This is the Bun-compatible equivalent of `setup.ts` (Vitest).
 * During the Strangler Pattern migration, both setup files coexist:
 * - `setup.ts` → preloaded by Vitest for *.test.ts(x) files
 * - `setup-bun.ts` → preloaded by bun test for *.bun.test.ts(x) files
 *
 * After full migration, `setup.ts` and Vitest will be removed.
 */

import { jest, afterEach, beforeAll, beforeEach, mock, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend bun:test expect with jest-dom matchers (toBeInTheDocument, etc.)
(expect.extend as (m: unknown) => void)(matchers);

// ---------------------------------------------------------------------------
// Module mocks (must be called before importing the modules under test)
// ---------------------------------------------------------------------------

mock.module("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    private _headers: Map<string, string>;
    nextUrl: { pathname: string };
    private _cookies: Map<string, unknown>;
    private _body: unknown;
    geo?: { country?: string; region?: string };

    constructor(
      url = "http://127.0.0.1:3000",
      options: Record<string, unknown> = {},
    ) {
      this.url = url;
      this.method = (options.method as string) || "GET";
      let entries: [string, string][] = [];
      if (options.headers) {
        if (Array.isArray(options.headers)) {
          entries = options.headers as [string, string][];
        } else if (typeof options.headers === "object") {
          entries = Object.entries(options.headers as Record<string, string>);
        }
      }
      this._headers = new Map(entries);
      this._body = options.body ?? null;
      const parsed = new URL(url);
      this.nextUrl = {
        pathname: (options.pathname as string) || parsed.pathname || "/",
      };
      this._cookies = new Map((options.cookies as [string, unknown][]) || []);
      this.geo = (options.geo as { country?: string; region?: string }) || {
        country: "US",
        region: "CA",
      };
    }

    async text() {
      if (typeof this._body === "string") return this._body;
      if (this._body) return JSON.stringify(this._body);
      return "";
    }

    async json() {
      if (typeof this._body === "string") return JSON.parse(this._body);
      return this._body ?? {};
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
        get: (name: string) => {
          const entry = this._cookies.get(name);
          if (entry && typeof entry === "object" && "value" in entry) {
            return entry as { value: string };
          }
          if (typeof entry === "string") {
            return { value: entry };
          }
          return entry ?? null;
        },
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

  NextResponse: class MockNextResponse {
    headers: {
      get: (name: string) => string | null;
      set: (name: string, value: string) => void;
      entries: () => [string, string][];
    };
    cookies: {
      set: (
        name: string,
        value: string,
        options?: {
          path?: string;
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: string;
          maxAge?: number;
        },
      ) => void;
      get: (name: string) => null;
    };
    status: number;

    constructor(status = 200) {
      const h = new Map<string, string>();
      this.status = status;
      this.headers = {
        get: jest.fn((name: string) => h.get(name.toLowerCase()) || null),
        set: jest.fn((name: string, value: string) => {
          h.set(name.toLowerCase(), value);
        }),
        entries: jest.fn(() => Array.from(h.entries())),
      };
      this.cookies = {
        set: jest.fn(
          (
            name: string,
            value: string,
            options?: {
              path?: string;
              httpOnly?: boolean;
              secure?: boolean;
              sameSite?: string;
              maxAge?: number;
            },
          ) => {
            let cookieStr = `${name}=${value}`;
            if (options?.path) cookieStr += `; Path=${options.path}`;
            if (options?.httpOnly) cookieStr += "; HttpOnly";
            if (options?.secure) cookieStr += "; Secure";
            if (options?.sameSite)
              cookieStr += `; SameSite=${options.sameSite}`;
            if (options?.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;

            h.set("set-cookie", cookieStr);
          },
        ),
        get: jest.fn(() => null),
      };
    }

    static next() {
      return new MockNextResponse();
    }

    static json(
      body: unknown,
      init?: { status?: number; headers?: Record<string, string> },
    ) {
      const res = new MockNextResponse(init?.status ?? 200);
      (res as unknown as { _body: unknown })._body = body;
      (res as unknown as { json: () => Promise<unknown> }).json = async () => body;
      (res as unknown as { text: () => Promise<string> }).text = async () =>
        typeof body === "string" ? body : JSON.stringify(body);
      if (init?.headers) {
        Object.entries(init.headers).forEach(([k, v]) => {
          res.headers.set(k, v);
        });
      }
      return res;
    }

    static redirect(url: string | URL, status = 307) {
      const res = new MockNextResponse(status);
      res.headers.set("location", String(url));
      return res;
    }
  },
}));

// Preserve native crypto.subtle and getRandomValues so code that uses
// Web Crypto API (e.g. clientEncrypt / performHandshake) still works.
// Only override helpers that tests don't need to be real (randomUUID, randomBytes).
const _nativeCrypto = globalThis.crypto;

Object.defineProperty(global, "crypto", {
  value: {
    subtle: _nativeCrypto?.subtle,
    getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      if (_nativeCrypto) {
        return _nativeCrypto.getRandomValues(
          array as unknown as Uint8Array,
        ) as unknown as T;
      }
      return array;
    },
    randomUUID: jest.fn(() => "test-uuid-12345"),
    randomBytes: jest.fn(() => ({
      toString: () => "test-nonce-base64",
    })),
  },
  writable: true,
});

mock.module("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  redirect: jest.fn(),
}));

// Expose jest globally for jest.fn(), jest.clearAllMocks(), etc.
(globalThis as unknown as { jest: typeof jest }).jest = jest;

process.env.ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS || "http://127.0.0.1:3000,https://example.com";

// ---------------------------------------------------------------------------
// DOM environment helpers
// ---------------------------------------------------------------------------

function ensureDOMReady() {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
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

// ---------------------------------------------------------------------------
// Browser API mocks
// ---------------------------------------------------------------------------

global.ResizeObserver = class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  constructor(_callback: ResizeObserverCallback) {}
} as unknown as typeof ResizeObserver;

// Next.js's `<Link>` uses `new IntersectionObserver(...)` via
// `next/src/client/use-intersection.tsx`. We need a real class with the standard
// `observe`/`unobserve`/`disconnect`/`takeRecords` surface so the constructor
// call doesn't blow up in tests that render Link components.
class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => [] as IntersectionObserverEntry[]);
  constructor(
    _callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}
}

global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
  });
}

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
if (typeof window !== "undefined") {
  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorageMock,
    writable: true,
  });
}
global.fetch = jest.fn() as unknown as typeof fetch;

Object.defineProperty(URL, "createObjectURL", {
  value: jest.fn(() => "mock-blob-url"),
  writable: true,
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: jest.fn(),
  writable: true,
});

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = jest.fn();
}

if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.scrollTo = jest.fn();
}

if (typeof window !== "undefined") {
  window.scrollTo = jest.fn();
}

// Global mock for navigator.serviceWorker so any component that calls
// navigator.serviceWorker.register(...).then/catch() works without crashing.
// Individual test files can override this via Object.defineProperty with configurable:true.
if (typeof window !== "undefined") {
  try {
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: jest.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: null,
          update: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }),
        controller: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getRegistrations: jest.fn().mockResolvedValue([]),
        ready: Promise.resolve({
          active: null,
          installing: null,
          waiting: null,
          update: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        }),
      },
      writable: true,
      configurable: true,
    });
  } catch {
    // navigator.serviceWorker may not be configurable in all environments; ignore
  }
}

beforeAll(() => {
  ensureDOMReady();
});

beforeEach(() => {
  ensureDOMReady();
});

afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
