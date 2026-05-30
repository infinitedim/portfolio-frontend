import { Suspense, type JSX } from "react";
import { headers } from "next/headers";
import { isValidTerminalReferer } from "@/lib/gate/referer-check";
import { GateLevel3PageClient } from "./gate-level-3-page-client";

async function GateLevel3RefererContent(): Promise<JSX.Element> {
  const headersList = await headers();
  const referer = headersList.get("referer");
  const refererGranted = isValidTerminalReferer(referer);

  return <GateLevel3PageClient refererGranted={refererGranted} />;
}

export default function GateLevel3Page(): JSX.Element {
  return (
    <Suspense fallback={<p className="text-neutral-500">Loading gate...</p>}>
      <GateLevel3RefererContent />
    </Suspense>
  );
}
