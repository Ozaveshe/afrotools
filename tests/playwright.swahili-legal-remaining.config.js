'use strict';

const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.SW_LEGAL_PORT || 43151);

module.exports = defineConfig({
  testDir: path.join(__dirname, 'e2e'),
  testMatch: 'swahili-legal-remaining-parity.spec.js',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: path.join(root, 'artifacts/swahili-legal-remaining/playwright'),
  webServer: {
    command: 'node tests/support/static-server.js',
    cwd: root,
    env: { ...process.env, PORT: String(port), AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1' },
    url: `http://127.0.0.1:${port}/sw/biashara-na-uzingatiaji/`,
    reuseExistingServer: false,
    timeout: 120_000
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    serviceWorkers: 'block',
    trace: 'off',
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write']
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
