import { headers } from "next/headers";
import { isValidTerminalReferer } from "@/lib/gate/referer-check";
import { GateLevel3PageClient } from "./gate-level-3-page-client";
import type { JSX } from "react";

export default async function GateLevel3Page(): Promise<JSX.Element> {
  const headersList = await headers();
  const referer = headersList.get("referer");
  const refererGranted = isValidTerminalReferer(referer);

  return <GateLevel3PageClient refererGranted={refererGranted} />;
}
