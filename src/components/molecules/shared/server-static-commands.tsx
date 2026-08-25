import { JSX } from "react";

/**
 * ServerStaticCommands is a React Server Component that pre-renders static outputs
 * for core terminal commands (`help`, `about`, `projects`) into hidden DOM containers.
 *
 * This allows instant client-side command execution without needing client bundle execution
 * or network requests for standard help documentation and portfolio information.
 *
 * @returns A promise resolving to a hidden container JSX element containing pre-rendered command outputs.
 */
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

/**
 * Generates the static HTML markup string for the `help` command output.
 *
 * Outlines available CLI commands, featured commands, tips, and navigation instructions.
 *
 * @returns A promise resolving to the pre-rendered HTML string for the help command.
 */
async function generateHelpOutput(): Promise<string> {
  return `
    <div class="font-mono text-sm whitespace-pre-wrap">
Available Commands:
══════════════════════════════════════════════════════════════

  help        - Show available commands and usage information
  about       - Learn more about the developer  
  skills      - View technical skills and roadmap progress
  projects    - Browse portfolio projects and work examples
  contact     - Get contact information and social links
  theme       - Customize the terminal appearance
  font        - Change terminal font family
  clear       - Clear the terminal screen

Featured Commands:
  skills overview               - View roadmap.sh progress overview
  skills list frontend          - List frontend skills
  theme -l                      - List all available themes
  theme matrix                  - Switch to matrix theme

Tips:
  • Use arrow keys (↑/↓) to navigate command history
  • Commands support aliases (e.g., 'cls' for 'clear')
  • Commands are case-insensitive with typo tolerance
  • Use Tab for command completion
    </div>
  `;
}

/**
 * Generates the static HTML markup string for the `about` command output.
 *
 * Details the developer background, tech stack specializations, and career overview.
 *
 * @returns A promise resolving to the pre-rendered HTML string for the about command.
 */
async function generateAboutOutput(): Promise<string> {
  return `
    <div class="font-mono text-sm whitespace-pre-wrap">
Hello! I'm a Full-Stack Developer

Passionate about creating innovative web solutions
Specialized in React, Next.js, and modern web technologies
Love combining technical skills with creative design
Always learning and exploring new technologies

This terminal-themed portfolio showcases my skills in:
  • Frontend Development (React, Next.js, TypeScript)
  • UI/UX Design (Tailwind CSS, Responsive Design)
  • DevOps (CI/CD, Performance Optimization)
  • Creative Problem Solving

️ My learning journey is tracked on roadmap.sh
   Use 'skills overview' to see my current progress!

Type "projects" to see my work or "contact" to get in touch!
    </div>
  `;
}

/**
 * Generates the static HTML markup string for the `projects` command output.
 *
 * Summarizes highlighted featured engineering projects, tech stacks, and links.
 *
 * @returns A promise resolving to the pre-rendered HTML string for the projects command.
 */
async function generateProjectsOutput(): Promise<string> {
  return `
    <div class="font-mono text-sm whitespace-pre-wrap">
Featured Projects:

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

All projects contribute to my roadmap.sh progress!
   Use 'skills overview' to see how they map to my skills.

Visit my GitHub for more projects and source code!
    </div>
  `;
}

/**
 * Retrieves pre-rendered HTML output for a specific CLI command from the hidden DOM container.
 *
 * @param command - The name/slug of the command to retrieve (e.g., 'help', 'about', 'projects').
 * @returns The pre-rendered inner HTML content string if found on the client DOM, or null otherwise.
 */
export function usePrerenderedCommand(command: string): string | null {
  if (typeof window === "undefined") return null;

  const element = document.getElementById(`${command}-output`);
  return element?.innerHTML || null;
}
