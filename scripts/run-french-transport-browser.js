#!/usr/bin/env node
'use strict';

const childProcess = require('child_process');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.FR_TRANSPORT_PORT || 45173);
const baseURL = `http://127.0.0.1:${port}`;
const server = childProcess.spawn(process.execPath, ['tests/support/static-server.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: 'inherit'
});

function probe(remaining) {
  return new Promise((resolve, reject) => {
    const request = http.get(`${baseURL}/fr/transport/`, (response) => {
      response.resume();
      if (response.statusCode >= 200 && response.statusCode < 500) resolve();
      else reject(new Error(`Static server returned ${response.statusCode}`));
    });
    request.on('error', (error) => {
      if (remaining <= 0) reject(error);
      else setTimeout(() => resolve(probe(remaining - 1)), 100);
    });
    request.setTimeout(1000, () => request.destroy(new Error('Static server probe timed out')));
  });
}

async function main() {
  let exitCode = 1;
  try {
    await probe(100);
    const cli = require.resolve('@playwright/test/cli');
    const test = childProcess.spawn(process.execPath, [
      cli,
      'test',
      'tests/e2e/french-transport-parity.spec.js',
      '--config=playwright.french-transport.config.js',
      '--project=chromium',
      '--workers=1'
    ], {
      cwd: root,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
      stdio: 'inherit'
    });
    exitCode = await new Promise((resolve, reject) => {
      test.on('error', reject);
      test.on('exit', (code) => resolve(code == null ? 1 : code));
    });
  } finally {
    if (!server.killed) server.kill();
  }
  process.exitCode = exitCode;
}

server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

main().catch((error) => {
  console.error(error.stack || error.message);
  if (!server.killed) server.kill();
  process.exitCode = 1;
});
