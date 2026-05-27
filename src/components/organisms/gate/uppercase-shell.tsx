"use client";

import { useState, type FormEvent, type JSX } from "react";
import { GateLevel } from "./gate-level";

type ShellState = "locked" | "escaped" | "password_visible";

const FAKE_COMMANDS: Record<string, string> = {
  ls: "BIN  DEV  ETC  HOME  LIB  TMP  USR  VAR",
  whoami: "BANDIT32",
  "man sh": "NO MANUAL ENTRY FOR SH",
};

export function UppercaseShell({
  onPassed,
}: {
  onPassed: (nextLevel?: number) => void;
}): JSX.Element {
  const [shellState, setShellState] = useState<ShellState>("locked");
  const [lines, setLines] = useState<string[]>([
    "Bandit Level 32 → Level 33",
    "Everything runs in UPPERCASE until you escape the shell.",
    "Type commands below. Hint: $0 is your friend.",
  ]);
  const [input, setInput] = useState("");

  const appendLine = (line: string) => {
    setLines((prev) => [...prev, line]);
  };

  const handleCommand = (e: FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    appendLine(`$ ${cmd}`);

    if (shellState === "locked") {
      if (cmd === "$0") {
        appendLine("Escaping uppercase shell...");
        setShellState("escaped");
      } else if (cmd.toLowerCase() !== cmd) {
        appendLine(FAKE_COMMANDS[cmd] ?? `COMMAND NOT FOUND: ${cmd.toUpperCase()}`);
      } else {
        appendLine("ERROR: THIS SHELL ONLY ACCEPTS UPPERCASE COMMANDS");
      }
    } else {
      const lower = cmd.toLowerCase();
      if (lower === "cat /etc/bandit_pass/bandit33") {
        appendLine(
          "[classified] Password obtained — submit it in the form below.",
        );
        setShellState("password_visible");
      } else if (lower === "ls") {
        appendLine("bin  etc  home  tmp  var");
      } else if (lower === "whoami") {
        appendLine("bandit33");
      } else {
        appendLine(`bash: ${cmd}: command not found`);
      }
    }

    setInput("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded border border-neutral-800 bg-black p-4 font-mono text-xs text-green-400">
        <div className="mb-2 text-neutral-500">bandit32@bandit:~$</div>
        <div className="max-h-48 space-y-1 overflow-y-auto text-neutral-300">
          {lines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 20)}`}>{line}</div>
          ))}
        </div>
        <form
          onSubmit={handleCommand}
          className="mt-3 flex gap-2"
        >
          <span className="text-neutral-500">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>

      {shellState === "password_visible" && (
        <GateLevel
          level={1}
          onPassed={onPassed}
        />
      )}
    </div>
  );
}
