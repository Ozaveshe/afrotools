const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: ".",
  testMatch: "day3-vat-dr-congo-vip.spec.js",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4220",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node ../support/static-server.js",
    url: "http://127.0.0.1:4220",
    timeout: 30000,
    reuseExistingServer: false,
    env: { PORT: "4220" },
  },
  reporter: "line",
});
