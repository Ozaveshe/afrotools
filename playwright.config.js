const { defineConfig, devices } = require('@playwright/test');

const testPort = Number(process.env.PORT || 4173);
const testBaseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${testPort}`;
const ownerTestStorageState = process.env.AFROTOOLS_TEST_DISABLE_ANALYTICS === '1'
  ? {
      cookies: [],
      origins: [{
        origin: testBaseUrl,
        localStorage: [{
          name: 'afrotools_cookie_consent',
          value: 'declined'
        }]
      }]
    }
  : undefined;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: testBaseUrl,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    storageState: ownerTestStorageState
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: testBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  }]
});
