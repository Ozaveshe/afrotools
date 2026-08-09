const { defineConfig, devices } = require('@playwright/test');
const port = Number(process.env.SW_FINANCE_A_REMAINDER_PORT || 43927);
const baseURL = `http://127.0.0.1:${port}`;
module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'swahili-finance-a-remainder-crypto-arbitrage.spec.js',
  timeout: 180000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL, ...devices['Desktop Chrome'], serviceWorkers: 'block', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/support/static-server.js', url: baseURL, timeout: 120000, reuseExistingServer: false, env: { PORT: String(port) } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
