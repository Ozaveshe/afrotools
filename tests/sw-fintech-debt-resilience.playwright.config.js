const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /e2e\/sw-fintech-debt-resilience\.spec\.js/,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4298',
    browserName: 'chromium',
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node -e "process.env.PORT=4298; require(\'./support/static-server.js\')"',
    url: 'http://127.0.0.1:4298',
    reuseExistingServer: false,
    timeout: 30000
  }
});
