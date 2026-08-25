import { jest, afterEach, beforeAll, beforeEach, mock, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

(expect.extend as (m: unknown) => void)(matchers);

mock.module("next/server", () => ({
  /**
   * Mock implementation of NextRequest simulating request headers, cookies, URL parsing, and geolocation.
   */
  NextRequest: class MockNextRequest {
    /** The request URL string. */
    url: string;
    /** The HTTP request method. */
    method: string;
    private _headers: Map<string, string>;
    /** Parsed next routing URL metadata. */
    nextUrl: { pathname: string };
    private _cookies: Map<string, unknown>;
    private _body: unknown;
    /** Geolocation metadata attached to the request. */
    geo?: { country?: string; region?: string };

    /**
     * Initializes a new MockNextRequest instance.
     *
     * @param url - The request target URL string.
     * @param options - Request options including method, headers, cookies, body, and geo info.
     */
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

    /**
     * Reads the request body as text.
     *
     * @returns A promise resolving to the body string.
     */
    async text() {
      if (typeof this._body === "string") return this._body;
      if (this._body) return JSON.stringify(this._body);
      return "";
    }

    /**
     * Parses the request body as a JSON object.
     *
     * @returns A promise resolving to parsed body content.
     */
    async json() {
      if (typeof this._body === "string") return JSON.parse(this._body);
      return this._body ?? {};
    }

    /**
     * Retrieves the request headers interface.
     *
     * @returns Header manipulation methods (get, set, entries).
     */
    get headers() {
      return {
        get: (name: string) => this._headers.get(name) || null,
        set: (name: string, value: string) => this._headers.set(name, value),
        entries: () => Array.from(this._headers.entries()),
      };
    }

    /**
     * Retrieves the request cookies interface.
     *
     * @returns Cookie manipulation methods (get, set).
     */
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

  /**
   * Mock implementation of NextResponse providing headers, cookies, and status tracking.
   */
  NextResponse: class MockNextResponse {
    /** Response headers mock dictionary. */
    headers: {
      get: (name: string) => string | null;
      set: (name: string, value: string) => void;
      entries: () => [string, string][];
    };
    /** Response cookies mock dictionary. */
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
    /** HTTP status code. */
    status: number;

    /**
     * Initializes a new MockNextResponse instance.
     *
     * @param status - The HTTP response status code (default: 200).
     */
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

    /**
     * Factory creating a standard next() middleware response.
     *
     * @returns A fresh MockNextResponse instance.
     */
    static next() {
      return new MockNextResponse();
    }

    /**
     * Factory creating a JSON NextResponse mock.
     *
     * @param body - The JSON payload.
     * @param init - Response initialization options (status, headers).
     * @param init.status - HTTP status code number.
     * @param init.headers - Response headers map.
     * @returns A configured MockNextResponse instance.
     */
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

    /**
     * Factory creating a redirect NextResponse mock.
     *
     * @param url - The destination redirect URL.
     * @param status - The HTTP redirect status code (default: 307).
     * @returns A redirecting MockNextResponse instance.
     */
    static redirect(url: string | URL, status = 307) {
      const res = new MockNextResponse(status);
      res.headers.set("location", String(url));
      return res;
    }
  },
}));

/** Reference to the native Web Crypto API instance on globalThis. */
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

(globalThis as unknown as { jest: typeof jest }).jest = jest;

process.env.ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS || "http://127.0.0.1:3000,https://example.com";

/**
 * Ensures the mock DOM environment has documentElement and body elements initialized.
 */
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

/**
 * Mock implementation of ResizeObserver for DOM component tests.
 */
global.ResizeObserver = class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  /**
   * Initializes a MockResizeObserver instance.
   *
   * @param _callback - Resize observer callback function.
   */
  constructor(_callback: ResizeObserverCallback) {}
} as unknown as typeof ResizeObserver;

/**
 * Mock implementation of IntersectionObserver for viewport intersection testing.
 */
class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => [] as IntersectionObserverEntry[]);
  /**
   * Initializes a MockIntersectionObserver instance.
   *
   * @param _callback - Intersection observer callback function.
   * @param _options - Optional intersection observer initialization configuration.
   */
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

/** Mock localStorage interface for test execution. */
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

/** Mock sessionStorage interface for test execution. */
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
  } // eslint-disable-next-line no-empty
    catch {}
}

beforeAll(() => {
  ensureDOMReady();
});

beforeEach(() => {
  ensureDOMReady();
});

/** Original console.error reference preserved before filtering test state warnings. */
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("was not wrapped in act(...)") ||
    msg.includes("not wrapped in act") ||
    msg.includes("React state update") ||
    msg.includes("An update to ")
  ) {
    return;
  }
  originalConsoleError(...args);
};

afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
