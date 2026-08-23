import { describe, it, expect } from "bun:test";
import { encodeBinaryMessage, decodeBinaryMessage } from "../msgpack";

describe("msgpack binary protocol", () => {
  it("should encode object to Uint8Array buffer and decode back cleanly", () => {
    const payload = { userId: "user-123", room: "lobby", count: 42 };
    const encoded = encodeBinaryMessage(payload);

    expect(encoded.buffer).toBeInstanceOf(Uint8Array);
    expect(encoded.byteLength).toBeGreaterThan(0);

    const decoded = decodeBinaryMessage<typeof payload>(encoded.buffer);
    expect(decoded.userId).toBe("user-123");
    expect(decoded.room).toBe("lobby");
    expect(decoded.count).toBe(42);
  });
});
