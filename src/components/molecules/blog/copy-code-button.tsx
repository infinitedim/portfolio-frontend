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
      btn.textContent = "Copy";
      btn.className =
        "copy-code-btn absolute top-2 right-2 bg-gray-700/80 hover:bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded transition-colors select-none";
      btn.setAttribute("aria-label", "Copy code");

      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code?.innerText ?? pre.innerText ?? "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied!";
          btn.classList.add("text-green-400");
        } catch {
          btn.textContent = "Failed";
        } finally {
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("text-green-400");
          }, 2000);
        }
      });

      pre.appendChild(btn);
    });
  }, []);

  return null;
}
