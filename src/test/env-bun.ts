import { GlobalWindow } from "happy-dom";

/**
 * Generic dictionary mapping string keys to unknown values for global object mutations.
 */
type GlobalRecord = Record<string, unknown>;

/**
 * Reference to globalThis cast as a mutable dictionary for runtime environment shimming.
 */
const g = globalThis as unknown as GlobalRecord;

if (typeof g.document === "undefined") {
  const windowInstance = new GlobalWindow({ url: "http://localhost:3000" });
  const winObj = windowInstance as unknown as GlobalRecord;

  /**
   * Mock Window constructor fallback.
   */
  class FallbackWindow {}

  g.window = windowInstance;
  g.Window = winObj.constructor || windowInstance.Window || FallbackWindow;
  g.document = windowInstance.document;

  if (!windowInstance.document.documentElement) {
    const html = windowInstance.document.createElement("html");
    windowInstance.document.appendChild(html);
  }
  if (!windowInstance.document.body) {
    const body = windowInstance.document.createElement("body");
    windowInstance.document.documentElement.appendChild(body);
  }

  g.HTMLElement = windowInstance.HTMLElement;
  g.Element = windowInstance.Element;
  if (windowInstance.Element?.prototype) {
    windowInstance.Element.prototype.scrollIntoView = () => {};
  }
  g.Node = windowInstance.Node;
  g.Event = windowInstance.Event;
  g.CustomEvent = windowInstance.CustomEvent;
  g.KeyboardEvent = windowInstance.KeyboardEvent;
  g.MouseEvent = windowInstance.MouseEvent;
  g.navigator = windowInstance.navigator;
  g.location = windowInstance.location;
  g.history = windowInstance.history;

  Object.defineProperty(globalThis, "innerWidth", {
    get: () => (typeof winObj.innerWidth === "number" ? winObj.innerWidth : 1024),
    set: (v: number) => {
      winObj.innerWidth = v;
    },
    configurable: true,
  });
  Object.defineProperty(globalThis, "innerHeight", {
    get: () => (typeof winObj.innerHeight === "number" ? winObj.innerHeight : 768),
    set: (v: number) => {
      winObj.innerHeight = v;
    },
    configurable: true,
  });
  g.MutationObserver = windowInstance.MutationObserver;

  /**
   * Mock ResizeObserver fallback implementation.
   */
  class FallbackResizeObserver {
    /**
     * Observes target element.
     */
    observe() {}
    /**
     * Stops observing target element.
     */
    unobserve() {}
    /**
     * Disconnects observer.
     */
    disconnect() {}
  }
  g.ResizeObserver = windowInstance.ResizeObserver || FallbackResizeObserver;

  /**
   * Mock IntersectionObserver fallback implementation.
   */
  class FallbackIntersectionObserver {
    /**
     * Observes target element.
     */
    observe() {}
    /**
     * Stops observing target element.
     */
    unobserve() {}
    /**
     * Disconnects observer.
     */
    disconnect() {}
  }
  g.IntersectionObserver =
    windowInstance.IntersectionObserver || FallbackIntersectionObserver;

  g.NodeFilter = windowInstance.NodeFilter;
  g.DocumentFragment = windowInstance.DocumentFragment;
  g.HTMLDocument = windowInstance.HTMLDocument;

  /**
   * Mock Range fallback implementation.
   */
  class FallbackRange {}
  g.Range = windowInstance.Range || FallbackRange;

  /**
   * Mock Selection fallback implementation.
   */
  class FallbackSelection {}
  g.Selection = windowInstance.Selection || FallbackSelection;

  for (const name of Object.getOwnPropertyNames(windowInstance)) {
    if (
      name.startsWith("HTML") ||
      name.startsWith("SVG") ||
      name.endsWith("Event") ||
      name.endsWith("Observer") ||
      name.endsWith("Element") ||
      name.endsWith("Node")
    ) {
      if (!(name in globalThis)) {
        try {
          g[name] = winObj[name];
        } // eslint-disable-next-line no-empty
    catch {}
      }
    }
  }

  /**
   * In-memory Web Storage implementation for test runners lacking native localStorage/sessionStorage.
   */
  class MockStorage implements Storage {
    private store = new Map<string, string>();

    /**
     * Retrieves the total number of key/value pairs currently stored.
     *
     * @returns The count of stored entries.
     */
    get length() {
      return this.store.size;
    }

    /**
     * Clears all stored key/value entries from the storage instance.
     */
    clear() {
      this.store.clear();
    }

    /**
     * Returns the string value corresponding to the specified key.
     *
     * @param key - The storage key name to look up.
     * @returns The stored string value or null if the key is not found.
     */
    getItem(key: string) {
      return this.store.get(key) ?? null;
    }

    /**
     * Returns the key name at the specified zero-based index.
     *
     * @param index - The zero-based integer index of the key.
     * @returns The key name at that index, or null if out of bounds.
     */
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }

    /**
     * Removes the key and its associated value from the storage instance and dispatches a storage event.
     *
     * @param key - The key name to remove.
     */
    removeItem(key: string) {
      this.store.delete(key);
      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function"
      ) {
        const EventCtor = (g.Event as typeof Event | undefined) ?? Event;
        window.dispatchEvent(new EventCtor("storage"));
      }
    }

    /**
     * Sets or updates the value associated with the specified key and dispatches a storage event.
     *
     * @param key - The key name to set.
     * @param value - The value string to associate with the key.
     */
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function"
      ) {
        const EventCtor = (g.Event as typeof Event | undefined) ?? Event;
        window.dispatchEvent(new EventCtor("storage"));
      }
    }
  }

  Object.defineProperty(globalThis, "localStorage", {
    value: new MockStorage(),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: new MockStorage(),
    writable: true,
    configurable: true,
  });
  g.getComputedStyle = (el: Element, pseudo?: string | null) => {
    const getFn = winObj.getComputedStyle;
    if (typeof getFn === "function") {
      return (getFn as (e: unknown, p?: unknown) => CSSStyleDeclaration)(
        el,
        pseudo,
      );
    }
    return {} as CSSStyleDeclaration;
  };
  g.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const raf = winObj.requestAnimationFrame;
    if (typeof raf === "function") {
      return (raf as (callback: FrameRequestCallback) => number)(cb);
    }
    return 0;
  };
  g.cancelAnimationFrame = (id: number) => {
    const caf = winObj.cancelAnimationFrame;
    if (typeof caf === "function") {
      (caf as (handle: number) => void)(id);
    }
  };
  if (!g.performance || typeof (g.performance as Record<string, unknown>).now !== "function") {
    g.performance = {
      now: () => Date.now(),
      getEntriesByType: () => [],
      mark: () => {},
      measure: () => {},
      timeOrigin: Date.now(),
      clearMarks: () => {},
      clearMeasures: () => {},
    };
  }
}
