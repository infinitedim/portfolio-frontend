(function () {
  try {
    var storageKey = "terminal-theme";
    var stored = localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    var theme = stored;
    try {
      var parsed = JSON.parse(stored);
      if (typeof parsed === "string") {
        theme = parsed;
      } else if (parsed && typeof parsed.theme === "string") {
        theme = parsed.theme;
      }
    } catch (_error) {
      // next-themes stores plain strings
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    }
  } catch (_error) {
    // Ignore storage access errors (SSR/private mode)
  }
})();
