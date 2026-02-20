"use client";

import dynamic from "next/dynamic";
import { type JSX } from "react";

interface LetterGlitchProps {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
  className?: string;
}

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

export default LetterGlitch;
