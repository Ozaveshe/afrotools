const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.PORT || 43821);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sw-transport-remaining-parity.spec.js',
  timeout: 90000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL, localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }] }]
    }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: path.resolve(__dirname),
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
