'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'ha-03-browser.spec.js',
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4313',
    browserName: 'chromium',
    locale: 'ha-NG',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  webServer: {
    command: 'node tests/hausa/ha-03/static-server.js',
    cwd: '../../..',
    url: 'http://127.0.0.1:4313/ha/kayan-aiki/kalkuleta-waec/',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
