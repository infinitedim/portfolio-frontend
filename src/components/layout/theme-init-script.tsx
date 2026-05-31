import Script from "next/script";
import type { JSX } from "react";

export function ThemeInitScript(): JSX.Element {
  return (
    <Script
      src="/theme-init.js"
      strategy="beforeInteractive"
    />
  );
}
