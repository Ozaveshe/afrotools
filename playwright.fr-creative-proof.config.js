const { defineConfig, devices } = require("@playwright/test");

const PORT = Number(process.env.FR_CREATIVE_PROOF_PORT || 4269);
const executablePath = process.env.FR_CREATIVE_CHROMIUM_EXECUTABLE;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    serviceWorkers: "block",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: `node -e "process.env.PORT='${PORT}'; require('./tests/support/static-server.js')"`,
    url: `http://127.0.0.1:${PORT}/creative/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  }],
});
