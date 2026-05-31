import Link from "next/link";
import type { JSX } from "react";

export default function S3cr3tIndexPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 font-mono text-sm text-neutral-300">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-lg font-bold text-green-400">Index of /s3cr3t</h1>

        <div className="mt-4 overflow-x-auto rounded border border-neutral-800 bg-black/40">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500">
                <th className="px-4 py-2 font-normal">Name</th>
                <th className="px-4 py-2 font-normal">Last modified</th>
                <th className="px-4 py-2 font-normal">Size</th>
                <th className="hidden px-4 py-2 font-normal sm:table-cell">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-800/80">
                <td className="px-4 py-2">
                  <Link
                    href="/"
                    className="text-green-400 underline decoration-green-400/40 underline-offset-2 hover:text-green-300"
                  >
                    Parent Directory
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-500">-</td>
                <td className="px-4 py-2 text-neutral-500">-</td>
                <td className="hidden px-4 py-2 sm:table-cell" />
              </tr>
              <tr>
                <td className="px-4 py-2">
                  <Link
                    href="/s3cr3t/users.txt"
                    className="text-green-400 underline decoration-green-400/40 underline-offset-2 hover:text-green-300"
                  >
                    users.txt
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-500">2026-05-30 12:00</td>
                <td className="px-4 py-2 text-neutral-500">-</td>
                <td className="hidden px-4 py-2 sm:table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
