import { JSX } from "react";

/**
 * Props for the CriticalCSS component.
 */
interface CriticalCSSProps {
  /**
   * The identifier of the active theme (e.g., 'default', 'matrix', 'cyberpunk', 'dracula', 'nord').
   */
  theme: string;
}

/**
 * CriticalCSS component that injects inline critical CSS rules directly into the DOM.
 *
 * Pre-renders foundational styles, resets, CSS custom variables, typography,
 * responsive breakpoints, and keyframe animations to eliminate Flash of Unstyled Content (FOUC).
 *
 * @param props - Component props containing the active theme identifier.
 * @param props.theme - The active theme name for resolving CSS variable palettes.
 * @returns An inline `<style>` JSX element with generated critical CSS.
 */
export function CriticalCSS({ theme }: CriticalCSSProps): JSX.Element {
  const criticalCSS = generateCriticalCSS(theme);

  return (
    <style
      id="critical-css"
      dangerouslySetInnerHTML={{ __html: criticalCSS }}
    />
  );
}

/**
 * Generates the critical CSS style definitions string for the specified theme.
 *
 * Compiles root custom properties, resets, utility classes, media queries (reduced motion,
 * high contrast), and accessibility focus-state definitions.
 *
 * @param theme - The active theme identifier used to retrieve custom color palettes.
 * @returns The complete CSS stylesheet as a template literal string.
 */
function generateCriticalCSS(theme: string): string {
  const themeColors = getThemeColors(theme);

  return `
    :root {
      ${Object.entries(themeColors)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join("\n      ")}
      --font-inter: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-jetbrains-mono: "JetBrains Mono", "Fira Code", Consolas, monospace;
    }
    
    html {
      height: 100%;
      height: -webkit-fill-available;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: var(--font-inter);
      background-color: var(--terminal-bg);
      color: var(--terminal-text);
      font-size: 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      min-height: 100vh;
      min-height: -webkit-fill-available;
      overflow-x: hidden;
    }
    
    .theme-${theme} {
      background-color: var(--terminal-bg);
      color: var(--terminal-text);
    }
    
    .min-h-screen {
      min-height: 100vh;
      min-height: -webkit-fill-available;
    }
    
    .flex {
      display: flex;
    }
    
    .items-center {
      align-items: center;
    }
    
    .justify-center {
      justify-content: center;
    }
    
    .w-full {
      width: 100%;
    }
    
    .font-mono {
      font-family: var(--font-jetbrains-mono);
    }
    
    .text-sm {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .terminal-container {
      background-color: var(--terminal-bg);
      color: var(--terminal-text);
      min-height: 100vh;
      padding: 1rem;
    }
    
    @media (min-width: 640px) {
      .terminal-container {
        padding: 1.5rem;
      }
    }
    
    @media (min-width: 1024px) {
      .terminal-container {
        padding: 2rem;
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    @media (prefers-contrast: high) {
      :root {
        --terminal-text: ${theme === "default" ? "#000000" : "#ffffff"};
        --terminal-bg: ${theme === "default" ? "#ffffff" : "#000000"};
        --terminal-border: ${theme === "default" ? "#000000" : "#ffffff"};
      }
    }
    
    .focus-mode *:focus {
      outline: 3px solid var(--terminal-accent) !important;
      outline-offset: 2px !important;
    }
    
    .skip-to-content:focus {
      position: fixed !important;
      top: 1rem !important;
      left: 1rem !important;
      z-index: 9999 !important;
      padding: 0.75rem 1.5rem !important;
      background-color: #0066cc !important;
      color: #ffffff !important;
      border: 2px solid #004499 !important;
      border-radius: 0.5rem !important;
      font-weight: bold !important;
      text-decoration: none !important;
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3) !important;
      transform: scale(1.05) !important;
      transition: all 0.2s ease !important;
    }
  `;
}

/**
 * Retrieves the theme-specific CSS custom properties and color codes.
 *
 * Supported themes: default, matrix, cyberpunk, dracula, nord.
 * Falls back to the default theme configuration if an unrecognized theme name is provided.
 *
 * @param theme - The theme identifier name.
 * @returns A dictionary mapping CSS custom variable names to their corresponding hex color values.
 */
function getThemeColors(theme: string): Record<string, string> {
  const themes: Record<string, Record<string, string>> = {
    default: {
      "--terminal-bg": "#ffffff",
      "--terminal-text": "#000000",
      "--terminal-accent": "#0066cc",
      "--terminal-border": "#e5e5e5",
      "--terminal-muted": "#666666",
      "--terminal-success": "#008000",
      "--terminal-error": "#ff0000",
      "--terminal-warning": "#ffa500",
      "--terminal-info": "#0080ff",
      "--terminal-prompt": "#0066cc",
    },
    matrix: {
      "--terminal-bg": "#000000",
      "--terminal-text": "#00ff00",
      "--terminal-accent": "#00ff00",
      "--terminal-border": "#003300",
      "--terminal-muted": "#008800",
      "--terminal-success": "#00ff00",
      "--terminal-error": "#ff4444",
      "--terminal-warning": "#ffff00",
      "--terminal-info": "#00ffff",
      "--terminal-prompt": "#00ff00",
    },
    cyberpunk: {
      "--terminal-bg": "#0a0a0a",
      "--terminal-text": "#ff00ff",
      "--terminal-accent": "#00ffff",
      "--terminal-border": "#333333",
      "--terminal-muted": "#888888",
      "--terminal-success": "#00ff00",
      "--terminal-error": "#ff0066",
      "--terminal-warning": "#ffaa00",
      "--terminal-info": "#00ffff",
      "--terminal-prompt": "#ff00ff",
    },
    dracula: {
      "--terminal-bg": "#282a36",
      "--terminal-text": "#f8f8f2",
      "--terminal-accent": "#bd93f9",
      "--terminal-border": "#44475a",
      "--terminal-muted": "#6272a4",
      "--terminal-success": "#50fa7b",
      "--terminal-error": "#ff5555",
      "--terminal-warning": "#f1fa8c",
      "--terminal-info": "#8be9fd",
      "--terminal-prompt": "#bd93f9",
    },
    nord: {
      "--terminal-bg": "#2e3440",
      "--terminal-text": "#d8dee9",
      "--terminal-accent": "#5e81ac",
      "--terminal-border": "#3b4252",
      "--terminal-muted": "#616e88",
      "--terminal-success": "#a3be8c",
      "--terminal-error": "#bf616a",
      "--terminal-warning": "#ebcb8b",
      "--terminal-info": "#88c0d0",
      "--terminal-prompt": "#5e81ac",
    },
  };

  return themes[theme] || themes.default;
}
