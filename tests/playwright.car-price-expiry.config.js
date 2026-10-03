const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');
const port = Number(process.env.CAR_PRICE_EXPIRY_PORT || 44443);
const baseURL = `http://127.0.0.1:${port}`;
module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  testMatch: 'cars-market-age.spec.js',
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: [['list']],
  outputDir: process.env.CAR_PRICE_EXPIRY_OUTPUT || path.resolve(__dirname, '../test-results/car-price-expiry'),
  use: { baseURL, serviceWorkers: 'block', trace: 'off' },
  webServer: {
    command: 'node support/static-server.js', env: { PORT: String(port) },
    url: baseURL, reuseExistingServer: false, timeout: 120000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }
  ]
});
