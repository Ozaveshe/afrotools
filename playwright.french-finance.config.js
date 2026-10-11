'use strict';

const path = require('path');
const { defineConfig, devices } = require('@playwright/test');
const { ENDPOINT } = require('./tests/support/french-finance-proof-identity');
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;

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
    trace: 'off',
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: path.resolve(__dirname),
    env: {
      ...process.env,
      PORT: String(financePort),
      AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1',
      AFROTOOLS_FRENCH_FINANCE_PROOF: '1'
    },
    url: `${financeBaseUrl}${ENDPOINT}`,
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], launchOptions: chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : undefined }
  }]
});
