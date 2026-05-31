import { headers } from "next/headers";
import Script from "next/script";
import type { JSX } from "react";

export async function ThemeInitScript(): Promise<JSX.Element> {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <Script
      src="/theme-init.js"
      strategy="beforeInteractive"
      nonce={nonce}
    />
  );
}
