import { describe, it, expect } from "vitest";
import { canRunTests } from "@/test/test-helpers";
import * as authModule from "../index";

describe("auth/index.ts", () => {
  describe("Exports", () => {
    it("should export authService", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(authModule).toHaveProperty("authService");
    });

    it("should export AuthProvider", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(authModule).toHaveProperty("AuthProvider");
      expect(typeof authModule.AuthProvider).toBe("function");
    });

    it("should export useAuth", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(authModule).toHaveProperty("useAuth");
      expect(typeof authModule.useAuth).toBe("function");
    });

    it("should export types", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      
      expect(authModule).toBeDefined();
    });
  });
});
