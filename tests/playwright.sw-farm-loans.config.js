const path = require('node:path');
const { defineConfig, devices } = require('playwright/test');

const port = Number(process.env.SW_FARM_LOANS_PORT || 4398);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  testMatch: 'sw-agriculture-farm-loans-family.spec.js',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: path.resolve(__dirname, '../reports/sw-agriculture-browser-raw/farm-loans-playwright.json') }],
  ],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    serviceWorkers: 'block',
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }],
      }],
    },
  },
  webServer: {
    command: `"${process.execPath}" support/static-server.js`,
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
