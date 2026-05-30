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
      startServerCommand: "bun run start",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
      settings: {
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "/tmp/verify-this/cwv-baseline-mobile",
    },
  },
};

export default config;
