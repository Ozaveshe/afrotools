const { defineConfig } = require('@playwright/test');
const shared = require('./playwright.config');
const port = Number(process.env.AFROATLAS_TEST_PORT || 43824);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  ...shared,
  testMatch: /afroatlas-(?:discovery|research)\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  use: {
    ...shared.use,
    baseURL,
    storageState: {
      cookies: [],
      origins: [{ origin: baseURL, localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }] }]
    }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 60000
  }
});
