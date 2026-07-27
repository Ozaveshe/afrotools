const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  timeout: 60_000,
  expect: { timeout: 7_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4186',
    trace: 'retain-on-failure',
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'node support/day6-static-server.js',
    url: 'http://127.0.0.1:4186',
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
