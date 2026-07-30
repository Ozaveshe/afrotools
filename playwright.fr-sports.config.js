const { defineConfig, devices } = require("@playwright/test");

const port = 4193;
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    serviceWorkers: "block"
  },
  webServer: {
    command: "node tests/support/static-server.js",
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  }]
});
