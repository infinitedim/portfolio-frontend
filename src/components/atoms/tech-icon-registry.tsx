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
  siTokio,
  siKubernetes,
  type SimpleIcon,
} from "simple-icons";

export type TechIconProps = SVGProps<SVGSVGElement>;

                                                                          
function renderSimpleIcon(icon: SimpleIcon, props: TechIconProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d={icon.path} />
    </svg>
  );
}

   
                                                                          
                                                                                      
                                                                                              
                                                                                      
   
export function DockerIcon(props: TechIconProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path
        d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-0.5"
        style={{ transitionDelay: "270ms" }}
      />
      <path
        d="M11.029 5.648h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185"
        className="transition-all duration-250 ease-out translate-y-0 group-hover/tech:-translate-y-1.5"
        style={{ transitionDelay: "310ms" }}
      />
      <path
        d="M11.029 8.364h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-1"
        style={{ transitionDelay: "240ms" }}
      />
      <path
        d="M8.099 8.364h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-1"
        style={{ transitionDelay: "200ms" }}
      />
      <path
        d="M5.136 8.364h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-1"
        style={{ transitionDelay: "160ms" }}
      />
      <path
        d="M11.029 11.078h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-0.5"
        style={{ transitionDelay: "120ms" }}
      />
      <path
        d="M8.099 11.078h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-0.5"
        style={{ transitionDelay: "80ms" }}
      />
      <path
        d="M5.136 11.078h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-0.5"
        style={{ transitionDelay: "40ms" }}
      />
      <path
        d="M2.216 11.078h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185"
        className="transition-all duration-200 ease-out translate-y-0 group-hover/tech:-translate-y-0.5"
      />
      <path
        d="M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
        className="transition-transform duration-500 ease-in-out group-hover/tech:translate-y-0.5"
      />
    </svg>
  );
}

   
                                                             
                                                                            
   
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
      ? words
          .slice(0, 2)
          .map((word) => word.charAt(0).toUpperCase())
          .join("")
      : cleanName.slice(0, 2).toUpperCase();

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="4"
        strokeWidth="1.5"
        className="fill-neutral-900/40"
      />
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
    color: `#${siReact.hex}`,           
    hoverAnimation:
      "group-hover/tech:rotate-180 group-hover/tech:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  nextjs: {
    label: "Next.js",
    Icon: (props) => renderSimpleIcon(siNextdotjs, props),
    color: "#ffffff",                                   
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "framework",
  },
  typescript: {
    label: "TypeScript",
    Icon: (props) => renderSimpleIcon(siTypescript, props),
    color: `#${siTypescript.hex}`,           
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "language",
  },
  javascript: {
    label: "JavaScript",
    Icon: (props) => renderSimpleIcon(siJavascript, props),
    color: `#${siJavascript.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  rust: {
    label: "Rust",
    Icon: (props) => renderSimpleIcon(siRust, props),
    color: "#f74c00",                                   
    hoverAnimation:
      "group-hover/tech:rotate-180 group-hover/tech:scale-110 transition-transform duration-500 ease-out",
    category: "language",
  },
  prisma: {
    label: "Prisma",
    Icon: (props) => renderSimpleIcon(siPrisma, props),
    color: "#5a67d8",                        
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "tool",
  },
  docker: {
    label: "Docker",
    Icon: DockerIcon,
    color: `#${siDocker.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-105 transition-transform duration-300 ease-out",
    category: "infra",
  },
  postgresql: {
    label: "PostgreSQL",
    Icon: (props) => renderSimpleIcon(siPostgresql, props),
    color: `#${siPostgresql.hex}`,           
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#4169e1] group-hover/tech:scale-105 transition-all duration-300",
    category: "database",
  },
  redis: {
    label: "Redis",
    Icon: (props) => renderSimpleIcon(siRedis, props),
    color: `#${siRedis.hex}`,           
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#ff4438] group-hover/tech:scale-105 transition-all duration-300",
    category: "database",
  },
  tailwindcss: {
    label: "Tailwind CSS",
    Icon: (props) => renderSimpleIcon(siTailwindcss, props),
    color: `#${siTailwindcss.hex}`,           
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "framework",
  },
  nodejs: {
    label: "Node.js",
    Icon: (props) => renderSimpleIcon(siNodedotjs, props),
    color: `#${siNodedotjs.hex}`,           
    hoverAnimation:
      "group-hover/tech:rotate-180 group-hover/tech:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  bun: {
    label: "Bun",
    Icon: (props) => renderSimpleIcon(siBun, props),
    color: "#fbf0df",
    hoverAnimation:
      "group-hover/tech:rotate-180 group-hover/tech:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  python: {
    label: "Python",
    Icon: (props) => renderSimpleIcon(siPython, props),
    color: `#${siPython.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  go: {
    label: "Go",
    Icon: (props) => renderSimpleIcon(siGo, props),
    color: `#${siGo.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  gcp: {
    label: "Google Cloud",
    Icon: (props) => renderSimpleIcon(siGooglecloud, props),
    color: `#${siGooglecloud.hex}`,           
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#4285f4] group-hover/tech:scale-105 transition-all duration-300",
    category: "infra",
  },
  aws: {
    label: "AWS",
    Icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        {...props}
      >
        <path d="M12.98 13.91c-.86.53-1.92.83-3.03.83-2.6 0-4.71-1.63-4.71-3.64 0-2.01 2.11-3.64 4.71-3.64 1.11 0 2.17.3 3.03.83l1.32-1.37C12.93 6.09 11.02 5.5 8.95 5.5 4.84 5.5 1.5 8.01 1.5 11.1c0 3.09 3.34 5.6 7.45 5.6 2.07 0 3.98-.59 5.35-1.42l-1.32-1.37zm8.02-2.81L18.5 8.6l-2.5 2.5 2.5 2.5 2.5-2.5z" />
      </svg>
    ),
    color: "#ff9900",
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#ff9900] group-hover/tech:scale-105 transition-all duration-300",
    category: "infra",
  },
  git: {
    label: "Git",
    Icon: (props) => renderSimpleIcon(siGit, props),
    color: `#${siGit.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  github: {
    label: "GitHub",
    Icon: (props) => renderSimpleIcon(siGithub, props),
    color: "#ffffff",
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  figma: {
    label: "Figma",
    Icon: (props) => renderSimpleIcon(siFigma, props),
    color: `#${siFigma.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  linux: {
    label: "Linux",
    Icon: (props) => renderSimpleIcon(siLinux, props),
    color: `#${siLinux.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  supabase: {
    label: "Supabase",
    Icon: (props) => renderSimpleIcon(siSupabase, props),
    color: `#${siSupabase.hex}`,           
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "database",
  },
  stripe: {
    label: "Stripe",
    Icon: (props) => renderSimpleIcon(siStripe, props),
    color: `#${siStripe.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-105 transition-transform duration-200 ease-out",
    category: "tool",
  },
  graphql: {
    label: "GraphQL",
    Icon: (props) => renderSimpleIcon(siGraphql, props),
    color: `#${siGraphql.hex}`,           
    hoverAnimation:
      "group-hover/tech:rotate-45 group-hover/tech:scale-110 transition-all duration-300 ease-out",
    category: "language",
  },
  html5: {
    label: "HTML5",
    Icon: (props) => renderSimpleIcon(siHtml5, props),
    color: `#${siHtml5.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  css3: {
    label: "CSS3",
    Icon: (props) => renderSimpleIcon(siCss, props),
    color: `#${siCss.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  sass: {
    label: "Sass",
    Icon: (props) => renderSimpleIcon(siSass, props),
    color: `#${siSass.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "language",
  },
  mongodb: {
    label: "MongoDB",
    Icon: (props) => renderSimpleIcon(siMongodb, props),
    color: `#${siMongodb.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-105 transition-transform duration-200 ease-out",
    category: "database",
  },
  express: {
    label: "Express",
    Icon: (props) => renderSimpleIcon(siExpress, props),
    color: "#ffffff",
    hoverAnimation:
      "group-hover/tech:scale-105 transition-transform duration-200 ease-out",
    category: "framework",
  },
  fastapi: {
    label: "FastAPI",
    Icon: (props) => renderSimpleIcon(siFastapi, props),
    color: `#${siFastapi.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-105 transition-transform duration-200 ease-out",
    category: "framework",
  },
  terraform: {
    label: "Terraform",
    Icon: (props) => renderSimpleIcon(siTerraform, props),
    color: `#${siTerraform.hex}`,           
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "infra",
  },
  flutter: {
    label: "Flutter",
    Icon: (props) => renderSimpleIcon(siFlutter, props),
    color: `#${siFlutter.hex}`,           
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "framework",
  },
  prometheus: {
    label: "Prometheus",
    Icon: (props) => renderSimpleIcon(siPrometheus, props),
    color: `#${siPrometheus.hex}`,           
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#e6522c] group-hover/tech:scale-105 transition-all duration-300",
    category: "infra",
  },
  grafana: {
    label: "Grafana",
    Icon: (props) => renderSimpleIcon(siGrafana, props),
    color: `#${siGrafana.hex}`,           
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#f46800] group-hover/tech:scale-105 transition-all duration-300",
    category: "infra",
  },
  radixui: {
    label: "Radix UI",
    Icon: (props) => renderSimpleIcon(siRadixui, props),
    color: "#ffffff",
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "framework",
  },
  framer: {
    label: "Framer Motion",
    Icon: (props) => renderSimpleIcon(siFramer, props),
    color: `#${siFramer.hex}`,           
    hoverAnimation:
      "group-hover/tech:rotate-12 group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "framework",
  },
  pwa: {
    label: "PWA",
    Icon: (props) => renderSimpleIcon(siPwa, props),
    color: `#${siPwa.hex}`,           
    hoverAnimation:
      "group-hover/tech:-translate-y-0.5 group-hover/tech:scale-105 transition-all duration-200 ease-out",
    category: "tool",
  },
  githubactions: {
    label: "GitHub Actions",
    Icon: (props) => renderSimpleIcon(siGithub, props),
    color: "#ffffff",
    hoverAnimation:
      "group-hover/tech:scale-110 transition-transform duration-200 ease-out",
    category: "tool",
  },
  axum: {
    label: "Axum",
    Icon: (props) => renderSimpleIcon(siRust, props),
    color: "#f74c00",
    hoverAnimation:
      "group-hover/tech:rotate-180 group-hover/tech:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  tokio: {
    label: "Tokio",
    Icon: (props) => renderSimpleIcon(siTokio, props),
    color: "#ffffff",
    hoverAnimation:
      "group-hover/tech:rotate-180 group-hover/tech:scale-110 transition-transform duration-500 ease-out",
    category: "framework",
  },
  loki: {
    label: "Loki",
    Icon: (props) => renderSimpleIcon(siGrafana, props),
    color: `#${siGrafana.hex}`,           
    hoverAnimation:
      "group-hover/tech:drop-shadow-[0_0_8px_#f46800] group-hover/tech:scale-105 transition-all duration-300",
    category: "infra",
  },
  kubernetes: {
    label: "Kubernetes",
    Icon: (props) => renderSimpleIcon(siKubernetes, props),
    color: `#${siKubernetes.hex}`,           
    hoverAnimation:
      "group-hover/tech:rotate-45 group-hover/tech:scale-110 transition-all duration-300 ease-out",
    category: "infra",
  },
  sqlx: {
    label: "SQLx",
    Icon: (props) => renderSimpleIcon(siPostgresql, props),
    color: "#4169e1",
    hoverAnimation:
      "group-hover/tech:text-emerald-400 group-hover/tech:border-emerald-500/50 transition-colors duration-200",
    category: "database",
  },
};

                                                                               
                                                                       
                                                                               

export function normalizeTechKey(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[\s.\-_/&]+/g, "");

                              
  if (cleaned.includes("tokio")) return "tokio";
  if (cleaned.includes("loki")) return "loki";
  if (cleaned.includes("kubernetes") || cleaned === "k8s") return "kubernetes";
  if (cleaned.includes("rust") || cleaned.includes("axum")) return "rust";
  if (
    cleaned.includes("cloudrun") ||
    cleaned.includes("gcp") ||
    cleaned.includes("googlecloud")
  )
    return "gcp";
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

                                                                 
  return {
    label: name,
    Icon: (props: TechIconProps) => (
      <MonogramFallbackIcon
        name={name}
        {...props}
      />
    ),
    color: "#10b981",
    hoverAnimation: "group-hover/tech:scale-105 transition-transform duration-200",
    category: "tool",
  };
}

   
                                                                       
   
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
