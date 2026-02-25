import { JSDOM } from "jsdom";
import { expect } from "bun:test";

const jestDomMatchers = require("@testing-library/jest-dom/matchers") as Record<
  string,
  (...args: unknown[]) => unknown
>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
expect.extend(jestDomMatchers as any);

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  pretendToBeVisual: true,
});

const { window: jsdomWindow } = dom;

const g = globalThis as typeof globalThis & Record<string, unknown>;

g.window = jsdomWindow as unknown as Window & typeof globalThis;
g.document = jsdomWindow.document;
g.navigator = jsdomWindow.navigator;
g.location = jsdomWindow.location;
g.history = jsdomWindow.history;
g.screen = jsdomWindow.screen;
g.scrollTo = () => {};
g.getComputedStyle = jsdomWindow.getComputedStyle.bind(jsdomWindow);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 16);
g.cancelAnimationFrame = clearTimeout;
g.MutationObserver = jsdomWindow.MutationObserver;
g.Node = jsdomWindow.Node as unknown as typeof Node;
g.Element = jsdomWindow.Element as unknown as typeof Element;
g.HTMLElement = jsdomWindow.HTMLElement as unknown as typeof HTMLElement;
g.HTMLInputElement =
  jsdomWindow.HTMLInputElement as unknown as typeof HTMLInputElement;
g.HTMLTextAreaElement =
  jsdomWindow.HTMLTextAreaElement as unknown as typeof HTMLTextAreaElement;
g.HTMLSelectElement =
  jsdomWindow.HTMLSelectElement as unknown as typeof HTMLSelectElement;
g.Text = jsdomWindow.Text as unknown as typeof Text;
g.DocumentFragment =
  jsdomWindow.DocumentFragment as unknown as typeof DocumentFragment;
g.CustomEvent = jsdomWindow.CustomEvent as unknown as typeof CustomEvent;
g.Event = jsdomWindow.Event as unknown as typeof Event;
g.MouseEvent = jsdomWindow.MouseEvent as unknown as typeof MouseEvent;
g.KeyboardEvent = jsdomWindow.KeyboardEvent as unknown as typeof KeyboardEvent;
g.FocusEvent = jsdomWindow.FocusEvent as unknown as typeof FocusEvent;
g.InputEvent = jsdomWindow.InputEvent as unknown as typeof InputEvent;
g.PointerEvent = jsdomWindow.PointerEvent as unknown as typeof PointerEvent;
g.DOMParser = jsdomWindow.DOMParser;
g.SVGElement = jsdomWindow.SVGElement;

const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
g.matchMedia = matchMediaMock;

try {
  Object.defineProperty(jsdomWindow, "matchMedia", {
    value: matchMediaMock,
    writable: true,
    configurable: true,
  });
} catch {
  throw new Error("Failed to define matchMedia on jsdom window", {
    cause: new Error("JSDOM may not support matchMedia in this environment"),
  });
}

function makeStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}
g.localStorage = makeStorage() as unknown as Storage;
g.sessionStorage = makeStorage() as unknown as Storage;

g.ResizeObserver = class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

g.IntersectionObserver = class MockIntersectionObserver {
  constructor(_cb: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

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
if (typeof HTMLElement !== "undefined") {
  if (!HTMLElement.prototype.scrollTo)
    HTMLElement.prototype.scrollTo = () => {};
  if (!HTMLElement.prototype.scrollIntoView)
    HTMLElement.prototype.scrollIntoView = () => {};
}
