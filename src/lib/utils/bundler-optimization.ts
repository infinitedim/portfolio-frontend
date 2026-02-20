

export const preloadCriticalResources = () => {
  const fonts = ["/fonts/fira-code.woff2", "/fonts/cascadia-code.woff2"];

  fonts.forEach((font) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = font;
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
};

export const prefetchResources = () => {
  const themes = ["dracula", "hacker", "cyberpunk"];

  themes.forEach((theme) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/themes/${theme}.json`;
    document.head.appendChild(link);
  });
};

export const optimizeImageLoading = () => {
  const images = document.querySelectorAll("img:not([loading])");
  images.forEach((img) => {
    if (img instanceof HTMLImageElement) {
      img.loading = "lazy";
    }
  });
};

export const dynamicImportWithRetry = async <T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Dynamic import failed after retries");
};

export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== "development") return;

  const performanceEntries = performance.getEntriesByType("navigation");
  

  if (performanceEntries.length > 0) {
    const navEntry = performanceEntries[0] as PerformanceNavigationTiming;
    console.log("📊 Bundle Performance Metrics:", {
      loadTime: `${Math.round(navEntry.loadEventEnd - navEntry.fetchStart)}ms`,
      domContentLoaded: `${Math.round(navEntry.domContentLoadedEventEnd - navEntry.fetchStart)}ms`,
      firstPaint: "Check DevTools Performance tab",
    });
  }
};

export const markUnusedExports = () => {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "Development mode - unused exports will be removed in production",
    );
  }
};

export const SplittingStrategies = {
  byRoute: () => ({
    home: () => import("@/app/page"),
    terminal: () => import("@/components/organisms/terminal/terminal"),
    customization: () =>
      import("@/components/organisms/customization/customization-manager"),
  }),

  byFeature: () => ({
    themes: () => import("@/lib/themes/theme-config"),
    commands: () => import("@/lib/commands/command-registry"),
    roadmap: () => import("@/lib/services/roadmap-service"),
  }),

  bySize: () => ({
    charts: () => import("recharts"),
    icons: () => import("lucide-react"),
    ui: () => import("@radix-ui/react-dialog"),
  }),
};

export const addResourceHints = () => {
  const dnsPrefetch = [
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
  ];

  dnsPrefetch.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = domain;
    document.head.appendChild(link);
  });

  const preconnect = ["https://fonts.gstatic.com"];

  preconnect.forEach((origin) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
};

export const optimizeThirdParty = () => {
  const analytics = "[src*='analytics']";
  const tracking = "[src*='tracking']";
  const scripts = document.querySelectorAll(
    `script${analytics}, script${tracking}`,
  );
  scripts.forEach((script) => {
    if (script instanceof HTMLScriptElement) {
      script.defer = true;
    }
  });
};

export const optimizeMemoryUsage = () => {
  const cleanupListeners = () => {
    const unusedEvents = ["resize", "scroll", "touchmove"];
    unusedEvents.forEach((event) => {
      const listeners = (
        window as Window & {_eventListeners?: Record<string, unknown[]>}
      )._eventListeners?.[event];
      if (listeners && listeners.length > 10) {
        console.warn(`Many ${event} listeners detected. Consider cleanup.`);
      }
    });
  };

  setInterval(cleanupListeners, 30000);

  const clearOldStorage = () => {
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    

    function isDataWithTimestamp(data: unknown): data is {timestamp: number} {
      return (
        typeof data === "object" &&
        data !== null &&
        "timestamp" in data &&
        typeof (data as {timestamp: unknown}).timestamp === "number"
      );
    }

    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith("temp-") || key.startsWith("cache-")) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const data = JSON.parse(item);
            if (
              isDataWithTimestamp(data) &&
              Date.now() - data.timestamp > MS_IN_DAY
            ) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    });
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearOldStorage();
    }
  });
};

export const initBundleOptimizations = () => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      preloadCriticalResources();
      addResourceHints();
      optimizeImageLoading();
      optimizeThirdParty();
      optimizeMemoryUsage();

      if (process.env.NODE_ENV === "development") {
        setTimeout(analyzeBundleSize, 2000);
      }
    });
  } else {
    preloadCriticalResources();
    addResourceHints();
    optimizeImageLoading();
    optimizeThirdParty();
    optimizeMemoryUsage();
  }

  setTimeout(prefetchResources, 3000);
};
