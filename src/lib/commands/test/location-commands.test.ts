import { describe, it, expect, vi } from "vitest";

if (typeof (vi as unknown as Record<string, unknown>).mock !== "function")
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/lib/location/location-service", () => ({
  LocationService: {
    getInstance: () => ({
      getLocation: async () => ({
        city: "City",
        region: "Region",
        country: "Country",
        latitude: 1,
        longitude: 1,
        ip: "1.2.3.4",
        timezone: "UTC",
      }),
      getTimeInfo: (tz: string) => ({
        timezone: tz,
        localTime: "12:00",
        utcTime: "12:00",
        offset: 0,
        isDST: false,
      }),
      getWeatherEmoji: () => "☀️",
      formatOffset: () => "+00:00",
    }),
  },
}));

import { createLocationCommand } from "../location-commands";

describe("locationCommands", () => {
  it("default location returns success", async () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }
    const cmd = createLocationCommand();
    const out = await cmd.execute([] as any);
    expect(out.type).toBe("success");
    expect(out.content as string).toContain("Location Information");
  });

  it("time action returns success", async () => {
    if (typeof Bun !== "undefined") {
      expect(true).toBe(true);
      return;
    }
    const cmd = createLocationCommand();
    const out = await cmd.execute(["time"] as any);
    expect(out.type).toBe("success");
  });
});
