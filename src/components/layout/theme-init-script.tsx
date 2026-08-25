import Script from "next/script";
import type { JSX } from "react";

/**
 * Critical theme initialization script component.
 *
 * Injects a synchronous, `beforeInteractive` inline JavaScript snippet that reads the
 * stored theme configuration from `localStorage` (`"terminal-theme"`) and toggles the
 * `"dark"` CSS class on the root `<html>` element (`document.documentElement`).
 * This prevents Flash of Unstyled Content (FOUC) / theme flashing during client hydration.
 *
 * @returns {JSX.Element} The Next.js `Script` component configured for pre-interactive execution.
 */
export function ThemeInitScript(): JSX.Element {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("terminal-theme");if(t){var e=t;try{var r=JSON.parse(t);"string"==typeof r?e=r:r&&"string"==typeof r.theme&&(e=r.theme)}catch(t){}var c=document.documentElement.classList;"dark"===e?c.add("dark"):"light"===e&&c.remove("dark")}}catch(t){}})();`,
      }}
    />
  );
}

