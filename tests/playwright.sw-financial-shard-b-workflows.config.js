'use strict';

const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');
const ROOT = path.resolve(__dirname, '..');
const PORT = 43918;

module.exports = defineConfig({
  testDir: path.join(ROOT, 'tests/e2e'),
  testMatch: [
    'microfinance-offer-vip.spec.js', 'mortgage-budget-boundary.spec.js',
    'day3-finance-mortgage-vip.spec.js', 'day3-finance-payslip-vip.spec.js',
    'property-roi-vip.spec.js', 'property-transfer-cost-vip.spec.js',
    'rent-vs-buy-vip.spec.js', 'day3-finance-retirement-planner-vip.spec.js',
    'day3-finance-route-fares-locales-vip.spec.js', 'day3-finance-salary-compare-vip.spec.js',
    'day3-finance-somalia-vip.spec.js', 'day3-finance-south-sudan-vip.spec.js',
    'day3-finance-sao-tome-vip.spec.js', 'startup-valuation-vip.spec.js',
    'day3-finance-togo-vip.spec.js',
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: path.join(ROOT, 'artifacts/swahili-financial-shard-b/workflows'),
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
