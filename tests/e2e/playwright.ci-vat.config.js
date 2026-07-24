const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: ".",
  testMatch: "day3-vat-cote-divoire-vip.spec.js",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4218",
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node ../support/static-server.js",
    url: "http://127.0.0.1:4218",
    timeout: 30000,
    reuseExistingServer: false,
    env: { PORT: "4218" },
  },
  reporter: "line",
});
