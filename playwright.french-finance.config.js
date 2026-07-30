'use strict';

const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const financePort = Number(process.env.FRENCH_FINANCE_PLAYWRIGHT_PORT || 42973);
const financeBaseUrl = `http://127.0.0.1:${financePort}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: financeBaseUrl,
    trace: 'retain-on-failure',
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: path.resolve(__dirname),
    env: {
      ...process.env,
      PORT: String(financePort),
      AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1'
    },
    url: `${financeBaseUrl}/tests/fixtures/french-finance-worktree-sentinel.json`,
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  }]
});
