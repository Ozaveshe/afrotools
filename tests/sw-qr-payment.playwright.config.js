const path = require('node:path');
const { defineConfig, devices } = require('playwright/test');

const baseURL = 'http://127.0.0.1:4311';

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: 'sw-qr-payment.spec.js',
  timeout: 60000,
  expect: { timeout: 8000 },
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    serviceWorkers: 'block',
    trace: 'off',
    storageState: { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }] }] }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: path.resolve(__dirname, '..'),
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: false,
    env: { ...process.env, PORT: '4311' }
  }
});
