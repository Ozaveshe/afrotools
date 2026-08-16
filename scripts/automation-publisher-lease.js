#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const POLICY = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'automation', 'control-plane-policy.json'), 'utf8'));

function parseArgs(argv) {
  const command = argv[0];
  const options = {
    command,
    lockPath: POLICY.publisher_lease.path,
    ttlMinutes: POLICY.publisher_lease.ttl_minutes,
    runId: null,
    token: null,
    baseSha: null,
    replaceStale: false,
    now: new Date(),
  };
  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--lock') options.lockPath = path.resolve(argv[++index]);
    else if (value === '--ttl-minutes') options.ttlMinutes = Number(argv[++index]);
    else if (value === '--run-id') options.runId = argv[++index];
    else if (value === '--token') options.token = argv[++index];
    else if (value === '--base-sha') options.baseSha = argv[++index];
    else if (value === '--replace-stale') options.replaceStale = true;
    else if (value === '--now') options.now = new Date(argv[++index]);
    else throw new Error('Unknown argument: ' + value);
  }
  if (!['acquire', 'refresh', 'release', 'status'].includes(command)) {
    throw new Error('Usage: automation-publisher-lease <acquire|refresh|release|status> [options]');
  }
  if (!Number.isFinite(options.ttlMinutes) || options.ttlMinutes < 1) throw new Error('--ttl-minutes must be a positive number');
  if (Number.isNaN(options.now.getTime())) throw new Error('--now must be an ISO date-time');
  return options;
}

function readLease(lockPath) {
  if (!fs.existsSync(lockPath)) return null;
  const lease = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (!lease || lease.schema_version !== 1 || !lease.run_id || !lease.token || !lease.expires_at) {
    throw new Error('Publisher lease is malformed: ' + lockPath);
  }
  return lease;
}

function leaseStatus(lease, now = new Date()) {
  if (!lease) return 'absent';
  return Date.parse(lease.expires_at) <= now.getTime() ? 'stale' : 'active';
}

function writeExclusive(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const handle = fs.openSync(filePath, 'wx');
  try {
    fs.writeFileSync(handle, JSON.stringify(value, null, 2) + '\n');
  } finally {
    fs.closeSync(handle);
  }
}

function writeAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = filePath + '.tmp-' + process.pid + '-' + Date.now();
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  fs.renameSync(temporary, filePath);
}

function assertOwner(lease, options) {
  if (!options.runId || !options.token) throw new Error('--run-id and --token are required');
  if (lease.run_id !== options.runId || lease.token !== options.token) {
    throw new Error('Publisher lease ownership mismatch');
  }
}

function acquire(options) {
  const current = readLease(options.lockPath);
  const status = leaseStatus(current, options.now);
  if (status === 'active') {
    const error = new Error('Publisher lease is active for run ' + current.run_id + ' until ' + current.expires_at);
    error.exitCode = 2;
    throw error;
  }
  if (status === 'stale' && !options.replaceStale) {
    const error = new Error('Publisher lease is stale. Verify no publisher/build/deploy process remains, then retry with --replace-stale.');
    error.exitCode = 3;
    throw error;
  }
  if (!options.runId || !options.baseSha) throw new Error('acquire requires --run-id and --base-sha');
  if (status === 'stale') {
    const stalePath = options.lockPath.replace(/\.json$/i, '') + '.stale.json';
    writeAtomic(stalePath, current);
    fs.unlinkSync(options.lockPath);
  }
  const acquiredAt = options.now.toISOString();
  const lease = {
    schema_version: 1,
    run_id: options.runId,
    token: crypto.randomUUID(),
    base_sha: options.baseSha,
    acquired_at: acquiredAt,
    refreshed_at: acquiredAt,
    expires_at: new Date(options.now.getTime() + options.ttlMinutes * 60000).toISOString(),
  };
  writeExclusive(options.lockPath, lease);
  return lease;
}

function refresh(options) {
  const lease = readLease(options.lockPath);
  if (!lease) throw new Error('Publisher lease does not exist');
  assertOwner(lease, options);
  if (leaseStatus(lease, options.now) !== 'active') throw new Error('Publisher lease is stale and cannot be refreshed');
  const refreshed = {
    ...lease,
    refreshed_at: options.now.toISOString(),
    expires_at: new Date(options.now.getTime() + options.ttlMinutes * 60000).toISOString(),
  };
  writeAtomic(options.lockPath, refreshed);
  return refreshed;
}

function release(options) {
  const lease = readLease(options.lockPath);
  if (!lease) return { released: false, status: 'absent' };
  assertOwner(lease, options);
  fs.unlinkSync(options.lockPath);
  return { released: true, run_id: lease.run_id };
}

function execute(options) {
  if (options.command === 'acquire') return acquire(options);
  if (options.command === 'refresh') return refresh(options);
  if (options.command === 'release') return release(options);
  const lease = readLease(options.lockPath);
  return { status: leaseStatus(lease, options.now), lease };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = execute(options);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = error.exitCode || 1;
  }
}

module.exports = {
  parseArgs,
  readLease,
  leaseStatus,
  acquire,
  refresh,
  release,
  execute,
};
