const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'browser.spec.js',
  timeout: 90000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    serviceWorkers: 'block',
    acceptDownloads: true
  },
  webServer: {
    command: 'node ../../support/static-server.js',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
