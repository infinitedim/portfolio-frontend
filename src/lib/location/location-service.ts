/**
 * Geographic and network location details resolved for a client IP.
 */
export interface LocationInfo {
  /** Resolved city name. */
  city: string;
  /** Resolved country name. */
  country: string;
  /** Resolved state or region name. */
  region: string;
  /** IANA timezone identifier string. */
  timezone: string;
  /** Geographic latitude coordinate. */
  latitude: number;
  /** Geographic longitude coordinate. */
  longitude: number;
  /** Client IP address string. */
  ip: string;
}

/**
 * Time and timezone information calculated for a specific timezone.
 */
export interface TimeInfo {
  /** Formatted local time string in the target timezone. */
  localTime: string;
  /** ISO 8601 UTC timestamp string. */
  utcTime: string;
  /** Target IANA timezone identifier. */
  timezone: string;
  /** Timezone offset in minutes relative to the client's UTC offset. */
  offset: number;
  /** Indicates whether Daylight Saving Time is currently active. */
  isDST: boolean;
}

/**
 * Singleton service for fetching IP-based geolocation data and computing timezone metrics.
 */
export class LocationService {
  private static instance: LocationService;
  private cachedLocation: LocationInfo | null = null;
  private cacheTimeout = 30 * 60 * 1000;
  private lastFetch = 0;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Retrieves the shared singleton instance of the LocationService.
   * @returns The LocationService singleton instance.
   */
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Fetches client geographic location with in-memory caching.
   * @returns Promise resolving to LocationInfo or null if lookup fails.
   */
  async getLocation(): Promise<LocationInfo | null> {
    if (
      this.cachedLocation &&
      Date.now() - this.lastFetch < this.cacheTimeout
    ) {
      return this.cachedLocation;
    }

    try {
      const location = await this.fetchLocationFromService();

      if (location) {
        this.cachedLocation = location;
        this.lastFetch = Date.now();
        return location;
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }

    return null;
  }

  /**
   * Queries external IP geolocation APIs (ipapi.co with fallback to ip-api.com).
   * @returns Promise resolving to parsed LocationInfo or null.
   */
  private async fetchLocationFromService(): Promise<LocationInfo | null> {
    try {
      const response = await fetch("https://ipapi.co/json/");
      if (response.ok) {
        const data = await response.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "city" in data &&
          typeof data.city === "string" &&
          "country_name" in data &&
          typeof data.country_name === "string" &&
          "region" in data &&
          typeof data.region === "string" &&
          "timezone" in data &&
          typeof data.timezone === "string" &&
          "latitude" in data &&
          typeof data.latitude === "number" &&
          "longitude" in data &&
          typeof data.longitude === "number" &&
          "ip" in data &&
          typeof data.ip === "string"
        ) {
          return {
            city: data.city || "Unknown",
            country: data.country_name || "Unknown",
            region: data.region || "Unknown",
            timezone: data.timezone || "UTC",
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            ip: data.ip || "Unknown",
          };
        }
      } else {
        throw new Error("Invalid response from ipapi.co");
      }
    } catch (error) {
      console.warn("ipapi.co failed", error);
      console.warn("ipapi.co failed, trying fallback...");
    }

    try {
      const response = await fetch("http://ip-api.com/json/");
      if (response.ok) {
        const data = await response.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "status" in data &&
          typeof data.status === "string" &&
          "city" in data &&
          typeof data.city === "string" &&
          "country" in data &&
          typeof data.country === "string" &&
          "regionName" in data &&
          typeof data.regionName === "string" &&
          "timezone" in data &&
          typeof data.timezone === "string" &&
          "lat" in data &&
          typeof data.lat === "number" &&
          "lon" in data &&
          typeof data.lon === "number" &&
          "query" in data &&
          typeof data.query === "string"
        ) {
          if (data.status === "success") {
            return {
              city: data.city || "Unknown",
              country: data.country || "Unknown",
              region: data.regionName || "Unknown",
              timezone: data.timezone || "UTC",
              latitude: data.lat || 0,
              longitude: data.lon || 0,
              ip: data.query || "Unknown",
            };
          } else {
            throw new Error("Invalid response from ip-api.com");
          }
        } else {
          throw new Error("Invalid response from ip-api.com");
        }
      }
    } catch (error) {
      console.warn("ip-api.com failed", error);
      console.warn("ip-api.com failed");
    }

    return null;
  }

  /**
   * Calculates current local and UTC times, offset, and DST status for a specified timezone.
   * @param timezone - Target IANA timezone identifier.
   * @returns Computed TimeInfo object.
   */
  getTimeInfo(timezone: string = "UTC"): TimeInfo {
    const now = new Date();
    const utcTime = now.toISOString();

    const localDate = new Date(
      now.toLocaleString("en-US", { timeZone: timezone }),
    );
    const localTime = localDate.toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const utcOffset = now.getTimezoneOffset();
    const targetOffset = this.getTimezoneOffset(timezone);
    const offset = targetOffset - utcOffset;

    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);
    const janOffset = this.getTimezoneOffset(timezone, jan);
    const julOffset = this.getTimezoneOffset(timezone, jul);
    const isDST = Math.max(janOffset, julOffset) === targetOffset;

    return {
      localTime,
      utcTime,
      timezone,
      offset,
      isDST,
    };
  }

  /**
   * Computes the minute difference between UTC and the specified timezone for a given date.
   * @param timezone - Target IANA timezone string.
   * @param date - Date instance to evaluate offset at.
   * @returns Timezone offset in minutes.
   */
  private getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    try {
      const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
      const target = new Date(
        date.toLocaleString("en-US", { timeZone: timezone }),
      );
      return (target.getTime() - utc.getTime()) / (1000 * 60);
    } catch {
      return 0;
    }
  }

  /**
   * Formats a minute offset into standard UTC offset notation (e.g. UTC+07:00).
   * @param offsetMinutes - Timezone offset in minutes.
   * @returns Formatted UTC offset string.
   */
  formatOffset(offsetMinutes: number): string {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Determines a season or night descriptor based on current system time and month.
   * @returns Season name ("Winter", "Spring", "Summer", "Autumn") or "Night".
   */
  getWeatherEmoji(): string {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();

    if (hour >= 6 && hour < 18) {
      if (month >= 11 || month <= 1) return "Winter";
      if (month >= 2 && month <= 4) return "Spring";
      if (month >= 5 && month <= 7) return "Summer";
      return "Autumn";
    } else {
      return "Night";
    }
  }

  /**
   * Clears the cached location information and resets fetch timestamp.
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.lastFetch = 0;
  }
}
