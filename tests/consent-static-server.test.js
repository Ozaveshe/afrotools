'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const start = require('./support/consent-static-server');

test('consent server owns an ephemeral ready origin and closes its socket', async () => {
  const server = await start();
  try {
    assert.match(server.origin, /^http:\/\/127\.0\.0\.1:\d+$/);
    assert.equal((await fetch(server.origin + '/sw/sierra-leone/kikokotoo-kodi-mshahara/')).status, 200);
  } finally { await server.stop(); }
  await server.stop();
  await assert.rejects(fetch(server.origin, { signal: AbortSignal.timeout(1000) }));
});

test('missing readiness route fails instead of accepting another app', async () => {
  await assert.rejects(start({ readyPath: '/consent-readiness-missing-8dac/' }), /readiness HTTP 404/);
});

test('startup exit and timeout fail promptly and stop the owned child', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consent-server-test-'));
  try {
    const exit = path.join(dir, 'exit.js');
    fs.writeFileSync(exit, 'process.exit(7)');
    await assert.rejects(start({ serverScript: exit, timeoutMs: 3000 }), /exited before readiness: 7/);
    const hang = path.join(dir, 'hang.js'), pidFile = path.join(dir, 'pid');
    fs.writeFileSync(hang, 'require("fs").writeFileSync(' + JSON.stringify(pidFile) + ',String(process.pid));setInterval(()=>{},1000);');
    await assert.rejects(start({ serverScript: hang, timeoutMs: 1500 }), /startup timed out/);
    const pid = Number(fs.readFileSync(pidFile, 'utf8'));
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
