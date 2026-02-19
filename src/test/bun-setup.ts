/**
 * Bun test setup file
 * This runs before each test file when using bun test
 */

// Create a minimal vi compatibility layer for Bun
// @ts-expect-error - Adding vi global for compatibility
globalThis.vi = {
  fn: (implementation?: (() => unknown) | undefined) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFn: any = implementation || (() => {});

    mockFn.mockReturnValue = (_value: unknown) => {
      mockFn.mockReturnValueOnce = () => mockFn;
      return mockFn;
    };
    mockFn.mockImplementation = (impl: (() => unknown) | undefined) => {
      return impl;
    };
    mockFn.mockResolvedValue = (_value: unknown) => {
      mockFn.mockResolvedValueOnce = () => mockFn;
      return mockFn;
    };
    return mockFn;
  },
  spyOn: (object: Record<string, unknown>, method: string) => {
    const original = object[method];
    const spy = (...args: unknown[]) =>
      typeof original === "function" ? original.apply(object, args) : undefined;
    spy.mockImplementation = (impl: (() => unknown) | undefined) => {
      object[method] = impl;
      return spy;
    };
    spy.mockReturnValue = (value: unknown) => {
      object[method] = () => value;
      return spy;
    };
    return spy;
  },
  mock: (_modulePath: string, _factory?: () => unknown) => {
    // vi.mock is called at the top level and hoisted in Vitest
    // Bun doesn't support this properly, but we can return a no-op function
    // to prevent "vi.mock is not a function" errors
    // Tests using vi.mock should use conditional skipping for Bun
    return undefined;
  },
  hoisted: (factory: () => unknown) => {
    // vi.hoisted is used with vi.mock to hoist values
    // Since we can't properly support vi.mock in Bun, just call the factory
    return factory();
  },
  stubGlobal: (name: string, value: unknown) => {
    (globalThis as Record<string, unknown>)[name] = value;
  },
  restoreAllMocks: () => {},
  clearAllMocks: () => {},
  resetAllMocks: () => {},
  clearAllTimers: () => {
    // Bun doesn't need manual timer clearing
  },
  advanceTimersByTime: (_ms: number) => {
    // Bun timer API stub
  },
  runAllTimers: () => {
    // Bun timer API stub
  },
  useRealTimers: () => {
    // Bun uses real timers by default
  },
  useFakeTimers: () => {
    // Bun doesn't support fake timers like Vitest
  },
  unstubAllGlobals: () => {
    // Would need to track stubbed globals to restore
  },
};

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

// Mock Element.prototype.scrollIntoView
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Mock HTMLElement.prototype.scrollTo
if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = () => {};
}

// Mock window.scrollTo
if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = () => {};
}
