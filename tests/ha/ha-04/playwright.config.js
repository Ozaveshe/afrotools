const { defineConfig, devices } = require('@playwright/test');
const path = require('node:path');
const port = Number(process.env.PORT || 43104);
const baseURL = 'http://127.0.0.1:' + port;
const repoRoot = path.resolve(__dirname, '../../..');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /ha-04-browser\.spec\.js/,
  timeout: 90000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL, localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }] }]
    },
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: repoRoot,
    url: baseURL,
    env: { ...process.env, PORT: String(port) },
    reuseExistingServer: false,
    timeout: 120000
  }
});
