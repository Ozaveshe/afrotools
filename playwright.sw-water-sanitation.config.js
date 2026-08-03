'use strict';

const { defineConfig, devices } = require('@playwright/test');

const port = 4431;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'artifacts/sw-water-sanitation-playwright',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${port}`,
    acceptDownloads: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    env: { PORT:String(port) },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{ name:'chromium', use:{ ...devices['Desktop Chrome'] } }]
});
