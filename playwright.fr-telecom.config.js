const { defineConfig, devices } = require('@playwright/test');

const testPort = Number(process.env.PORT || 43137);
const testBaseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${testPort}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'french-telecom-parity.spec.js',
  timeout: 90000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: testBaseUrl,
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    colorScheme: 'dark'
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: testBaseUrl,
    env: Object.assign({}, process.env, { PORT: String(testPort) }),
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  }]
});
