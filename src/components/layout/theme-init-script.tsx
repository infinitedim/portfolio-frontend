import Script from "next/script";
import type { JSX } from "react";

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
