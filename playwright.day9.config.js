const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4199',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: `node -e "process.env.PORT='4199'; require('./tests/support/static-server.js')"`,
    url: 'http://127.0.0.1:4199',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
});
