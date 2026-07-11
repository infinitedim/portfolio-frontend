import Script from "next/script";
import type { JSX } from "react";

export function ThemeInitScript(): JSX.Element {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `!(function(){if(window.trustedTypes&&!window.trustedTypes.defaultPolicy){window.trustedTypes.createPolicy("default",{createHTML:function(t){return t},createScript:function(t){return t},createScriptURL:function(t){return t}})}try{var t=localStorage.getItem("terminal-theme");if(t){var e=t;try{var r=JSON.parse(t);"string"==typeof r?e=r:r&&"string"==typeof r.theme&&(e=r.theme)}catch(t){}const r=document.documentElement.classList;"dark"===e?r.add("dark"):"light"===e&&r.remove("dark")}}catch(t){}})();`,
      }}
    />
  );
}

