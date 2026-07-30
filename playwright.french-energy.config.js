const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.FR_ENERGY_PORT || 4373);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 90000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: "node tests/support/static-server.js",
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  }],
});
