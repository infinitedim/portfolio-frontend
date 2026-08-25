/**
 * Prefetches high-priority static resources in the background.
 */
export const prefetchResources = (): void => {
};

/**
 * Applies native lazy-loading attributes (`loading="lazy"`) to all image elements lacking explicit loading strategies.
 */
export const optimizeImageLoading = (): void => {
  const images = document.querySelectorAll("img:not([loading])");
  images.forEach((img) => {
    if (img instanceof HTMLImageElement) {
      img.loading = "lazy";
    }
  });
};

/**
 * Executes a dynamic module import with configurable retry attempts and backoff delay.
 *
 * @template T - Module or value type returned by the import function.
 * @param importFn - Function invoking the dynamic `import()` statement.
 * @param retries - Maximum number of import attempts before failing.
 * @param delay - Base delay in milliseconds between retries.
 * @returns A promise resolving to the imported module or entity of type T.
 * @throws {Error} If the import fails on all retry attempts.
 */
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

/**
 * Measures and logs bundle navigation timing metrics in the browser console during development mode.
 */
export const analyzeBundleSize = (): void => {
  if (process.env.NODE_ENV !== "development") return;

  const performanceEntries = performance.getEntriesByType("navigation");

  if (performanceEntries.length > 0) {
    const navEntry = performanceEntries[0] as PerformanceNavigationTiming;
    console.log("Bundle Performance Metrics:", {
      loadTime: `${Math.round(navEntry.loadEventEnd - navEntry.fetchStart)}ms`,
      domContentLoaded: `${Math.round(navEntry.domContentLoadedEventEnd - navEntry.fetchStart)}ms`,
      firstPaint: "Check DevTools Performance tab",
    });
  }
};

/**
 * Logs developmental tree-shaking warnings regarding unused exports.
 */
export const markUnusedExports = (): void => {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "Development mode - unused exports will be removed in production",
    );
  }
};

/**
 * Collection of dynamic code-splitting strategies organized by feature and bundle size.
 */
export const SplittingStrategies = {
  /**
   * Code-splitting loaders partitioned by distinct application features.
   *
   * @returns Object with dynamic import loader functions for each feature.
   */
  byFeature: () => ({
    /**
     * Loads the themes configuration module.
     *
     * @returns Promise resolving to the theme configuration module.
     */
    themes: () => import("@/lib/themes/theme-config"),
    /**
     * Loads the command registry module.
     *
     * @returns Promise resolving to the command registry module.
     */
    commands: () => import("@/lib/commands/command-registry"),
    /**
     * Loads the roadmap service module.
     *
     * @returns Promise resolving to the roadmap service module.
     */
    roadmap: () => import("@/lib/services/roadmap-service"),
  }),

  /**
   * Code-splitting loaders partitioned by third-party package bundle size.
   *
   * @returns Object with dynamic import loader functions for heavy packages.
   */
  bySize: () => ({
    /**
     * Loads Lucide icons library dynamically.
     *
     * @returns Promise resolving to the lucide-react module.
     */
    icons: () => import("lucide-react"),
    /**
     * Loads Radix UI Dialog primitives dynamically.
     *
     * @returns Promise resolving to the @radix-ui/react-dialog module.
     */
    ui: () => import("@radix-ui/react-dialog"),
  }),
};

/**
 * Injects DNS prefetch and preconnect `<link>` elements into document `<head>` to accelerate external connections.
 */
export const addResourceHints = (): void => {
  if (typeof document === "undefined") return;

  const dnsPrefetch = ["https://cdn.jsdelivr.net"];

  dnsPrefetch.forEach((domain) => {
    if (
      document.querySelector &&
      document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`)
    ) {
      return;
    }
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = domain;
    document.head?.appendChild(link);
  });

  const preconnect: string[] = [];

  preconnect.forEach((origin) => {
    if (
      document.querySelector &&
      document.querySelector(`link[rel="preconnect"][href="${origin}"]`)
    ) {
      return;
    }
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head?.appendChild(link);
  });
};

/**
 * Applies the `defer` attribute to third-party tracking and analytics script tags.
 */
export const optimizeThirdParty = (): void => {
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

/**
 * Initializes memory optimization listeners, monitoring event listener counts and clearing stale localStorage entries.
 */
export const optimizeMemoryUsage = (): void => {
  /**
   * Periodically checks for unusually high counts of window event listeners.
   */
  const cleanupListeners = () => {
    const unusedEvents = ["resize", "scroll", "touchmove"];
    unusedEvents.forEach((event) => {
      const listeners = (
        window as Window & { _eventListeners?: Record<string, unknown[]> }
      )._eventListeners?.[event];
      if (listeners && listeners.length > 10) {
        console.warn(`Many ${event} listeners detected. Consider cleanup.`);
      }
    });
  };

  setInterval(cleanupListeners, 30000);

  /**
   * Scans localStorage and removes temporary or cached items older than 24 hours.
   */
  const clearOldStorage = () => {
    const MS_IN_DAY = 24 * 60 * 60 * 1000;

    /**
     * Type guard checking if parsed data is an object containing a numeric timestamp.
     *
     * @param data - The parsed storage value.
     * @returns True if data has a numeric timestamp property.
     */
    function isDataWithTimestamp(data: unknown): data is { timestamp: number } {
      return (
        typeof data === "object" &&
        data !== null &&
        "timestamp" in data &&
        typeof (data as { timestamp: unknown }).timestamp === "number"
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

/**
 * Initializes all client-side bundle performance and resource optimizations.
 */
export const initBundleOptimizations = (): void => {
  /**
   * Helper runner to execute all bundle optimization routines.
   */
  const run = () => {
    addResourceHints();
    optimizeImageLoading();
    optimizeThirdParty();
    optimizeMemoryUsage();

    if (process.env.NODE_ENV === "development") {
      setTimeout(analyzeBundleSize, 2000);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  setTimeout(prefetchResources, 3000);
};

