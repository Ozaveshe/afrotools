const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.SW_BACKGROUND_REMOVER_PORT || 4450);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  testMatch: /swahili-(?:background|favicon|image|logo|meme|passport|qr|social|thumbnail|watermark).*\.spec\.js/,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    serviceWorkers: 'block',
    storageState: { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: 'afrotools_cookie_consent', value: 'declined' }] }] }
  },
  webServer: {
    command: 'node support/static-server.js',
    cwd: path.resolve(__dirname),
    env: { PORT: String(port), AFROTOOLS_TEST_DISABLE_ANALYTICS: '1' },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
