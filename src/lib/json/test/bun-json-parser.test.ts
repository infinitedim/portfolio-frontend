import { describe, it, expect } from "bun:test";
import { safeParseJson, parseJsonLines } from "../bun-json-parser";

describe("bun-json-parser", () => {
  it("should parse standard JSON string cleanly", () => {
    const res = safeParseJson<{ name: string; age: number }>('{"name":"Antigravity","age":1}');
    expect(res.data.name).toBe("Antigravity");
    expect(res.data.age).toBe(1);
    expect(["bun-json", "native-json"]).toContain(res.engineUsed);
  });

  it("should parse multi-line JSONL strings into an array of objects", () => {
    const jsonl = '{"id":1}\n{"id":2}\n{"id":3}';
    const res = parseJsonLines<{ id: number }>(jsonl);
    expect(res.data.length).toBe(3);
    expect(res.data[0].id).toBe(1);
    expect(res.data[2].id).toBe(3);
  });
});
