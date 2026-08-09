import { type JSX, type SVGProps } from "react";
import {
  siReact,
  siNextdotjs,
  siTypescript,
  siJavascript,
  siRust,
  siPrisma,
  siDocker,
  siPostgresql,
  siRedis,
  siTailwindcss,
  siNodedotjs,
  siBun,
  siPython,
  siGo,
  siGooglecloud,
  siGit,
  siGithub,
  siFigma,
  siLinux,
  siSupabase,
  siStripe,
  siGraphql,
  siHtml5,
  siCss,
  siSass,
  siMongodb,
  siExpress,
  siFastapi,
  siTerraform,
  siFlutter,
  siPrometheus,
  siGrafana,
  siRadixui,
  siFramer,
  siPwa,
  type SimpleIcon,
} from "simple-icons";

export type TechIconProps = SVGProps<SVGSVGElement>;

// Helper to render any SimpleIcon object with pixel-perfect 24x24 viewBox
function renderSimpleIcon(icon: SimpleIcon, props: TechIconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <path d={icon.path} />
    </svg>
  );
}

/**
 * Custom Docker Icon with Isolated SVG Groups for Micro-Animation:
 * - Top group (<g>): Cargo Containers with Lift Animation (`group-hover:-translate-y-0.5`)
 * - Bottom group (<g>): Moby Dock Whale with Gentle Water Bobbing (`group-hover:translate-y-0.5`)
 */
export function DockerIcon(props: TechIconProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      {/* 📦 CARGO CONTAINERS GROUP: Lifts up on hover */}
      <g className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
        <rect x="2.5" y="10.5" width="2" height="2" rx="0.3" />
        <rect x="5.2" y="10.5" width="2" height="2" rx="0.3" />
        <rect x="7.9" y="10.5" width="2" height="2" rx="0.3" />
        <rect x="10.6" y="10.5" width="2" height="2" rx="0.3" />
        <rect x="5.2" y="7.8" width="2" height="2" rx="0.3" />
        <rect x="7.9" y="7.8" width="2" height="2" rx="0.3" />
        <rect x="10.6" y="7.8" width="2" height="2" rx="0.3" />
        <rect x="7.9" y="5.1" width="2" height="2" rx="0.3" />
      </g>

      {/* 🐋 MOBY DOCK WHALE GROUP: Water bobbing on hover */}
      <g className="transition-transform duration-500 ease-in-out group-hover:translate-y-0.5">
        <path d="M13.982 13.987c-.633 0-1.282.164-1.84.49-.49.286-.884.707-1.127 1.21-.186.386-.277.818-.266 1.25.02.82.37 1.58.98 2.12.63.55 1.45.85 2.29.83.69-.02 1.36-.26 1.91-.68.59-.45.98-1.1 1.09-1.84.11-.74-.06-1.49-.48-2.11-.45-.66-1.16-1.11-1.96-1.25-.2-.03-.4-.04-.6-.02zm8.818 1.413c-.26-.14-.56-.2-.86-.17a1.44 1.44 0 0 0-1.13.79c-.19.37-.23.8-.12 1.2.12.4.38.74.74.96.34.21.75.28 1.14.18a1.44 1.44 0 0 0 1.01-.98c.11-.4.04-.83-.18-1.18a1.48 1.48 0 0 0-.6-.8zm-9.3 6.6c-4.4 0-8.2-2.1-10.4-5.3-.2-.3-.1-.7.2-.9l.7-.5c.3-.2.7-.1.9.2 1.8 2.6 4.9 4.3 8.6 4.3 5.4 0 9.8-3.7 10.7-8.7.1-.4.4-.7.8-.7h.9c.5 0 .9.5.8 1-.9 6.2-6.1 10.6-13.2 10.6z" />
      </g>
    </svg>
  );
}

/**
 * Pure SVG Monogram Badge Fallback for unknown technologies.
 * Renders a crisp 16x16 vector box containing 2 uppercase monogram letters.
 */
export function MonogramFallbackIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}): JSX.Element {
  const cleanName = name.trim();
  const words = cleanName.split(/[\s.\-_/]+/);
  const initials =
    words.length >= 2
      ? words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("")
      : cleanName.slice(0, 2).toUpperCase();

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="4" strokeWidth="1.5" className="fill-neutral-900/40" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="currentColor"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
        stroke="none"
      >
        {initials || "??"}
      </text>
    </svg>
  );
}

