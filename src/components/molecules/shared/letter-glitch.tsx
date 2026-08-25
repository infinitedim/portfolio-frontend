"use client";

import dynamic from "next/dynamic";
import { type JSX } from "react";

/**
 * Configuration properties for the LetterGlitch background effect component.
 */
interface LetterGlitchProps {
  /**
   * Array of hex or CSS color strings used for randomized glitching characters.
   */
  glitchColors?: string[];
  /**
   * Speed interval factor in milliseconds for the letter matrix animation loop.
   */
  glitchSpeed?: number;
  /**
   * Whether to render a central radial vignette shadow overlay.
   */
  centerVignette?: boolean;
  /**
   * Whether to render an outer vignette shadow along the viewport edges.
   */
  outerVignette?: boolean;
  /**
   * Whether to apply smooth easing to glitch step transitions.
   */
  smooth?: boolean;
  /**
   * Custom charset string used to draw randomized matrix grid characters.
   */
  characters?: string;
  /**
   * Optional CSS class names applied to the container element.
   */
  className?: string;
}

/**
 * Dynamically loaded client-side canvas component for rendering the animated letter glitch effect.
 * Disables SSR to prevent canvas context hydration mismatches on server pre-rendering.
 */
const LetterGlitchClient = dynamic(() => import("./letter-glitch-client"), {
  ssr: false,
  loading: () => (
    <canvas
      className="fixed inset-0 w-full h-full pointer-events-none opacity-20"
      style={{
        zIndex: -10,
        background: "transparent",
      }}
      aria-hidden="true"
    />
  ),
});

/**
 * LetterGlitch component renders a full-screen or container-bounded ASCII/matrix-style
 * animated glitch background on an HTML5 canvas.
 *
 * Implements defensive error boundary fallback rendering if canvas creation fails.
 *
 * @param props - Configuration props for color scheme, speeds, vignettes, and charsets.
 * @returns A JSX element rendering the dynamically imported canvas glitch client or fallback container.
 */
export function LetterGlitch(props: LetterGlitchProps): JSX.Element {
  try {
    return <LetterGlitchClient {...props} />;
  } catch (error) {
    console.error("LetterGlitch error:", error);
    return (
      <div
        className={`fixed inset-0 w-full h-full pointer-events-none ${props.className || ""}`}
        style={{ zIndex: -10 }}
        aria-hidden="true"
      />
    );
  }
}
