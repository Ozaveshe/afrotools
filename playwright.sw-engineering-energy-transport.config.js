const { defineConfig, devices } = require('@playwright/test');

const port = 4198;
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'sw-engineering-energy-transport-candidate.spec.js',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    serviceWorkers: 'block',
    trace: 'off',
    launchOptions: {
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 30000
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'] } }]
});
