const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sw-mining-parity.spec.js',
  timeout: 120000,
  expect: { timeout: 10000 },
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:4417', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/support/static-server.js',
    env: { PORT: '4417' },
    url: 'http://127.0.0.1:4417',
    reuseExistingServer: false,
    timeout: 30000
  }
});
