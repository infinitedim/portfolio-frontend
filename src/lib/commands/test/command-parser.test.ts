import { describe, it, expect } from "vitest";
import {
  CommandParser,
  splitCommandChain,
  splitPipeChain,
} from "../command-parser";
import type { Command, CommandOutput } from "@/types/terminal";

describe("CommandParser", () => {
  it("returns error for empty input", async () => {
    const parser = new CommandParser();
    const res = await parser.parse("");
    expect(res.type).toBe("error");
  });

  it("registers and invokes a command", async () => {
    const parser = new CommandParser();
    const cmd = {
      name: "echo",
      description: "echo",
      async execute(args: string[]) {
        return { type: "success", content: args.join(" ") } as CommandOutput;
      },
    };

    parser.register(cmd as Command);
    const out = await parser.parse("echo hello world");
    expect(out.type).toBe("success");
    expect(out.content).toBe("hello world");
  });

  it("executes chained commands separated by semicolon", async () => {
    const parser = new CommandParser();
    parser.register({
      name: "a",
      description: "a",
      async execute() {
        return { type: "success", content: "A" } as CommandOutput;
      },
    } as Command);
    parser.register({
      name: "b",
      description: "b",
      async execute() {
        return { type: "success", content: "B" } as CommandOutput;
      },
    } as Command);

    const out = await parser.parse("a ; b");
    expect(out.type).toBe("success");
    expect(out.content).toBe("A\n\n---\n\nB");
  });

  it("stops && chain on error", async () => {
    const parser = new CommandParser();
    parser.register({
      name: "fail",
      description: "fail",
      async execute() {
        return { type: "error", content: "nope" } as CommandOutput;
      },
    } as Command);
    parser.register({
      name: "ok",
      description: "ok",
      async execute() {
        return { type: "success", content: "yes" } as CommandOutput;
      },
    } as Command);

    const out = await parser.parse("fail && ok");
    expect(out.type).toBe("error");
  });

  it("pipes output into next command args", async () => {
    const parser = new CommandParser();
    parser.register({
      name: "left",
      description: "left",
      async execute() {
        return { type: "success", content: "piped" } as CommandOutput;
      },
    } as Command);
    parser.register({
      name: "right",
      description: "right",
      async execute(args: string[]) {
        return { type: "success", content: args.join(" ") } as CommandOutput;
      },
    } as Command);

    const out = await parser.parse("left | right");
    expect(out.type).toBe("success");
    expect(out.content).toBe("piped");
  });
});

describe("splitCommandChain", () => {
  it("splits on semicolon and &&", () => {
    expect(splitCommandChain("a ; b && c")).toEqual([
      { command: "a" },
      { command: "b", operator: ";" },
      { command: "c", operator: "&&" },
    ]);
  });
});

describe("splitPipeChain", () => {
  it("splits on pipe", () => {
    expect(splitPipeChain("a | b")).toEqual(["a", "b"]);
  });
});
