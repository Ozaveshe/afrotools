#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { readHandoff } = require('./automation-handoff');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const options = {
    command: argv[0],
    handoffPath: null,
    worktreePath: null,
    confirm: null,
    now: new Date(),
  };
  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--handoff') options.handoffPath = path.resolve(argv[++index]);
    else if (value === '--path') options.worktreePath = path.resolve(argv[++index]);
    else if (value === '--confirm') options.confirm = argv[++index];
    else if (value === '--now') options.now = new Date(argv[++index]);
    else throw new Error('Unknown argument: ' + value);
  }
  if (!['plan', 'remove'].includes(options.command)) {
    throw new Error('Usage: automation-worktree-lifecycle <plan|remove> --handoff <file> --path <worktree> [--confirm <handoff-id>]');
  }
  if (!options.handoffPath || !options.worktreePath) throw new Error('--handoff and --path are required');
  if (Number.isNaN(options.now.getTime())) throw new Error('--now must be an ISO date-time');
  return options;
}

function runGit(args, cwd = ROOT) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    timeout: 30000,
  });
}

function normalized(value) {
  const input = String(value || '');
  const isWindowsAbsolute = path.win32.isAbsolute(input);
  const resolved = (isWindowsAbsolute ? path.win32.resolve(input) : path.resolve(input))
    .replace(/\\/g, '/')
    .replace(/\/$/, '');
  return isWindowsAbsolute || process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function parseRegisteredPaths(raw) {
  return String(raw || '').split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => normalized(line.slice('worktree '.length)));
}

function metadataIssues(item, requestedPath, now) {
  const issues = [];
  if (item.status !== 'consumed') issues.push('handoff status must be consumed');
  if (!item.producer || typeof item.producer !== 'object') issues.push('handoff lacks producer ownership metadata');
  if (!item.publisher || !item.publisher.release_commit || !item.publisher.deploy_id || !item.publisher.live_proof.length) {
    issues.push('handoff lacks exact deployed publisher proof');
  }
  if (item.producer && normalized(item.producer.worktree_path) !== normalized(requestedPath)) {
    issues.push('requested path does not exactly match producer.worktree_path');
  }
  if (item.producer && Date.parse(item.producer.cleanup_after) > now.getTime()) {
    issues.push('producer.cleanup_after has not passed');
  }
  const unsafeRoots = [path.parse(requestedPath).root, os.homedir(), ROOT].map(normalized);
  if (unsafeRoots.includes(normalized(requestedPath))) {
    issues.push('refusing to target a filesystem root, home directory, or canonical repository');
  }
  return issues;
}

function buildPlan(options) {
  const record = readHandoff(options.handoffPath);
  if (record.errors.length) throw new Error('Invalid handoff: ' + record.errors.join('; '));
  const item = record.item;
  const issues = metadataIssues(item, options.worktreePath, options.now);
  const checks = {
    handoff_id: item.handoff_id,
    requested_path: options.worktreePath,
    registered: false,
    exists: fs.existsSync(options.worktreePath),
    clean: false,
    head_exact: false,
    remote_exact: false,
    release_on_origin_main: false,
  };

  const worktrees = runGit(['worktree', 'list', '--porcelain']);
  if (worktrees.status === 0) {
    checks.registered = parseRegisteredPaths(worktrees.stdout).includes(normalized(options.worktreePath));
  }
  if (!checks.registered) issues.push('path is not a registered worktree');
  if (!checks.exists) issues.push('worktree path does not exist');

  if (checks.exists) {
    const status = runGit(['status', '--porcelain'], options.worktreePath);
    checks.clean = status.status === 0 && !String(status.stdout || '').trim();
    if (!checks.clean) issues.push('worktree is dirty or unreadable');
    const head = runGit(['rev-parse', 'HEAD'], options.worktreePath);
    checks.head_exact = head.status === 0 && String(head.stdout || '').trim() === item.commit;
    if (!checks.head_exact) issues.push('worktree HEAD does not match the producer commit');
  }

  if (item.producer && item.producer.remote_ref) {
    const remote = runGit(['ls-remote', 'origin', item.producer.remote_ref]);
    const remoteSha = remote.status === 0 ? String(remote.stdout || '').trim().split(/\s+/)[0] : null;
    checks.remote_exact = remoteSha === item.commit;
  }
  if (!checks.remote_exact) issues.push('producer remote ref does not resolve to the exact commit');

  if (item.publisher && item.publisher.release_commit) {
    checks.release_on_origin_main = runGit([
      'merge-base',
      '--is-ancestor',
      item.publisher.release_commit,
      'origin/main',
    ]).status === 0;
  }
  if (!checks.release_on_origin_main) issues.push('deployed release commit is not contained in origin/main');

  return {
    schema_version: 1,
    eligible: issues.length === 0,
    checks,
    issues,
  };
}

function execute(options) {
  const plan = buildPlan(options);
  if (options.command === 'plan') return plan;
  if (!plan.eligible) throw new Error('Worktree is not removal-eligible: ' + plan.issues.join('; '));
  if (options.confirm !== plan.checks.handoff_id) {
    throw new Error('--confirm must exactly equal ' + plan.checks.handoff_id);
  }
  const removal = runGit(['worktree', 'remove', '--', options.worktreePath]);
  if (removal.status !== 0) throw new Error(String(removal.stderr || removal.stdout || 'git worktree remove failed').trim());
  return { ...plan, removed: true };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  process.stdout.write(JSON.stringify(execute(options), null, 2) + '\n');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  parseArgs,
  normalized,
  parseRegisteredPaths,
  metadataIssues,
  buildPlan,
  execute,
};
