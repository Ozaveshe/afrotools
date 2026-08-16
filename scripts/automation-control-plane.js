#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { buildQueue, listHandoffFiles, readHandoff } = require('./automation-handoff');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_AUTOMATIONS_ROOT = 'C:/Users/Oza/.codex/automations';
const DEFAULT_POLICY_PATH = path.join(ROOT, 'data', 'automation', 'control-plane-policy.json');

function parseArgs(argv) {
  const options = {
    automationsRoot: process.env.CODEX_AUTOMATIONS_DIR || DEFAULT_AUTOMATIONS_ROOT,
    policyPath: DEFAULT_POLICY_PATH,
    strict: false,
    json: false,
    write: false,
    deepWorktrees: false,
    skipWorktrees: false,
    skipRemote: false,
    now: new Date(),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--strict') options.strict = true;
    else if (value === '--json') options.json = true;
    else if (value === '--write') options.write = true;
    else if (value === '--deep-worktrees') options.deepWorktrees = true;
    else if (value === '--no-worktrees') options.skipWorktrees = true;
    else if (value === '--no-remote') options.skipRemote = true;
    else if (value === '--automations-root') options.automationsRoot = path.resolve(argv[++index]);
    else if (value === '--policy') options.policyPath = path.resolve(argv[++index]);
    else if (value === '--now') options.now = new Date(argv[++index]);
    else throw new Error('Unknown argument: ' + value);
  }
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

function parseTomlString(raw, key) {
  const escapedKey = key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const match = raw.match(new RegExp('^' + escapedKey + '\\s*=\\s*"([^"]*)"', 'm'));
  return match ? match[1] : null;
}

function readAutomationDefinitions(automationsRoot) {
  if (!fs.existsSync(automationsRoot)) return { available: false, definitions: [] };
  const definitions = [];
  for (const entry of fs.readdirSync(automationsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(automationsRoot, entry.name, 'automation.toml');
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    definitions.push({
      id: parseTomlString(raw, 'id') || entry.name,
      name: parseTomlString(raw, 'name'),
      status: parseTomlString(raw, 'status'),
      rrule: parseTomlString(raw, 'rrule'),
      model: parseTomlString(raw, 'model'),
      reasoning_effort: parseTomlString(raw, 'reasoning_effort'),
      file: filePath,
    });
  }
  return { available: true, definitions };
}

function parseWorktreePorcelain(raw) {
  const entries = [];
  let current = null;
  for (const line of String(raw || '').split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      if (current) entries.push(current);
      current = {
        path: line.slice('worktree '.length),
        head: null,
        branch: null,
        detached: false,
        locked: false,
        prunable: false,
      };
    } else if (!current) {
      continue;
    } else if (line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length);
    } else if (line === 'detached') {
      current.detached = true;
    } else if (line.startsWith('locked')) {
      current.locked = true;
    } else if (line.startsWith('prunable')) {
      current.prunable = true;
    }
  }
  if (current) entries.push(current);
  return entries;
}

function hoursBetween(older, newer) {
  const olderMs = new Date(older).getTime();
  const newerMs = new Date(newer).getTime();
  if (!Number.isFinite(olderMs) || !Number.isFinite(newerMs)) return null;
  return Math.max(0, (newerMs - olderMs) / 3600000);
}

function automationIdForBranch(branch, automationIds) {
  if (!branch) return null;
  const prefix = 'refs/heads/automation/';
  if (!branch.startsWith(prefix)) return null;
  const short = branch.slice(prefix.length);
  return automationIds
    .slice()
    .sort((left, right) => right.length - left.length)
    .find((id) => short === id || short.startsWith(id + '-')) || null;
}

