const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.SW_HR_PAYROLL_PORT || 4469);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  testMatch: "sw-hr-payroll-six.spec.js",
  timeout: 180000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    serviceWorkers: "block",
    trace: "retain-on-failure",
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL, localStorage: [{ name: "afrotools_cookie_consent", value: "declined" }] }]
    }
  },
  webServer: {
    command: "node tests/support/static-server.js",
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: false,
    env: { PORT: String(port) }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
