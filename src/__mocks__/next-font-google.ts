/**
 * Stub for next/font/google used in bun test environments.
 *
 * next/font/google/index.js is intentionally empty — Next.js generates font
 * exports at compile time via its webpack/turbopack plugin. Bun's test runner
 * performs static ESM export validation at bundle time, so it throws a
 * SyntaxError when server components import named font exports from the empty
 * file. This stub provides the expected named exports so bun can load the
 * module, while Next.js's own font plugin still handles production builds.
 *
 * tsconfig.json maps "next/font/google" → this file for test purposes only.
 * Next.js overrides that resolution at compile/bundle time, so production
 * builds are unaffected.
 */

type FontOptions = {
  subsets?: string[];
  display?: string;
  variable?: string;
  weight?: string | string[];
  style?: string | string[];
  preload?: boolean;
  fallback?: string[];
  adjustFontFallback?: boolean | string;
};

type FontResult = {
  className: string;
  style: { fontFamily: string };
  variable: string;
};

const makeFontFactory =
  (name: string) =>
  (_opts?: FontOptions): FontResult => ({
    className: `mock-font-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    style: { fontFamily: `'${name}', monospace` },
    variable: `--font-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
  });

// Export every Google Font used in the project as a named export.
// Add additional fonts here as needed.
export const JetBrains_Mono = makeFontFactory("JetBrains Mono");
export const Inter = makeFontFactory("Inter");
export const Roboto = makeFontFactory("Roboto");
export const Open_Sans = makeFontFactory("Open Sans");
export const Lato = makeFontFactory("Lato");
export const Montserrat = makeFontFactory("Montserrat");
export const Source_Code_Pro = makeFontFactory("Source Code Pro");
export const Fira_Code = makeFontFactory("Fira Code");
export const Inconsolata = makeFontFactory("Inconsolata");
export const Ubuntu_Mono = makeFontFactory("Ubuntu Mono");
export const Noto_Sans = makeFontFactory("Noto Sans");
export const Nunito = makeFontFactory("Nunito");
export const Raleway = makeFontFactory("Raleway");
export const Poppins = makeFontFactory("Poppins");