function inspectWorktrees(options, policy, queue, definitions) {
  if (options.skipWorktrees) return { available: false, entries: [], counts: {}, issues: [], cleanup_candidates: [] };
  const list = runGit(['worktree', 'list', '--porcelain']);
  if (list.status !== 0) {
    return {
      available: false,
      entries: [],
      counts: {},
      cleanup_candidates: [],
      issues: [{ severity: 'error', code: 'worktree_list_failed', detail: String(list.stderr || list.error || '').trim() }],
    };
  }

  const automationIds = definitions.map((item) => item.id);
  const activeIds = new Set(policy.active_automations.map((item) => item.id));
  const readyCommits = new Set(queue.ready.map((item) => item.commit));
  const handoffByAutomation = new Map();
  for (const item of [...queue.ready, ...queue.informational, ...queue.blocked, ...queue.quarantined]) {
    handoffByAutomation.set(item.automation_id, item);
  }
  const issues = [];
  const cleanupCandidates = [];
  const entries = parseWorktreePorcelain(list.stdout).map((entry) => {
    const exists = fs.existsSync(entry.path);
    const automationId = automationIdForBranch(entry.branch, automationIds);
    const isAutomation = !!automationId || !!(entry.branch && entry.branch.startsWith('refs/heads/automation/'));
    const activeAutomation = automationId ? activeIds.has(automationId) : false;
    let commitDate = null;
    let ageHours = null;
    let dirty = null;
    let mergedIntoMain = null;

    if (entry.head && (options.deepWorktrees || isAutomation)) {
      const show = runGit(['show', '-s', '--format=%cI', entry.head]);
      if (show.status === 0) {
        commitDate = String(show.stdout || '').trim() || null;
        ageHours = commitDate ? hoursBetween(commitDate, options.now) : null;
      }
    }
    if (exists && (options.deepWorktrees || isAutomation)) {
      const status = runGit(['status', '--porcelain'], entry.path);
      if (status.status === 0) dirty = !!String(status.stdout || '').trim();
    }
    if (entry.head && isAutomation) {
      const ancestor = runGit(['merge-base', '--is-ancestor', entry.head, 'origin/main']);
      mergedIntoMain = ancestor.status === 0;
    }

    const result = {
      ...entry,
      exists,
      automation_id: automationId,
      active_automation: activeAutomation,
      commit_date: commitDate,
      age_hours: ageHours,
      dirty,
      merged_into_origin_main: mergedIntoMain,
    };

    if (entry.prunable) {
      issues.push({ severity: 'warning', code: 'prunable_worktree', path: entry.path, detail: 'Git metadata points to a missing worktree path.' });
    }
    if (isAutomation && ageHours !== null && dirty === true && ageHours >= policy.worktrees.dirty_stranded_age_hours && !readyCommits.has(entry.head)) {
      issues.push({
        severity: 'error',
        code: 'stranded_dirty_automation_worktree',
        path: entry.path,
        automation_id: automationId,
        detail: 'Dirty automation worktree is ' + Math.floor(ageHours) + 'h old and has no current ready handoff.',
      });
    }
    if (isAutomation && ageHours !== null && dirty === false && ageHours >= policy.worktrees.clean_cleanup_age_hours) {
      const receipt = automationId ? handoffByAutomation.get(automationId) : null;
      cleanupCandidates.push({
        path: entry.path,
        branch: entry.branch,
        head: entry.head,
        automation_id: automationId,
        reason: mergedIntoMain
          ? 'clean and already contained in origin/main'
          : (receipt && ['consumed', 'no_change', 'quarantined'].includes(receipt.status)
            ? 'clean and current receipt is terminal'
            : 'clean automation worktree older than lifecycle threshold; review remote branch before removal'),
      });
    }
    return result;
  });

  const activeAutomationWorktrees = entries.filter((item) => item.active_automation && item.exists && !item.prunable);
  if (entries.length > policy.worktrees.warn_total) {
    issues.push({
      severity: 'warning',
      code: 'worktree_budget_exceeded',
      detail: entries.length + ' registered worktrees exceeds the warning budget of ' + policy.worktrees.warn_total + '.',
    });
  }
  if (activeAutomationWorktrees.length > policy.worktrees.max_active_automation_worktrees) {
    issues.push({
      severity: 'error',
      code: 'active_automation_worktree_budget_exceeded',
      detail: activeAutomationWorktrees.length + ' active-lane worktrees exceeds the hard budget of ' + policy.worktrees.max_active_automation_worktrees + '.',
    });
  }

  return {
    available: true,
    entries,
    cleanup_candidates: cleanupCandidates,
    issues,
    counts: {
      total: entries.length,
      existing: entries.filter((item) => item.exists).length,
      prunable: entries.filter((item) => item.prunable).length,
      locked: entries.filter((item) => item.locked).length,
      detached: entries.filter((item) => item.detached).length,
      automation: entries.filter((item) => item.branch && item.branch.startsWith('refs/heads/automation/')).length,
      active_automation: activeAutomationWorktrees.length,
      dirty_inspected: entries.filter((item) => item.dirty === true).length,
      cleanup_candidates: cleanupCandidates.length,
    },
  };
}