// ============================================================================
// REGISTRY CONFIGURATION & DICTIONARY MAPPING (100% Official Simple Icons)
// ============================================================================

export interface TechIconMeta {
  readonly label: string;
  readonly Icon: (props: TechIconProps) => JSX.Element;
  readonly color: string;
  readonly hoverAnimation: string;
  readonly category: "language" | "framework" | "database" | "infra" | "tool";
}

const TECH_REGISTRY: Record<string, TechIconMeta> = {
  react: {
    label: "React",
    Icon: (props) => renderSimpleIcon(siReact, props),
    color: `#${siReact.hex}`, // #61DAFB
    hoverAnimation: "group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  nextjs: {
    label: "Next.js",
    Icon: (props) => renderSimpleIcon(siNextdotjs, props),
    color: "#ffffff", // white for dark mode readability
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "framework",
  },
  typescript: {
    label: "TypeScript",
    Icon: (props) => renderSimpleIcon(siTypescript, props),
    color: `#${siTypescript.hex}`, // #3178C6
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "language",
  },
  javascript: {
    label: "JavaScript",
    Icon: (props) => renderSimpleIcon(siJavascript, props),
    color: `#${siJavascript.hex}`, // #F7DF1E
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  rust: {
    label: "Rust",
    Icon: (props) => renderSimpleIcon(siRust, props),
    color: "#f74c00", // Rust orange accent for contrast
    hoverAnimation: "group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 ease-out",
    category: "language",
  },
  prisma: {
    label: "Prisma",
    Icon: (props) => renderSimpleIcon(siPrisma, props),
    color: "#5a67d8", // Prisma indigo accent
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "tool",
  },
  docker: {
    label: "Docker",
    Icon: DockerIcon,
    color: `#${siDocker.hex}`, // #2496ED
    hoverAnimation: "group-hover:scale-105 transition-transform duration-300 ease-out",
    category: "infra",
  },
  postgresql: {
    label: "PostgreSQL",
    Icon: (props) => renderSimpleIcon(siPostgresql, props),
    color: `#${siPostgresql.hex}`, // #4169E1
    hoverAnimation: "group-hover:drop-shadow-[0_0_8px_#4169e1] group-hover:scale-105 transition-all duration-300",
    category: "database",
  },
  redis: {
    label: "Redis",
    Icon: (props) => renderSimpleIcon(siRedis, props),
    color: `#${siRedis.hex}`, // #FF4438
    hoverAnimation: "group-hover:drop-shadow-[0_0_8px_#ff4438] group-hover:scale-105 transition-all duration-300",
    category: "database",
  },
  tailwindcss: {
    label: "Tailwind CSS",
    Icon: (props) => renderSimpleIcon(siTailwindcss, props),
    color: `#${siTailwindcss.hex}`, // #06B6D4
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "framework",
  },
  nodejs: {
    label: "Node.js",
    Icon: (props) => renderSimpleIcon(siNodedotjs, props),
    color: `#${siNodedotjs.hex}`, // #5FA04E
    hoverAnimation: "group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  bun: {
    label: "Bun",
    Icon: (props) => renderSimpleIcon(siBun, props),
    color: "#fbf0df",
    hoverAnimation: "group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  python: {
    label: "Python",
    Icon: (props) => renderSimpleIcon(siPython, props),
    color: `#${siPython.hex}`, // #3776AB
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  go: {
    label: "Go",
    Icon: (props) => renderSimpleIcon(siGo, props),
    color: `#${siGo.hex}`, // #00ADD8
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  gcp: {
    label: "Google Cloud",
    Icon: (props) => renderSimpleIcon(siGooglecloud, props),
    color: `#${siGooglecloud.hex}`, // #4285F4
    hoverAnimation: "group-hover:drop-shadow-[0_0_8px_#4285f4] group-hover:scale-105 transition-all duration-300",
    category: "infra",
  },
  aws: {
    label: "AWS",
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
        <path d="M12.98 13.91c-.86.53-1.92.83-3.03.83-2.6 0-4.71-1.63-4.71-3.64 0-2.01 2.11-3.64 4.71-3.64 1.11 0 2.17.3 3.03.83l1.32-1.37C12.93 6.09 11.02 5.5 8.95 5.5 4.84 5.5 1.5 8.01 1.5 11.1c0 3.09 3.34 5.6 7.45 5.6 2.07 0 3.98-.59 5.35-1.42l-1.32-1.37zm8.02-2.81L18.5 8.6l-2.5 2.5 2.5 2.5 2.5-2.5z" />
      </svg>
    ),
    color: "#ff9900",
    hoverAnimation: "group-hover:drop-shadow-[0_0_8px_#ff9900] group-hover:scale-105 transition-all duration-300",
    category: "infra",
  },
  git: {
    label: "Git",
    Icon: (props) => renderSimpleIcon(siGit, props),
    color: `#${siGit.hex}`, // #F05032
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  github: {
    label: "GitHub",
    Icon: (props) => renderSimpleIcon(siGithub, props),
    color: "#ffffff",
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  figma: {
    label: "Figma",
    Icon: (props) => renderSimpleIcon(siFigma, props),
    color: `#${siFigma.hex}`, // #F24E1E
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  linux: {
    label: "Linux",
    Icon: (props) => renderSimpleIcon(siLinux, props),
    color: `#${siLinux.hex}`, // #FCC624
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  supabase: {
    label: "Supabase",
    Icon: (props) => renderSimpleIcon(siSupabase, props),
    color: `#${siSupabase.hex}`, // #3ECF8E
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "database",
  },
  stripe: {
    label: "Stripe",
    Icon: (props) => renderSimpleIcon(siStripe, props),
    color: `#${siStripe.hex}`, // #635BFF
    hoverAnimation: "group-hover:scale-105 transition-transform duration-200 ease-out",
    category: "tool",
  },
  graphql: {
    label: "GraphQL",
    Icon: (props) => renderSimpleIcon(siGraphql, props),
    color: `#${siGraphql.hex}`, // #E10098
    hoverAnimation: "group-hover:rotate-45 group-hover:scale-110 transition-all duration-300 ease-out",
    category: "language",
  },
  html5: {
    label: "HTML5",
    Icon: (props) => renderSimpleIcon(siHtml5, props),
    color: `#${siHtml5.hex}`, // #E34F26
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  css3: {
    label: "CSS3",
    Icon: (props) => renderSimpleIcon(siCss, props),
    color: `#${siCss.hex}`, // #1572B6
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  sass: {
    label: "Sass",
    Icon: (props) => renderSimpleIcon(siSass, props),
    color: `#${siSass.hex}`, // #CC6699
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  mongodb: {
    label: "MongoDB",
    Icon: (props) => renderSimpleIcon(siMongodb, props),
    color: `#${siMongodb.hex}`, // #47A248
    hoverAnimation: "group-hover:scale-105 transition-transform duration-200 ease-out",
    category: "database",
  },
  express: {
    label: "Express",
    Icon: (props) => renderSimpleIcon(siExpress, props),
    color: "#ffffff",
    hoverAnimation: "group-hover:scale-105 transition-transform duration-200 ease-out",
    category: "framework",
  },
  fastapi: {
    label: "FastAPI",
    Icon: (props) => renderSimpleIcon(siFastapi, props),
    color: `#${siFastapi.hex}`, // #009688
    hoverAnimation: "group-hover:scale-105 transition-transform duration-200 ease-out",
    category: "framework",
  },
  terraform: {
    label: "Terraform",
    Icon: (props) => renderSimpleIcon(siTerraform, props),
    color: `#${siTerraform.hex}`, // #844FBA
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "infra",
  },
  flutter: {
    label: "Flutter",
    Icon: (props) => renderSimpleIcon(siFlutter, props),
    color: `#${siFlutter.hex}`, // #02569B
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "framework",
  },
  prometheus: {
    label: "Prometheus",
    Icon: (props) => renderSimpleIcon(siPrometheus, props),
    color: `#${siPrometheus.hex}`, // #E6522C
    hoverAnimation: "group-hover:drop-shadow-[0_0_8px_#e6522c] group-hover:scale-105 transition-all duration-300",
    category: "infra",
  },
  grafana: {
    label: "Grafana",
    Icon: (props) => renderSimpleIcon(siGrafana, props),
    color: `#${siGrafana.hex}`, // #F46800
    hoverAnimation: "group-hover:drop-shadow-[0_0_8px_#f46800] group-hover:scale-105 transition-all duration-300",
    category: "infra",
  },
  radixui: {
    label: "Radix UI",
    Icon: (props) => renderSimpleIcon(siRadixui, props),
    color: "#ffffff",
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "framework",
  },
  framer: {
    label: "Framer Motion",
    Icon: (props) => renderSimpleIcon(siFramer, props),
    color: `#${siFramer.hex}`, // #0055FF
    hoverAnimation: "group-hover:rotate-12 group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "framework",
  },
  pwa: {
    label: "PWA",
    Icon: (props) => renderSimpleIcon(siPwa, props),
    color: `#${siPwa.hex}`, // #5A0FC8
    hoverAnimation: "group-hover:-translate-y-0.5 group-hover:scale-105 transition-all duration-200 ease-out",
    category: "tool",
  },
  githubactions: {
    label: "GitHub Actions",
    Icon: (props) => renderSimpleIcon(siGithub, props),
    color: "#ffffff",
    hoverAnimation: "group-hover:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  axum: {
    label: "Axum",
    Icon: (props) => renderSimpleIcon(siRust, props),
    color: "#f74c00",
    hoverAnimation: "group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  tokio: {
    label: "Tokio",
    Icon: (props) => renderSimpleIcon(siRust, props),
    color: "#f74c00",
    hoverAnimation: "group-hover:rotate-180 group-hover:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  sqlx: {
    label: "SQLx",
    Icon: (props) => renderSimpleIcon(siPostgresql, props),
    color: "#4169e1",
    hoverAnimation: "group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors duration-200",
    category: "database",
  },
};

// ============================================================================
// KEY NORMALIZATION & LOOKUP FUNCTION (Handles Compound & Alias Names)
// ============================================================================

export function normalizeTechKey(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[\s.\-_/&]+/g, "");

  // Compound / Alias Matching
  if (cleaned.includes("rust") || cleaned.includes("axum")) return "rust";
  if (cleaned.includes("cloudrun") || cleaned.includes("gcp") || cleaned.includes("googlecloud")) return "gcp";
  if (cleaned.includes("githubaction")) return "githubactions";
  if (cleaned.includes("prometheus")) return "prometheus";
  if (cleaned.includes("grafana")) return "grafana";
  if (cleaned.includes("radix")) return "radixui";
  if (cleaned.includes("framer")) return "framer";
  if (cleaned === "pwa" || cleaned.includes("progressiveweb")) return "pwa";

  return cleaned
    .replace(/js$/, "js")
    .replace(/^postgres$/, "postgresql")
    .replace(/^tailwind$/, "tailwindcss")
    .replace(/^ts$/, "typescript")
    .replace(/^js$/, "javascript");
}

export function getTechConfig(name: string): TechIconMeta {
  const normalizedKey = normalizeTechKey(name);
  const matched = TECH_REGISTRY[normalizedKey];

  if (matched) {
    return matched;
  }

  // Fallback config for unknown technologies using Monogram Icon
  return {
    label: name,
    Icon: (props: TechIconProps) => <MonogramFallbackIcon name={name} {...props} />,
    color: "#10b981",
    hoverAnimation: "group-hover:scale-105 transition-transform duration-200",
    category: "tool",
  };
}

/**
 * List of popular preset technologies for Quick Pick Chips in Admin UI
 */
export const POPULAR_TECH_PRESETS: string[] = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Rust",
  "Prisma",
  "Axum",
  "PostgreSQL",
  "Redis",
  "Tailwind CSS",
  "Node.js",
  "Bun",
  "Python",
  "Go",
  "GCP",
  "Terraform",
  "Flutter",
  "Prometheus",
  "Grafana",
  "GitHub Actions",
  "Radix UI",
  "Framer Motion",
  "PWA",
  "AWS",
  "Git",
  "GitHub",
  "Figma",
  "Linux",
  "Supabase",
  "Stripe",
];
