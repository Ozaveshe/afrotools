'use strict';
const path = require('node:path');
const { spawn } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../..');

// Own the child and use the OS-assigned port; never attach to an unrelated server.
module.exports = async function startConsentServer({ readyPath = '/sw/sierra-leone/kikokotoo-kodi-mshahara/', timeoutMs = 30000, serverScript = path.join(__dirname, 'static-server.js') } = {}) {
  const child = spawn(process.execPath, [serverScript], {
    cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '0', AFROTOOLS_TEST_DISABLE_ANALYTICS: '0', AFROTOOLS_TEST_PUBLISH_ARTIFACT: '0', AFROTOOLS_SW_VAT_PROOF_MODE: '0', AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1' }
  });
  let exited = false;
  const closed = new Promise(resolve => {
    child.once('close', () => { exited = true; resolve(); });
    child.once('error', () => { if (!child.pid) { exited = true; resolve(); } });
  });
  const stop = async () => { if (!exited) child.kill(); await closed; };
  let timer;
  try {
    const origin = await new Promise((resolve, reject) => {
      let output = '';
      timer = setTimeout(() => reject(new Error('Consent server startup timed out')), timeoutMs);
      child.stdout.on('data', chunk => {
        output = (output + chunk).slice(-8192);
        const match = output.match(/running at (http:\/\/127\.0\.0\.1:\d+)/);
        if (match) resolve(match[1]);
      });
      child.stderr.on('data', () => {});
      child.once('error', reject);
      child.once('exit', code => reject(new Error('Consent server exited before readiness: ' + code)));
    });
    clearTimeout(timer);
    const response = await fetch(origin + readyPath, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error('Consent server readiness HTTP ' + response.status);
    const html = await response.text();
    if (!html.includes('data-sw-paye-app')) throw new Error('Consent server readiness did not return the PAYE app');
    return { origin, stop, pid: child.pid };
  } catch (error) {
    clearTimeout(timer);
    await stop();
    throw error;
  }
};
