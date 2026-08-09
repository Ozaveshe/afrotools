const path = require("node:path");
const { defineConfig, devices } = require("@playwright/test");
const port = Number(process.env.SW_CREATOR_BIOS_PORT || 4438);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, "e2e"),
  testMatch: "sw-creator-bios-parity.spec.js",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], baseURL, acceptDownloads: true, serviceWorkers: "block", trace: "off" },
  webServer: {
    command: "node support/static-server.js",
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
