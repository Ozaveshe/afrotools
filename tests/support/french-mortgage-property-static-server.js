'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');

module.exports = async function startPortableMortgagePropertyServer() {
  const child = spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: '0',
      AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  let output = '';
  const origin = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out starting portable static server.\n${output}`));
    }, 30_000);
    const onData = (chunk) => {
      output += chunk.toString();
      const match = output.match(/running at (http:\/\/127\.0\.0\.1:\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Portable static server exited with code ${code}.\n${output}`));
    });
  });

  process.env.MP66_BASE_URL = origin;
  process.env.MP66_BROWSER_EVIDENCE = process.env.MP66_BROWSER_EVIDENCE || path.join(
    ROOT,
    'artifacts',
    'french-mortgage-property',
    'browser-evidence.json'
  );

  return async () => {
    if (child.exitCode !== null) return;
    child.kill();
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 5_000);
      child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  };
};
