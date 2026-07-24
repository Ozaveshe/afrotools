const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: ".",
  testMatch: "day3-vat-equatorial-guinea-vip.spec.js",
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4221", browserName: "chromium", headless: true, trace: "retain-on-failure" },
  webServer: { command: "node ../support/static-server.js", url: "http://127.0.0.1:4221", timeout: 30000, reuseExistingServer: false, env: { PORT: "4221" } },
  reporter: "line",
});
