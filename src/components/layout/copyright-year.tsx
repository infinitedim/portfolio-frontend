"use client";

import { type JSX } from "react";

export function CopyrightYear(): JSX.Element {
  return <>{new Date().getFullYear()}</>;
}
