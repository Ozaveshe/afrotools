const path = require("node:path");
const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.SW_CREATOR_CAPTIONS_PORT || 4442);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, "e2e"),
  testMatch: "sw-creator-captions-parity.spec.js",
  timeout: 120000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    acceptDownloads: true,
    serviceWorkers: "block",
    trace: "off",
  },
  webServer: {
    command: "node support/static-server.js",
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
