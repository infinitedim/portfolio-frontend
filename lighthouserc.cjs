/** @type {import('@lhci/cli').LighthouseCI.Config} */
const config = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/blog",
        "http://localhost:3000/projects",
      ],
      numberOfRuns: 3,
      startServerCommand: "BACKEND_URL=http://localhost:8080 NEXT_PUBLIC_API_URL=http://localhost:8080 bun run start",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.95 }],
        "categories:accessibility": ["warn", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.95 }],
        "categories:seo": ["warn", { minScore: 0.95 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        interactive: ["warn", { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "/tmp/verify-this/cwv-baseline",
    },
  },
};

module.exports = config;
