export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  action?: "type" | "click" | "highlight";
  demoCommand?: string;
  icon: string;
  tips?: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Terminal Portfolio! 🚀",
    content:
      "This isn't your typical portfolio. Here, you explore by typing commands — just like a real developer would. Let me show you around!",
    position: "center",
    icon: "👋",
    tips: [
      "This tour takes about 1 minute",
      "You can skip anytime with ESC",
      "Type 'tour' anytime to restart",
    ],
  },
  {
    id: "command-input",
    title: "The Command Line ⌨️",
    content:
      "This is where the magic happens! Type commands here and press Enter to execute. Try typing 'help' to see all available commands.",
    target: "#command-input",
    position: "top",
    icon: "⌨️",
    action: "highlight",
    demoCommand: "help",
  },
  {
    id: "tab-completion",
    title: "Smart Auto-Complete 💡",
    content:
      "Start typing and press Tab — the terminal will suggest matching commands. Try typing 'sk' and hitting Tab!",
    target: "#command-input",
    position: "top",
    icon: "⚡",
    demoCommand: "sk",
    tips: ["Press Tab to auto-complete", "Works with partial matches"],
  },
  {
    id: "history",
    title: "Command History 📜",
    content:
      "Navigate through your previous commands using arrow keys. After executing a few commands, try pressing the up arrow to recall them!",
    target: "#command-input",
    position: "top",
    icon: "📏",
    tips: [
      "Execute commands first to build history",
      "Then use ↑ ↓ arrow keys to navigate",
      "Press Enter to re-run a command",
    ],
  },
  {
    id: "essential-commands",
    title: "Essential Commands 🎯",
    content:
      "Here are the commands you'll use most often. Each one reveals something different about me!",
    position: "center",
    icon: "🎯",
    tips: [
      "'about' — Learn who I am",
      "'skills' — See my tech stack",
      "'projects' — Explore my work",
      "'contact' — Get in touch",
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Power User Shortcuts ⚡",
    content:
      "Master these shortcuts to navigate like a pro! Use these to speed up your workflow.",
    position: "center",
    icon: "⚡",
    tips: [
      "Type 'clear' — Clear the screen",
      "ESC — Cancel/close popups",
      "Tab — Auto-complete commands",
      "↑ ↓ arrows — Navigate history",
      "Type 'shortcuts' for full list",
    ],
  },
  {
    id: "complete",
    title: "You're All Set! 🎉",
    content:
      "You now know the basics! Start exploring by typing 'help' to see all available commands. Have fun!",
    position: "center",
    icon: "🎉",
    tips: [
      "Type 'tour' to replay this guide",
      "Type 'help' for all commands",
      "Enjoy exploring! 🚀",
    ],
  },
];

export const TOUR_STORAGE_KEY = "terminal-tour-completed";
export const TOUR_VERSION = "1.0.0";
