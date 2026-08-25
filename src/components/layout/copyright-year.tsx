"use client";

import { type JSX } from "react";

/**
 * Client-side component that renders the current Gregorian calendar year for copyright notices, avoiding SSR hydration mismatches across year boundaries.
 * @returns {JSX.Element} React fragment rendering the four-digit current year string.
 */
export function CopyrightYear(): JSX.Element {
  return <>{new Date().getFullYear()}</>;
}
