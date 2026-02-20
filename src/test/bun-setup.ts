(globalThis as Record<string, unknown>).vi = {
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
    return undefined;
  },
  hoisted: (factory: () => unknown) => {
    return factory();
  },
  stubGlobal: (name: string, value: unknown) => {
    (globalThis as Record<string, unknown>)[name] = value;
  },
  restoreAllMocks: () => {},
  clearAllMocks: () => {},
  resetAllMocks: () => {},
  clearAllTimers: () => {},
  advanceTimersByTime: (_ms: number) => {},
  runAllTimers: () => {},
  useRealTimers: () => {},
  useFakeTimers: () => {},
  unstubAllGlobals: () => {},
};

globalThis.ResizeObserver = class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

globalThis.IntersectionObserver = class MockIntersectionObserver {
  constructor(_callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

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

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = () => {};
}

if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = () => {};
}
