const { defineConfig, devices } = require("@playwright/test");
module.exports = defineConfig({
  testDir: __dirname,
  timeout: 60000,
  expect: { timeout: 7000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4199",
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command:
      "node -e \"process.env.PORT='4199'; require('../../tests/support/static-server.js')\"",
    url: "http://127.0.0.1:4199",
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
