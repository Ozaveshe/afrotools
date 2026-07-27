const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.DAY11_PORT || 4273);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    env: { PORT: String(port) },
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] }
  }]
});
