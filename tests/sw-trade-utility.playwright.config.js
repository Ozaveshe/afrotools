const path = require("node:path");
const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4273";

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "sw-trade-utility-product.spec.js",
  timeout: 60000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [{ name: "afrotools_cookie_consent", value: "declined" }]
      }]
    }
  },
  webServer: {
    command: "node tests/support/static-server.js",
    cwd: path.resolve(__dirname, ".."),
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: false,
    env: { ...process.env, PORT: "4273" }
  }
});
