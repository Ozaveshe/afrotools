const path = require("node:path");
const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.SW_CREATOR_ANALYTICS_PORT || 4437);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, "e2e"),
  testMatch: "sw-creator-analytics-parity.spec.js",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    acceptDownloads: true,
    serviceWorkers: "block",
    trace: "off",
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [{ name: "afrotools_cookie_consent", value: "declined" }]
      }]
    }
  },
  webServer: {
    command: "node support/static-server.js",
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
