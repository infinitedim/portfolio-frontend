import { type JSX } from "react";
import { GateLevel3PageClient } from "./gate-level-3-page-client";

/**
 * Server-side entry page component for Gate Level 3 (Natas 5 challenge).
 *
 * @description
 * Delegates rendering directly to the client-side component {@link GateLevel3PageClient}
 * which initializes authentication state, challenge data retrieval, and interactive puzzle solving.
 *
 * @returns {JSX.Element} The rendered Gate Level 3 client page component.
 */
export default function GateLevel3Page(): JSX.Element {
  return <GateLevel3PageClient />;
}
