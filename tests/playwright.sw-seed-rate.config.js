const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.SW_SEED_RATE_PORT || 4391);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  timeout: 90_000,
  expect: { timeout: 8_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    serviceWorkers: 'block',
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }]
      }]
    }
  },
  webServer: {
    command: 'node support/static-server.js',
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
