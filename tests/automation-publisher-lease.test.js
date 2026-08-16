'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  readLease,
  leaseStatus,
  acquire,
  refresh,
  release,
} = require('../scripts/automation-publisher-lease');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-publisher-lease-'));
const lockPath = path.join(tempRoot, 'publisher-lock.json');
try {
  const acquired = acquire({
    lockPath,
    ttlMinutes: 30,
    runId: 'run-1',
    baseSha: '1234567890abcdef',
    replaceStale: false,
    now: new Date('2026-08-16T10:00:00Z'),
  });
  assert.strictEqual(readLease(lockPath).run_id, 'run-1');
  assert.strictEqual(leaseStatus(acquired, new Date('2026-08-16T10:10:00Z')), 'active');
  assert.throws(() => acquire({
    lockPath,
    ttlMinutes: 30,
    runId: 'run-2',
    baseSha: 'abcdef1234567890',
    replaceStale: false,
    now: new Date('2026-08-16T10:10:00Z'),
  }), /active/);

  const refreshed = refresh({
    lockPath,
    ttlMinutes: 30,
    runId: 'run-1',
    token: acquired.token,
    now: new Date('2026-08-16T10:20:00Z'),
  });
  assert.strictEqual(refreshed.expires_at, '2026-08-16T10:50:00.000Z');
  assert.throws(() => release({ lockPath, runId: 'wrong', token: acquired.token }), /ownership mismatch/);
  assert.deepStrictEqual(release({ lockPath, runId: 'run-1', token: acquired.token }), {
    released: true,
    run_id: 'run-1',
  });
  assert.strictEqual(fs.existsSync(lockPath), false);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('automation publisher lease tests passed');
