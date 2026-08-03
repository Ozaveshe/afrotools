const { defineConfig, devices } = require('@playwright/test');

const port = 4497;

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'swahili-paye-exact-three-vip.spec.js',
  timeout: 120000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    env: { ...process.env, PORT: String(port) },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  }],
});
