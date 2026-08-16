'use strict';

const assert = require('assert');
const {
  parseTomlString,
  parseWorktreePorcelain,
  hoursBetween,
  automationIdForBranch,
  sameStringSet,
  evaluatePolicy,
} = require('../scripts/automation-control-plane');

assert.strictEqual(parseTomlString('status = "ACTIVE"\nrrule = "FREQ=DAILY"\n', 'status'), 'ACTIVE');
assert.strictEqual(parseTomlString('status = "ACTIVE"\nrrule = "FREQ=DAILY"\n', 'rrule'), 'FREQ=DAILY');

assert.deepStrictEqual(parseWorktreePorcelain([
  'worktree C:/repo',
  'HEAD abcdef',
  'branch refs/heads/main',
  '',
  'worktree C:/missing',
  'HEAD 123456',
  'detached',
  'prunable gitdir file points to non-existent location',
  '',
].join('\n')), [
  {
    path: 'C:/repo',
    head: 'abcdef',
    branch: 'refs/heads/main',
    detached: false,
    locked: false,
    prunable: false,
  },
  {
    path: 'C:/missing',
    head: '123456',
    branch: null,
    detached: true,
    locked: false,
    prunable: true,
  },
]);

assert.strictEqual(hoursBetween('2026-08-16T00:00:00Z', '2026-08-16T12:00:00Z'), 12);
assert.strictEqual(
  automationIdForBranch(
    'refs/heads/automation/am-content-batch-2-2026-08-16-run',
    ['am-content-batch', 'am-content-batch-2']
  ),
  'am-content-batch-2'
);
assert.strictEqual(sameStringSet(['b', 'a'], ['a', 'b']), true);
assert.strictEqual(sameStringSet(['a'], ['a', 'b']), false);

const policy = {
  active_automation_budget: 1,
  active_automations: [{
    id: 'publisher',
    expected_schedule: 'FREQ=DAILY;BYHOUR=18',
    model: 'gpt-5.6-sol',
    reasoning_effort: 'max',
  }],
  handoffs: {
    max_ready_age_hours: 24,
    require_worktree_ownership: true,
    policy_effective_at: '2026-08-16T00:00:00Z',
  },
};
const queue = {
  ready: [],
  informational: [],
  blocked: [],
  quarantined: [],
  invalid: [],
  conflicts: [],
  duplicate_ids: [],
  dependency_issues: [],
};
const worktrees = { issues: [] };
assert.deepStrictEqual(evaluatePolicy(policy, {
  available: true,
  definitions: [{
    id: 'publisher',
    status: 'ACTIVE',
    rrule: 'FREQ=DAILY;BYHOUR=18',
    model: 'gpt-5.6-sol',
    reasoning_effort: 'max',
  }],
}, queue, worktrees, new Date('2026-08-16T12:00:00Z')), []);

const drift = evaluatePolicy(policy, {
  available: true,
  definitions: [{
    id: 'publisher',
    status: 'ACTIVE',
    rrule: 'FREQ=DAILY;BYHOUR=17',
    model: 'gpt-5.6-sol',
    reasoning_effort: 'ultra',
  }],
}, queue, worktrees, new Date('2026-08-16T12:00:00Z'));
assert.ok(drift.some((item) => item.code === 'automation_definition_drift'));

const staleQueue = {
  ...queue,
  ready: [{
    automation_id: 'producer',
    handoff_id: 'producer-old',
    created_at: '2026-08-14T00:00:00Z',
    producer: null,
  }],
};
assert.ok(evaluatePolicy(
  policy,
  { available: false, definitions: [] },
  staleQueue,
  worktrees,
  new Date('2026-08-16T12:00:00Z')
).some((item) => item.code === 'stale_ready_handoff'));

const ownershipQueue = {
  ...queue,
  ready: [{
    automation_id: 'producer',
    handoff_id: 'producer-new',
    created_at: '2026-08-16T10:00:00Z',
    producer: null,
  }],
};
assert.ok(evaluatePolicy(
  policy,
  { available: false, definitions: [] },
  ownershipQueue,
  worktrees,
  new Date('2026-08-16T12:00:00Z')
).some((item) => item.code === 'ready_handoff_missing_worktree_ownership'));

console.log('automation control-plane tests passed');
