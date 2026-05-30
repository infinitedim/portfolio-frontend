"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
} from "@codesandbox/sandpack-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api/get-api-url";

const DEFAULT_CODE = `export default function App() {
  return (
    <div style={{ fontFamily: "monospace", padding: 16 }}>
      <h1>Hello Playground</h1>
      <p>Edit this code and see live preview.</p>
    </div>
  );
}`;

interface SnippetResponse {
  id: string;
  title: string;
  language: string;
  code: string;
}

function mapLanguage(lang: string): "react" | "vanilla" | "vue" | "angular" {
  const normalized = lang.toLowerCase();
  if (normalized.includes("react") || normalized === "jsx") return "react";
  if (normalized.includes("vue")) return "vue";
  if (normalized.includes("angular")) return "angular";
  return "vanilla";
}

function PlaygroundInner() {
  const searchParams = useSearchParams();
  const snippetId = searchParams.get("id") ?? undefined;
  const [title, setTitle] = useState("Live Demo");
  const [language, setLanguage] = useState<
    "react" | "vanilla" | "vue" | "angular"
  >("react");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [loading, setLoading] = useState(!!snippetId);

  useEffect(() => {
    if (!snippetId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${getApiUrl()}/api/playground/snippets/${snippetId}`,
        );
        if (response.ok) {
          const data = (await response.json()) as SnippetResponse;
          setTitle(data.title);
          setCode(data.code);
          setLanguage(mapLanguage(data.language));
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [snippetId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400">Loading snippet…</div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6">
        <Link
          href="/"
          className="text-green-400 transition-colors hover:text-green-300"
        >
          ← Home
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-green-400">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Live coding playground powered by Sandpack
        </p>
      </header>

      <SandpackProvider
        template={language}
        files={{ "/App.js": code }}
        theme="dark"
      >
        <SandpackLayout>
          <SandpackCodeEditor showTabs />
          <SandpackPreview showNavigator />
        </SandpackLayout>
        <div className="mt-2">
          <SandpackConsole />
        </div>
      </SandpackProvider>
    </div>
  );
}

export function SandpackPlayground() {
  return (
    <Suspense
      fallback={<div className="py-16 text-center text-gray-400">Loading…</div>}
    >
      <PlaygroundInner />
    </Suspense>
  );
}
