const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sw-civil-site-works-parity.spec.js',
  timeout: 90000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  outputDir: 'artifacts/sw-civil-site-works-playwright',
  use: {
    baseURL: 'http://127.0.0.1:4423',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: 'http://127.0.0.1:4423',
    env: { PORT: '4423' },
    reuseExistingServer: false,
    timeout: 30000
  }
});
