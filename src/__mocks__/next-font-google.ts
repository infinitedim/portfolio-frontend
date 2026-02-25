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
