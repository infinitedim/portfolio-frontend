import { JSX } from "react";

export async function ServerStaticCommands(): Promise<JSX.Element> {
  const helpOutput = await generateHelpOutput();
  const aboutOutput = await generateAboutOutput();
  const projectsOutput = await generateProjectsOutput();

  return (
    <div
      className="hidden"
      id="static-commands"
      data-prerendered="true"
    >
      <div
        id="help-output"
        dangerouslySetInnerHTML={{ __html: helpOutput }}
      />
      <div
        id="about-output"
        dangerouslySetInnerHTML={{ __html: aboutOutput }}
      />
      <div
        id="projects-output"
        dangerouslySetInnerHTML={{ __html: projectsOutput }}
      />
    </div>
  );
}

async function generateHelpOutput(): Promise<string> {
  return `
    <div class="font-mono text-sm whitespace-pre-wrap">
🔧 Available Commands:
══════════════════════════════════════════════════════════════

  📝 help        - Show available commands and usage information
  📝 about       - Learn more about the developer  
  📝 skills      - View technical skills and roadmap progress
  📝 projects    - Browse portfolio projects and work examples
  📝 contact     - Get contact information and social links
  🎨 theme       - Customize the terminal appearance
  🔤 font        - Change terminal font family
  📝 clear       - Clear the terminal screen

🎯 Featured Commands:
  skills overview               - View roadmap.sh progress overview
  skills list frontend          - List frontend skills
  theme -l                      - List all available themes
  theme matrix                  - Switch to matrix theme

💡 Tips:
  • Use arrow keys (↑/↓) to navigate command history
  • Commands support aliases (e.g., 'cls' for 'clear')
  • Commands are case-insensitive with typo tolerance
  • Use Tab for command completion
    </div>
  `;
}

async function generateAboutOutput(): Promise<string> {
  return `
    <div class="font-mono text-sm whitespace-pre-wrap">
👋 Hello! I'm a Full-Stack Developer

🚀 Passionate about creating innovative web solutions
💻 Specialized in React, Next.js, and modern web technologies
🎨 Love combining technical skills with creative design
🌟 Always learning and exploring new technologies

This terminal-themed portfolio showcases my skills in:
  • Frontend Development (React, Next.js, TypeScript)
  • UI/UX Design (Tailwind CSS, Responsive Design)
  • DevOps (CI/CD, Performance Optimization)
  • Creative Problem Solving

🗺️ My learning journey is tracked on roadmap.sh
   Use 'skills overview' to see my current progress!

Type "projects" to see my work or "contact" to get in touch!
    </div>
  `;
}

async function generateProjectsOutput(): Promise<string> {
  return `
    <div class="font-mono text-sm whitespace-pre-wrap">
🚀 Featured Projects:

1. Terminal Portfolio (Current)
   • Interactive Linux terminal-themed website
   • Next.js, TypeScript, Tailwind CSS
   • Command parsing with typo tolerance
   • roadmap.sh integration for skills tracking
   • Multiple theme support with font customization

2. E-Commerce Platform
   • Full-stack online store with payment integration
   • React, Node.js, PostgreSQL
   • Real-time inventory management
   • JWT authentication system

3. Task Management App
   • Collaborative project management tool
   • React, Firebase, Material-UI
   • Real-time collaboration features
   • MongoDB for data persistence

4. Weather Dashboard
   • Beautiful weather app with forecasts
   • React, OpenWeather API, Chart.js
   • Responsive design with animations
   • Sass/SCSS for styling

🔗 All projects contribute to my roadmap.sh progress!
   Use 'skills overview' to see how they map to my skills.

Visit my GitHub for more projects and source code!
    </div>
  `;
}

export function usePrerenderedCommand(command: string): string | null {
  if (typeof window === "undefined") return null;

  const element = document.getElementById(`${command}-output`);
  return element?.innerHTML || null;
}
