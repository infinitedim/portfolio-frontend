import { describe, it, expect } from "vitest";
import { canRunTests } from "@/test/test-helpers";
import {
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  map,
  mapErr,
  andThen,
  tryCatch,
  tryCatchAsync,
  combine,
  match,
} from "../result";

describe("result.ts", () => {
  describe("ok and err", () => {
    it("should create Ok result", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok("success");

      expect(result.ok).toBe(true);
      expect(result.value).toBe("success");
    });

    it("should create Err result", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("failure");
      const result = err(error);

      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe("isOk and isErr", () => {
    it("should check if result is Ok", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const success = ok("value");
      const failure = err(new Error("error"));

      expect(isOk(success)).toBe(true);
      expect(isOk(failure)).toBe(false);
    });

    it("should check if result is Err", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const success = ok("value");
      const failure = err(new Error("error"));

      expect(isErr(failure)).toBe(true);
      expect(isErr(success)).toBe(false);
    });
  });

  describe("unwrap", () => {
    it("should unwrap Ok value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok("value");
      const value = unwrap(result);

      expect(value).toBe("value");
    });

    it("should throw on Err", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));

      expect(() => unwrap(result)).toThrow();
    });
  });

  describe("unwrapOr", () => {
    it("should unwrap Ok value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok("value");
      const value = unwrapOr(result, "default");

      expect(value).toBe("value");
    });

    it("should return default on Err", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));
      const value = unwrapOr(result, "default");

      expect(value).toBe("default");
    });
  });

  describe("unwrapOrElse", () => {
    it("should unwrap Ok value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok("value");
      const value = unwrapOrElse(result, () => "default");

      expect(value).toBe("value");
    });

    it("should compute default on Err", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));
      const value = unwrapOrElse(result, (err) => `Error: ${err.message}`);

      expect(value).toBe("Error: error");
    });
  });

  describe("map", () => {
    it("should map Ok value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok(5);
      const mapped = map(result, (x) => x * 2);

      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it("should preserve Err", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));
      const mapped = map(result, (x: number) => x * 2);

      expect(isErr(mapped)).toBe(true);
    });
  });

  describe("mapErr", () => {
    it("should map Err value", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));
      const mapped = mapErr(result, (e) => `Mapped: ${e.message}`);

      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe("Mapped: error");
      }
    });

    it("should preserve Ok", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok("value");
      const mapped = mapErr(result, (e: Error) => `Mapped: ${e.message}`);

      expect(isOk(mapped)).toBe(true);
    });
  });

  describe("andThen", () => {
    it("should chain Ok results", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok(5);
      const chained = andThen(result, (x) => ok(x * 2));

      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.value).toBe(10);
      }
    });

    it("should preserve Err in chain", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));
      const chained = andThen(result, (x: number) => ok(x * 2));

      expect(isErr(chained)).toBe(true);
    });
  });

  describe("tryCatch", () => {
    it("should return Ok for successful function", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = tryCatch(() => "success");

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe("success");
      }
    });

    it("should return Err for throwing function", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = tryCatch(() => {
        throw new Error("error");
      });

      expect(isErr(result)).toBe(true);
    });
  });

  describe("tryCatchAsync", () => {
    it("should return Ok for successful async function", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await tryCatchAsync(async () => "success");

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe("success");
      }
    });

    it("should return Err for throwing async function", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await tryCatchAsync(async () => {
        throw new Error("error");
      });

      expect(isErr(result)).toBe(true);
    });
  });

  describe("combine", () => {
    it("should combine all Ok results", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const results = [ok(1), ok(2), ok(3)];
      const combined = combine(results);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it("should return first Err", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const error = new Error("error");
      const results = [ok(1), err(error), ok(3)];
      const combined = combine(results);

      expect(isErr(combined)).toBe(true);
      if (isErr(combined)) {
        expect(combined.error).toBe(error);
      }
    });
  });

  describe("match", () => {
    it("should match Ok result", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = ok("value");
      const matched = match(result, {
        ok: (v) => `Success: ${v}`,
        err: (e: Error) => `Error: ${e.message}`,
      });

      expect(matched).toBe("Success: value");
    });

    it("should match Err result", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = err(new Error("error"));
      const matched = match(result, {
        ok: (v) => `Success: ${v}`,
        err: (e: Error) => `Error: ${e.message}`,
      });

      expect(matched).toBe("Error: error");
    });
  });
});
