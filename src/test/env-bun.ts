import { GlobalWindow } from "happy-dom";

type GlobalRecord = Record<string, unknown>;

const g = globalThis as unknown as GlobalRecord;

if (typeof g.document === "undefined") {
  const windowInstance = new GlobalWindow({ url: "http://localhost:3000" });
  const winObj = windowInstance as unknown as GlobalRecord;

  g.window = windowInstance;
  g.Window = winObj.constructor || windowInstance.Window || class Window {};
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
  g.ResizeObserver =
    windowInstance.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  g.IntersectionObserver =
    windowInstance.IntersectionObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  g.NodeFilter = windowInstance.NodeFilter;
  g.DocumentFragment = windowInstance.DocumentFragment;
  g.HTMLDocument = windowInstance.HTMLDocument;
  g.Range = windowInstance.Range || class {};
  g.Selection = windowInstance.Selection || class {};

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

  class MockStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.get(key) ?? null;
    }
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }
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
