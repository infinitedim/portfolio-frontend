import type { Command, CommandOutput } from "@/types/terminal";
import { ArgumentParser } from "@/lib/utils/arg-parser";
import { generateId } from "@/lib/utils/utils";

export const resumeCommand: Command = {
  name: "resume",
  description: "View or download resume",
  aliases: ["cv"],
  async execute(args: string[]): Promise<CommandOutput> {
    const parsed = ArgumentParser.parseArgv(args);

    if (ArgumentParser.hasFlag(parsed, "h", "help")) {
      return {
        type: "info",
        content: `Resume Command Help

Usage: resume [options]

Options:
  -v, --view      View resume in terminal format
  -d, --download  Download resume as PDF
  -h, --help      Show this help

Examples:
  resume          - View resume in terminal
  resume --view   - View resume in terminal
  resume -d       - Download PDF resume`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (ArgumentParser.hasFlag(parsed, "d", "download")) {
      if (typeof window !== "undefined") {
        const link = document.createElement("a");
        link.href = "/api/resume/download";
        link.download = "Dimas_Saputra_Resume.pdf";
        link.click();
      }

      return {
        type: "success",
        content: "Resume download started! Check your downloads folder.",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const resumeContent = [
      "RESUME",
      "═".repeat(60),
      "",
      "PERSONAL INFORMATION",
      "   Name: Full-Stack Developer",
      "   Email: developer@portfolio.com",
      "   Location: Global Remote",
      "   Portfolio: https://infinitedim.dev",
      "",
      "PROFESSIONAL SUMMARY",
      "   Passionate full-stack developer with expertise in modern web",
      "   technologies. Specialized in React, Next.js, TypeScript, and",
      "   Node.js. Strong focus on performance, accessibility, and UX.",
      "",
      "EXPERIENCE",
      "   Full-Stack Developer (2023 - Present)",
      "   • Developed scalable web applications using React & Next.js",
      "   • Built robust APIs with Rust, Axum, and PostgreSQL (SQLx)",
      "   • Implemented CI/CD pipelines and cloud deployments",
      "   • Optimized applications for performance and accessibility",
      "",
      "TECHNICAL SKILLS",
      "   Frontend: React, Next.js, TypeScript, Tailwind CSS",
      "   Backend:  Rust, Axum, PostgreSQL, SQLx",
      "   DevOps:   Docker, AWS, Vercel, CI/CD",
      "   Tools:    Git, Webpack, Vite, ESLint, Prettier",
      "",
      "EDUCATION & CERTIFICATIONS",
      "   • Computer Science Degree",
      "   • AWS Certified Developer",
      "   • React Advanced Patterns Certification",
      "",
      "FEATURED PROJECTS",
      "   Terminal Portfolio - Interactive developer portfolio",
      "   E-Commerce Platform - Full-stack online store",
      "   Task Management App - Collaborative project tool",
      "",
      "Use 'resume --download' to get PDF version",
    ].join("\n");

    return {
      type: "success",
      content: resumeContent,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

