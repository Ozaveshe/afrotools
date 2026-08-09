'use strict';

const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const PORT = 43922;

module.exports = defineConfig({
  testDir: path.join(ROOT, 'tests/e2e'),
  testMatch: /(za-gepf-vip|swahili-financial-shard-b)\.spec\.js/,
  grep: /za-gepf|fails closed under ten years|creates a real local PDF document/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: path.join(ROOT, 'artifacts/swahili-financial-shard-b/za-gepf-playwright'),
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    acceptDownloads: true,
    serviceWorkers: 'block',
    trace: 'off',
    launchOptions: { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: ROOT,
    env: { PORT: String(PORT), AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1' },
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
