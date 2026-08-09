const { defineConfig, devices } = require('@playwright/test');
const port = 43941;
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sw-finance-ke-stamp-duty.spec.js',
  timeout: 180000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    serviceWorkers: 'block',
    trace: 'off',
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }]
      }]
    }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: false,
    env: { PORT: String(port) }
  }
});
