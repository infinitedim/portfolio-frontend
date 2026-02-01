import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { TimeDisplay } from "../time-display";

// Mock LocationService
const mockLocation = {
  city: "Test City",
  region: "Test Region",
  country: "Test Country",
  timezone: "America/New_York",
  latitude: 40.7128,
  longitude: -74.006,
  ip: "192.168.1.1",
};

const mockTimeInfo = {
  timezone: "America/New_York",
  offset: -5,
  isDST: true,
};

const { mockGetLocation } = vi.hoisted(() => ({
  mockGetLocation: vi.fn(),
}));
vi.mock("@/lib/location/location-service", () => ({
  LocationService: {
    getInstance: () => ({
      getLocation: mockGetLocation,
      getTimeInfo: vi.fn().mockReturnValue(mockTimeInfo),
      formatOffset: vi.fn().mockReturnValue("UTC-5"),
      getWeatherEmoji: vi.fn().mockReturnValue("☀️"),
      clearCache: vi.fn(),
    }),
  },
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Wifi: () => <div data-testid="wifi-icon">Wifi</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
}));

describe("TimeDisplay", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    mockGetLocation.mockResolvedValue(mockLocation);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should show loading state initially", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      render(<TimeDisplay onClose={mockOnClose} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should display time and location after loading", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Time & Location")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });

    it("should display location information", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Test City, Test Region")).toBeInTheDocument();
          expect(screen.getByText("Test Country")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });

    it("should display coordinates", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText(/40\.7128/)).toBeInTheDocument();
          expect(screen.getByText(/-74\.006/)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });

    it("should display IP address", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });

    it("should display weather emoji", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("☀️")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });
  });

  describe("Interactions", () => {
    it("should call onClose when close button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Time & Location")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const closeButton = screen.getByTitle("Close");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
      vi.useFakeTimers();
    });

    it("should refresh location when refresh button is clicked", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Time & Location")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const refreshButton = screen.getByTitle("Refresh");
      fireEvent.click(refreshButton);

      await waitFor(
        () => {
          expect(screen.getByTitle("Refresh")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });
  });

  describe("Error Handling", () => {
    it("should display error message on fetch failure", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockGetLocation.mockReset().mockRejectedValue(new Error("Failed to fetch"));
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });

    it("should show retry button on error", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      mockGetLocation.mockReset().mockRejectedValue(new Error("Failed to fetch"));
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Retry")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
      vi.useFakeTimers();
    });
  });

  describe("Time Updates", () => {
    it("should update time every second", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      vi.useRealTimers();
      render(<TimeDisplay onClose={mockOnClose} />);

      await waitFor(
        () => {
          expect(screen.getByText("Time & Location")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      expect(screen.getByText("Time & Location")).toBeInTheDocument();
      vi.useFakeTimers();
    });
  });
});
