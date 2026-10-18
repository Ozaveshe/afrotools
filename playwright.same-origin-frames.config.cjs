'use strict';
// Dedicated HTTP-CSP gate. The default suite's global policy stays unchanged.
const { defineConfig } = require('@playwright/test');
const port = Number(process.env.PORT || 4269);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Same-origin frames require a valid local test port');
const baseURL = `http://127.0.0.1:${port}`;
// Playwright workers inherit this flag; the fresh maintained server receives it explicitly too.
process.env.AFROTOOLS_TEST_SECURITY_HEADERS = '1';
module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: 'same-origin-frame-policy.spec.js',
  timeout: 40000,
  globalTimeout: 150000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    serviceWorkers: 'block',
    bypassCSP: false,
    actionTimeout: 12000,
    navigationTimeout: 20000,
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--disable-background-networking', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost']
    }
  },
  webServer: {
    command: 'node tests/support/static-server.js',
    url: baseURL,
    env: { PORT: String(port), AFROTOOLS_TEST_SECURITY_HEADERS: '1' },
    reuseExistingServer: false,
    timeout: 15000
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
