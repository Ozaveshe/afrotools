const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const worktreeRoot = path.resolve(__dirname, '..');

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'e2e'),
  testMatch: 'french-mortgage-property-parity.spec.js',
  globalSetup: path.join(__dirname, 'support', 'french-mortgage-property-static-server.js'),
  timeout: 45 * 60 * 1000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  outputDir: path.join(worktreeRoot, 'artifacts', 'french-mortgage-property', 'playwright'),
  use: {
    trace: 'off',
    serviceWorkers: 'block'
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], acceptDownloads: true }
  }]
});
