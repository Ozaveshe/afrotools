const { defineConfig, devices } = require("@playwright/test");

const port = 4197;
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    serviceWorkers: "block",
    trace: "off",
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [{
          name: "afrotools_cookie_consent",
          value: "declined"
        }]
      }]
    }
  },
  webServer: {
    command: "node tests/support/static-server.js",
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 30000
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }]
});
