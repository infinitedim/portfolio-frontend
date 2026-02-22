// Server-safe exports (Node.js crypto)
export {
  serverHandshake,
  serverEncrypt,
  serverDecrypt,
  hasSession,
  refreshSession,
  fingerprintHash,
} from "./server";
export type { HandshakeResult, EncryptedPayload } from "./server";

// HOF for wrapping API route handlers
export { withEncryption } from "./with-encryption";

// Client exports are NOT re-exported here — import from @/lib/crypto/client
// or @/lib/crypto/encrypted-fetch directly in "use client" files.
