"use client";

import { useEffect, useState, ReactNode, JSX } from "react";

/**
 * Props for the NoSSR component wrapper.
 */
interface NoSSRProps {
  /**
   * The React children nodes to be rendered strictly after mounting on the client.
   */
  children: ReactNode;
  /**
   * Optional fallback React node to render on the server and before client-side hydration completes.
   * @defaultValue null
   */
  fallback?: ReactNode;
}

/**
 * NoSSR is a utility wrapper component that defers rendering of its children
 * until the component has successfully mounted in the browser.
 *
 * Prevents hydration mismatch warnings for components that depend on browser-only
 * APIs (such as window, localStorage, navigator, or dynamic client timestamps).
 *
 * @param props - Configuration properties containing children and optional fallback.
 * @param props.children - Child elements to render exclusively on the client.
 * @param props.fallback - Optional placeholder element rendered during SSR and pre-mount phase.
 * @returns The children elements when mounted on the client, or the fallback element.
 */
export function NoSSR({ children, fallback = null }: NoSSRProps): JSX.Element {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