function loadQueue(automationsRoot) {
  if (!fs.existsSync(automationsRoot)) {
    return {
      available: false,
      ready: [],
      informational: [],
      blocked: [],
      quarantined: [],
      invalid: [],
      conflicts: [],
      duplicate_ids: [],
      dependency_issues: [],
    };
  }
  const records = listHandoffFiles(automationsRoot).map((filePath) => {
    try {
      const record = readHandoff(filePath);
      const folderId = path.basename(path.dirname(filePath));
      if (record.item.automation_id !== folderId) {
        record.errors.push('automation_id must match the automation folder ' + folderId);
      }
      return record;
    } catch (error) {
      return { filePath, item: null, errors: ['invalid JSON: ' + error.message] };
    }
  });
  return { available: true, ...buildQueue(records) };
}

function sameStringSet(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size && Array.from(leftSet).every((item) => rightSet.has(item));
}

function verifyReadyHandoffs(queue, options) {
  if (options.skipRemote) return { available: false, checks: [], issues: [] };
  const checks = [];
  const issues = [];
  for (const item of queue.ready) {
    const remoteRef = 'refs/heads/' + item.branch;
    const remote = runGit(['ls-remote', 'origin', remoteRef]);
    const remoteSha = remote.status === 0 ? String(remote.stdout || '').trim().split(/\s+/)[0] : null;
    const check = {
      handoff_id: item.handoff_id,
      automation_id: item.automation_id,
      branch: item.branch,
      commit: item.commit,
      remote_ref: remoteRef,
      remote_commit: remoteSha,
      remote_exact: remoteSha === item.commit,
      base_ancestor: false,
      diff_exact: false,
      actual_changed_files: [],
    };
    if (!check.remote_exact) {
      issues.push({
        severity: 'error',
        code: 'ready_handoff_remote_mismatch',
        automation_id: item.automation_id,
        handoff_id: item.handoff_id,
        detail: 'Remote ' + remoteRef + ' resolves to ' + (remoteSha || 'nothing') + ', expected ' + item.commit + '.',
      });
      checks.push(check);
      continue;
    }
    let commitObject = runGit(['cat-file', '-e', item.commit + '^{commit}']);
    if (commitObject.status !== 0) {
      runGit(['fetch', '--quiet', 'origin', item.branch]);
      commitObject = runGit(['cat-file', '-e', item.commit + '^{commit}']);
    }
    const baseObject = runGit(['cat-file', '-e', item.base_sha + '^{commit}']);
    if (commitObject.status !== 0 || baseObject.status !== 0) {
      issues.push({
        severity: 'error',
        code: 'ready_handoff_commit_unavailable',
        automation_id: item.automation_id,
        handoff_id: item.handoff_id,
        detail: 'Base or producer commit is unavailable after fetching the exact remote branch.',
      });
      checks.push(check);
      continue;
    }
    check.base_ancestor = runGit(['merge-base', '--is-ancestor', item.base_sha, item.commit]).status === 0;
    const diff = runGit(['diff', '--name-only', item.base_sha, item.commit]);
    check.actual_changed_files = diff.status === 0
      ? String(diff.stdout || '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean).sort()
      : [];
    check.diff_exact = diff.status === 0 && sameStringSet(check.actual_changed_files, item.changed_files);
    if (!check.base_ancestor) {
      issues.push({
        severity: 'error',
        code: 'ready_handoff_base_not_ancestor',
        automation_id: item.automation_id,
        handoff_id: item.handoff_id,
        detail: item.base_sha + ' is not an ancestor of ' + item.commit + '.',
      });
    }
    if (!check.diff_exact) {
      issues.push({
        severity: 'error',
        code: 'ready_handoff_diff_mismatch',
        automation_id: item.automation_id,
        handoff_id: item.handoff_id,
        detail: 'Actual base-to-commit files do not exactly match changed_files.',
      });
    }
    checks.push(check);
  }
  return { available: true, checks, issues };
}

function evaluatePolicy(policy, definitionsResult, queue, worktrees, now = new Date()) {
  const issues = [];
  const expected = new Map(policy.active_automations.map((item) => [item.id, item]));
  if (policy.active_automations.length > policy.active_automation_budget) {
    issues.push({
      severity: 'error',
      code: 'policy_budget_exceeded',
      detail: policy.active_automations.length + ' policy lanes exceeds budget ' + policy.active_automation_budget + '.',
    });
  }

  if (!definitionsResult.available) {
    issues.push({ severity: 'warning', code: 'automation_definitions_unavailable', detail: 'Codex automation definitions are unavailable in this environment.' });
  } else {
    const active = definitionsResult.definitions.filter((item) => item.status === 'ACTIVE');
    if (active.length > policy.active_automation_budget) {
      issues.push({
        severity: 'error',
        code: 'active_automation_budget_exceeded',
        detail: active.length + ' active definitions exceeds budget ' + policy.active_automation_budget + '.',
      });
    }
    for (const definition of active) {
      if (!expected.has(definition.id)) {
        issues.push({ severity: 'error', code: 'unexpected_active_automation', automation_id: definition.id, detail: 'Active lane is not allowlisted by policy.' });
      }
    }
    for (const lane of policy.active_automations) {
      const definition = definitionsResult.definitions.find((item) => item.id === lane.id);
      if (!definition || definition.status !== 'ACTIVE') {
        issues.push({ severity: 'error', code: 'expected_automation_inactive', automation_id: lane.id, detail: 'Required lane is missing or paused.' });
        continue;
      }
      for (const [actualKey, expectedKey] of [['rrule', 'expected_schedule'], ['model', 'model'], ['reasoning_effort', 'reasoning_effort']]) {
        if (definition[actualKey] !== lane[expectedKey]) {
          issues.push({
            severity: 'warning',
            code: 'automation_definition_drift',
            automation_id: lane.id,
            detail: actualKey + ' is ' + JSON.stringify(definition[actualKey]) + ', expected ' + JSON.stringify(lane[expectedKey]) + '.',
          });
        }
      }
    }
  }

  for (const [field, code] of [
    ['invalid', 'invalid_handoff'],
    ['conflicts', 'handoff_conflict'],
    ['duplicate_ids', 'duplicate_handoff_id'],
    ['dependency_issues', 'handoff_dependency_issue'],
  ]) {
    if (queue[field].length) {
      issues.push({ severity: 'error', code, detail: queue[field].length + ' ' + field.replace(/_/g, ' ') + ' found.' });
    }
  }
  for (const item of queue.ready) {
    const ageHours = hoursBetween(item.created_at, now);
    if (ageHours !== null && ageHours > policy.handoffs.max_ready_age_hours) {
      issues.push({
        severity: 'error',
        code: 'stale_ready_handoff',
        automation_id: item.automation_id,
        handoff_id: item.handoff_id,
        detail: 'Ready receipt is ' + Math.floor(ageHours) + 'h old; budget is ' + policy.handoffs.max_ready_age_hours + 'h.',
      });
    }
    if (
      policy.handoffs.require_worktree_ownership
      && Date.parse(item.created_at) >= Date.parse(policy.handoffs.policy_effective_at)
      && (!item.producer || typeof item.producer !== 'object')
    ) {
      issues.push({
        severity: 'error',
        code: 'ready_handoff_missing_worktree_ownership',
        automation_id: item.automation_id,
        handoff_id: item.handoff_id,
        detail: 'Ready receipt was created after the control-plane policy cutoff and lacks producer worktree ownership.',
      });
    }
  }
  if (queue.verification) issues.push(...queue.verification.issues);
  issues.push(...worktrees.issues);
  return issues;
}

function toMarkdown(report) {
  const lines = [
    '# Automation Control Plane',
    '',
    'Generated: ' + report.generated_at,
    '',
    '## Summary',
    '',
    '- Active definitions: ' + (report.automations.available ? report.automations.active_count : 'unavailable') + ' / budget ' + report.policy.active_automation_budget,
    '- Queue: ready=' + report.queue.counts.ready + ', invalid=' + report.queue.counts.invalid + ', conflicts=' + report.queue.counts.conflicts + ', dependency issues=' + report.queue.counts.dependency_issues,
    '- Worktrees: total=' + (report.worktrees.counts.total ?? 'unavailable') + ', active automation=' + (report.worktrees.counts.active_automation ?? 'unavailable') + ', cleanup candidates=' + (report.worktrees.counts.cleanup_candidates ?? 'unavailable'),
    '- Issues: errors=' + report.counts.errors + ', warnings=' + report.counts.warnings,
    '',
    '## Issues',
    '',
  ];
  if (!report.issues.length) lines.push('- None.');
  else report.issues.forEach((item) => lines.push('- [' + item.severity.toUpperCase() + '] ' + item.code + ': ' + item.detail));
  lines.push('', '## Cleanup Candidates', '');
  if (!report.worktrees.cleanup_candidates.length) lines.push('- None.');
  else report.worktrees.cleanup_candidates.forEach((item) => lines.push('- ' + item.path + ': ' + item.reason + '.'));
  lines.push('');
  return lines.join('\n');
}

function buildReport(options) {
  const policy = JSON.parse(fs.readFileSync(options.policyPath, 'utf8'));
  const definitionsResult = readAutomationDefinitions(options.automationsRoot);
  const queue = loadQueue(options.automationsRoot);
  queue.verification = verifyReadyHandoffs(queue, options);
  const worktrees = inspectWorktrees(options, policy, queue, definitionsResult.definitions);
  const issues = evaluatePolicy(policy, definitionsResult, queue, worktrees, options.now);
  const activeDefinitions = definitionsResult.definitions.filter((item) => item.status === 'ACTIVE');
  return {
    schema_version: 1,
    generated_at: options.now.toISOString(),
    policy: {
      path: path.relative(ROOT, options.policyPath).replace(/\\/g, '/'),
      active_automation_budget: policy.active_automation_budget,
      expected_active_ids: policy.active_automations.map((item) => item.id),
    },
    automations: {
      available: definitionsResult.available,
      active_count: activeDefinitions.length,
      active_ids: activeDefinitions.map((item) => item.id).sort(),
    },
    queue: {
      available: queue.available,
      counts: {
        ready: queue.ready.length,
        informational: queue.informational.length,
        blocked: queue.blocked.length,
        quarantined: queue.quarantined.length,
        invalid: queue.invalid.length,
        conflicts: queue.conflicts.length,
        duplicate_ids: queue.duplicate_ids.length,
        dependency_issues: queue.dependency_issues.length,
      },
      ready: queue.ready.map((item) => ({
        handoff_id: item.handoff_id,
        automation_id: item.automation_id,
        created_at: item.created_at,
        commit: item.commit,
      })),
      remote_verification: queue.verification,
    },
    worktrees,
    issues,
    counts: {
      errors: issues.filter((item) => item.severity === 'error').length,
      warnings: issues.filter((item) => item.severity === 'warning').length,
    },
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = buildReport(options);
  if (options.write) {
    const reportDir = path.join(ROOT, 'reports');
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, 'automation-control-plane-latest.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(reportDir, 'automation-control-plane-latest.md'), toMarkdown(report) + '\n');
  }
  if (options.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else {
    console.log('AfroTools automation control plane');
    console.log('- Active definitions: ' + (report.automations.available ? report.automations.active_count : 'unavailable') + ' / ' + report.policy.active_automation_budget);
    console.log('- Queue: ready=' + report.queue.counts.ready + ' invalid=' + report.queue.counts.invalid + ' conflicts=' + report.queue.counts.conflicts + ' dependency_issues=' + report.queue.counts.dependency_issues);
    console.log('- Worktrees: total=' + (report.worktrees.counts.total ?? 'unavailable') + ' active_automation=' + (report.worktrees.counts.active_automation ?? 'unavailable') + ' cleanup_candidates=' + (report.worktrees.counts.cleanup_candidates ?? 'unavailable'));
    console.log('- Issues: errors=' + report.counts.errors + ' warnings=' + report.counts.warnings);
    report.issues.slice(0, 12).forEach((item) => console.log('  - [' + item.severity.toUpperCase() + '] ' + item.code + ': ' + item.detail));
  }
  if (options.strict && report.counts.errors) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

module.exports = {
  parseArgs,
  parseTomlString,
  parseWorktreePorcelain,
  hoursBetween,
  automationIdForBranch,
  sameStringSet,
  verifyReadyHandoffs,
  evaluatePolicy,
  buildReport,
};
