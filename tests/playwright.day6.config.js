const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.DAY6_PORT || 4186);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  timeout: 60_000,
  expect: { timeout: 7_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'node support/day6-static-server.js',
    env: { DAY6_PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
