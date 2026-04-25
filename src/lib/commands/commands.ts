import type { Command, CommandOutput } from "@/types/terminal";
import { ArgumentParser } from "@/lib/utils/arg-parser";
import { generateId } from "@/lib/utils/utils";

export const resumeCommand: Command = {
  name: "resume",
  description: "View or download resume",
  aliases: ["cv"],
  async execute(args: string[]): Promise<CommandOutput> {
    const parsed = ArgumentParser.parse(args.join(" "));

    if (ArgumentParser.hasFlag(parsed, "h", "help")) {
      return {
        type: "info",
        content: `📄 Resume Command Help

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
        link.href = "/resume.pdf";
        link.download = "Resume_Developer.pdf";
        link.click();
      }

      return {
        type: "success",
        content: "📥 Resume download started! Check your downloads folder.",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const resumeContent = [
      "📄 RESUME",
      "═".repeat(60),
      "",
      "👤 PERSONAL INFORMATION",
      "   Name: Full-Stack Developer",
      "   Email: developer@portfolio.com",
      "   Location: Global Remote",
      "   Portfolio: https://infinitedim.site",
      "",
      "🎯 PROFESSIONAL SUMMARY",
      "   Passionate full-stack developer with expertise in modern web",
      "   technologies. Specialized in React, Next.js, TypeScript, and",
      "   Node.js. Strong focus on performance, accessibility, and UX.",
      "",
      "💼 EXPERIENCE",
      "   Full-Stack Developer (2021 - Present)",
      "   • Developed scalable web applications using React & Next.js",
      "   • Built robust APIs with Node.js, NestJS, and PostgreSQL",
      "   • Implemented CI/CD pipelines and cloud deployments",
      "   • Optimized applications for performance and accessibility",
      "",
      "🛠️ TECHNICAL SKILLS",
      "   Frontend: React, Next.js, TypeScript, Tailwind CSS",
      "   Backend:  Node.js, NestJS, PostgreSQL, Redis",
      "   DevOps:   Docker, AWS, Vercel, CI/CD",
      "   Tools:    Git, Webpack, Vite, ESLint, Prettier",
      "",
      "🎓 EDUCATION & CERTIFICATIONS",
      "   • Computer Science Degree",
      "   • AWS Certified Developer",
      "   • React Advanced Patterns Certification",
      "",
      "🚀 FEATURED PROJECTS",
      "   Terminal Portfolio - Interactive developer portfolio",
      "   E-Commerce Platform - Full-stack online store",
      "   Task Management App - Collaborative project tool",
      "",
      "💡 Use 'resume --download' to get PDF version",
    ].join("\n");

    return {
      type: "success",
      content: resumeContent,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const socialCommand: Command = {
  name: "social",
  description: "View social media links",
  aliases: ["links", "connect"],
  async execute(args: string[]): Promise<CommandOutput> {
    const parsed = ArgumentParser.parse(args.join(" "));

    if (ArgumentParser.hasFlag(parsed, "h", "help")) {
      return {
        type: "info",
        content: `🔗 Social Command Help

Usage: social [options]

Options:
  -o, --open  Open all social links in browser
  -h, --help  Show this help

Examples:
  social       - List all social links
  social -o    - Open all links in browser`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const socialLinks = [
      {
        platform: "GitHub",
        icon: "🐙",
        url: "https://github.com/infinitedim",
        description: "Open source projects and contributions",
      },
      {
        platform: "LinkedIn",
        icon: "💼",
        url: "https://linkedin.com/in/infinitedim",
        description: "Professional network and experience",
      },
      {
        platform: "Twitter",
        icon: "🐦",
        url: "https://twitter.com/infinitedim",
        description: "Tech thoughts and industry insights",
      },
      {
        platform: "Dev.to",
        icon: "📝",
        url: "https://dev.to/infinitedim",
        description: "Technical articles and tutorials",
      },
      {
        platform: "Stack Overflow",
        icon: "📚",
        url: "https://stackoverflow.com/users/infinitedim",
        description: "Community contributions and reputation",
      },
      {
        platform: "Portfolio",
        icon: "🌐",
        url: "https://infinitedim.site",
        description: "This interactive terminal portfolio",
      },
    ];

    if (
      ArgumentParser.hasFlag(parsed, "o", "open") &&
      typeof window !== "undefined"
    ) {
      socialLinks.forEach((link) => {
        window.open(link.url, "_blank", "noopener,noreferrer");
      });

      return {
        type: "success",
        content: "🚀 Opening all social links in new tabs...",
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const content = [
      "🔗 SOCIAL LINKS",
      "═".repeat(60),
      "",
      ...socialLinks
        .map((link) => [
          `${link.icon} ${link.platform}`,
          `   ${link.url}`,
          `   ${link.description}`,
          "",
        ])
        .flat(),
      "💡 Use 'social --open' to open all links in browser",
      "💡 Click any link above to visit directly",
    ].join("\n");

    return {
      type: "success",
      content,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const shortcutsCommand: Command = {
  name: "shortcuts",
  description: "Show keyboard shortcuts",
  aliases: ["keys", "hotkeys", "kb"],
  async execute(): Promise<CommandOutput> {
    const shortcuts = [
      "⌨️  KEYBOARD SHORTCUTS",
      "═".repeat(60),
      "",
      "🔧 COMMAND SHORTCUTS",
      "   Tab               - Auto-complete command",
      "   ↑ / ↓             - Navigate command history",
      "   Ctrl + L          - Clear terminal",
      "   Ctrl + C          - Cancel current command",
      "   Ctrl + A          - Move cursor to beginning",
      "   Ctrl + E          - Move cursor to end",
      "   Ctrl + U          - Clear current line",
      "",
      "🎨 THEME SHORTCUTS",
      "   Ctrl + T          - Open theme selector",
      "   Ctrl + Shift + T  - Random theme",
      "   Alt + 1-9         - Quick theme switch",
      "",
      "📱 NAVIGATION SHORTCUTS",
      "   Ctrl + Home       - Go to top",
      "   Ctrl + End        - Go to bottom",
      "   Page Up/Down      - Scroll terminal",
      "   Ctrl + F          - Find in terminal",
      "",
      "♿ ACCESSIBILITY SHORTCUTS",
      "   Alt + A           - Open accessibility menu",
      "   Ctrl + +/-        - Zoom in/out",
      "   Ctrl + 0          - Reset zoom",
      "   F6                - Cycle through regions",
      "",
      "🚀 QUICK COMMANDS",
      "   Ctrl + Shift + H  - Show help",
      "   Ctrl + Shift + P  - Show projects",
      "   Ctrl + Shift + S  - Show skills",
      "   Ctrl + Shift + C  - Show contact",
      "",
      "💡 Pro tip: Most shortcuts work in all modern browsers!",
    ].join("\n");

    return {
      type: "success",
      content: shortcuts,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const enhancedContactCommand: Command = {
  name: "contact",
  description: "Contact information and form",
  aliases: ["reach", "email"],
  async execute(args: string[]): Promise<CommandOutput> {
    const parsed = ArgumentParser.parse(args.join(" "));

    if (ArgumentParser.hasFlag(parsed, "h", "help")) {
      return {
        type: "info",
        content: `📧 Contact Command Help

Usage: contact [options]

Options:
  -f, --form  Show interactive contact form
  -i, --info  Show contact information only
  -h, --help  Show this help

Examples:
  contact         - Show contact information
  contact --form  - Show interactive contact form
  contact -i      - Show contact info only`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    if (ArgumentParser.hasFlag(parsed, "f", "form")) {
      return {
        type: "success",
        content: `📝 INTERACTIVE CONTACT FORM
═══════════════════════════════════════════════════════════

🚀 Ready to start a conversation? Let's connect!

📧 Email: dragdimas9@gmail.com
📱 Response Time: Usually within 24 hours
🌍 Timezone: Available for global collaboration

┌─ QUICK CONTACT OPTIONS ─────────────────────────────────┐
│                                                         │
│  📧 Email:     mailto:dragdimas9@gmail.com        │
│  💼 LinkedIn:  https://linkedin.com/in/infinitedim      │
│  🐦 Twitter:   https://twitter.com/yourblooo          │
│  📞 Schedule:  https://infinitedim.site/schedule         │
│                                                         │
└─────────────────────────────────────────────────────────┘

💡 For project inquiries, please include:
   • Project scope and timeline
   • Technology requirements
   • Budget range (if applicable)
   • Preferred communication method

🎯 I specialize in:
   • Full-stack web development
   • React/Next.js applications
   • Node.js backend systems
   • DevOps and cloud deployment
   • Performance optimization

Let's build something amazing together! 🚀`,
        timestamp: new Date(),
        id: generateId(),
      };
    }

    const contactInfo = [
      "📧 CONTACT INFORMATION",
      "═".repeat(60),
      "",
      "👋 Let's connect and build something amazing!",
      "",
      "📧 Email:     dragdimas9@gmail.com",
      "💼 LinkedIn:  https://linkedin.com/in/infinitedim",
      "🐦 Twitter:   https://twitter.com/infinitedim",
      "🐙 GitHub:    https://github.com/infinitedim",
      "",
      "🌍 Location:  Available for remote work globally",
      "🕒 Timezone:  Flexible hours for collaboration",
      "📱 Response:  Usually within 24 hours",
      "",
      "🚀 SPECIALIZATIONS",
      "   • Full-stack web development",
      "   • React & Next.js applications",
      "   • Node.js & NestJS backends",
      "   • Cloud deployment & DevOps",
      "   • Performance optimization",
      "",
      "💡 Use 'contact --form' for an interactive contact form",
    ].join("\n");

    return {
      type: "success",
      content: contactInfo,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const easterEggsCommand: Command = {
  name: "easter-eggs",
  description: "Discover hidden commands and features",
  aliases: ["eggs", "secrets", "hidden"],
  async execute(): Promise<CommandOutput> {
    const easterEggs = [
      "🥚 EASTER EGGS & HIDDEN FEATURES",
      "═".repeat(60),
      "",
      "🎉 You found the secret commands! Here are some fun discoveries:",
      "",
      "🎮 FUN COMMANDS",
      "   matrix          - Enter the Matrix mode",
      "   konami          - Try the Konami code",
      "   dance           - Make the terminal dance",
      "   fortune         - Get a developer fortune",
      "   weather         - Check the weather in Terminal City",
      "",
      "🎨 HIDDEN THEMES",
      "   hacker          - Elite hacker theme",
      "   rainbow         - Colorful rainbow theme",
      "   neon            - Neon cyberpunk theme",
      "   vintage         - Retro computing theme",
      "",
      "🔮 SECRET SHORTCUTS",
      "   Type 'sudo rm -rf /' for a surprise",
      "   Try 'ls -la' for hidden files",
      "   Use 'whoami' to discover your identity",
      "   Type 'ps aux' to see running processes",
      "",
      "🎵 AUDIO EASTER EGGS",
      "   rickroll        - Classic internet culture",
      "   synthwave       - Retro synthwave vibes",
      "   dial-up         - Nostalgic internet sounds",
      "",
      "🚀 DEVELOPER JOKES",
      "   joke            - Random programming joke",
      "   xkcd            - Get a random XKCD comic reference",
      "   stackoverflow   - Ask Stack Overflow",
      "",
      "💡 Some of these might actually work... try them! 😉",
      "",
      "🎯 PRO TIP: Type 'help --secret' for more hidden commands",
    ].join("\n");

    return {
      type: "success",
      content: easterEggs,
      timestamp: new Date(),
      id: generateId(),
    };
  },
};

export const enhancedCommands = {
  resume: resumeCommand,
  social: socialCommand,
  shortcuts: shortcutsCommand,
  contact: enhancedContactCommand,
  easterEggs: easterEggsCommand,
} as const;
