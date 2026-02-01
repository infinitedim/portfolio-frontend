/**
 * Bun test setup file
 * This runs before each test file when using bun test
 */

// Mock ResizeObserver
globalThis.ResizeObserver = class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
globalThis.IntersectionObserver = class MockIntersectionObserver {
  constructor(_callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// Mock matchMedia
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Mock localStorage
if (typeof window !== "undefined" && !window.localStorage) {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
    writable: true,
    configurable: true,
  });
}

// Mock sessionStorage
if (typeof window !== "undefined" && !window.sessionStorage) {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
    writable: true,
    configurable: true,
  });
}

// Mock URL methods
if (typeof URL !== "undefined") {
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "mock-blob-url",
      writable: true,
    });
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => {},
      writable: true,
    });
  }
}

// Note: fetch is NOT mocked globally here
// Each test should set up its own fetch mock as needed
