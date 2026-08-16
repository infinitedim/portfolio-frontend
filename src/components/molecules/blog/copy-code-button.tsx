"use client";

import { useEffect } from "react";

export function CopyCodeButton() {
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>(
      ".prose pre, article pre",
    );

    blocks.forEach((pre) => {
      if (pre.querySelector(".copy-code-btn")) return;

      pre.style.position = "relative";

      const btn = document.createElement("button");
      btn.textContent = "$ copy --clip";
      btn.className =
        "copy-code-btn absolute top-2.5 right-3 bg-(--terminal-bg)/90 border border-(--terminal-border) text-(--terminal-text) hover:text-(--terminal-accent) text-[11px] px-2.5 py-1 rounded font-mono transition-colors select-none cursor-pointer shadow-sm";
      btn.setAttribute("aria-label", "Copy code");

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code?.innerText ?? pre.innerText ?? "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "[ COPIED ]";
          btn.classList.add("text-(--terminal-accent)", "border-(--terminal-accent)/40");
        } catch {
          btn.textContent = "[ ERROR ]";
        } finally {
          setTimeout(() => {
            btn.textContent = "$ copy --clip";
            btn.classList.remove("text-(--terminal-accent)", "border-(--terminal-accent)/40");
          }, 2000);
        }
      });

      pre.appendChild(btn);
    });
  }, []);

  return null;
}
