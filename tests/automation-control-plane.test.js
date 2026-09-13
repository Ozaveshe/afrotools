'use strict';

const assert = require('assert');
const {
  parseTomlString,
  parseWorktreePorcelain,
  hoursBetween,
  automationIdForBranch,
  sameStringSet,
  evaluatePolicy,
  parseArgs,
  selectReleaseQueue,
  validateRevalidation,
  releaseIssueBlocks,
  evaluateRelease,
} = require('../scripts/automation-control-plane');
const { buildQueue, validateHandoff } = require('../scripts/automation-handoff');

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

const heartbeatPolicy = {...policy,active_automations:[{id:'image-intake',kind:'heartbeat',expected_schedule:'FREQ=DAILY'}]};
const heartbeatDefinitions={available:true,definitions:[{id:'image-intake',kind:'heartbeat',target_thread_id:'synthetic-task',status:'ACTIVE',rrule:'FREQ=DAILY'}]};
assert.deepStrictEqual(evaluatePolicy(heartbeatPolicy,heartbeatDefinitions,queue,worktrees),[],'heartbeat inherits model rather than failing cron model checks');
heartbeatDefinitions.definitions[0].target_thread_id=null;
assert.ok(evaluatePolicy(heartbeatPolicy,heartbeatDefinitions,queue,worktrees).some(i=>i.code==='automation_kind_mismatch'));
assert.ok(drift.every(i=>i.severity==='error'),'strict policy must fail for schedule/model drift');

// September 12 deadlock: a missing observer and preserved completed/ready
// worktrees must stay visible as health errors without vetoing selected sources.
const releasePolicy = {
  ...policy,
  active_automation_budget: 2,
  active_automations: [
    { ...policy.active_automations[0], role: 'publisher' },
    { id: 'observer', kind: 'heartbeat', role: 'observer', expected_schedule: 'FREQ=HOURLY;INTERVAL=1' },
  ],
};
const releaseDefinitions = { available: true, definitions: [{
  id: 'publisher', status: 'ACTIVE', kind: 'cron', rrule: 'FREQ=DAILY;BYHOUR=18',
  model: 'gpt-5.6-sol', reasoning_effort: 'max',
}] };
const protectedWorktrees = { issues: [{ severity: 'error', code: 'active_automation_worktree_budget_exceeded', detail: '12 protected worktrees exceed cap 8.' }] };
const mainSha = 'a'.repeat(40);
const releaseOptions = { handoffIds: ['good-run'], publisherId: 'publisher', currentMainSha: mainSha, now: new Date('2026-08-16T12:00:00Z') };
function receipt(id, overrides = {}) {
  return {
    schema_version: 1, handoff_id: id, automation_id: 'producer', run_id: id,
    created_at: '2026-08-16T10:00:00Z', updated_at: '2026-08-16T10:00:00Z',
    status: 'ready', change_kind: 'repository', summary: id, merge_candidate: true,
    base_sha: 'b'.repeat(40), commit: 'c'.repeat(40), branch: 'automation/producer-' + id,
    changed_files: [id + '.html'], source_files: [id + '.html'], generated_files: [], conflict_keys: [], dependencies: [], live_mutations: [],
    validations: [{ command: 'targeted validation', status: 'pass', summary: 'pass' }],
    producer: { worktree_path: 'C:/safe/' + id, base_fetched_at: '2026-08-16T09:00:00Z', cleanup_after: '2026-08-17T12:00:00Z', remote_ref: 'refs/heads/automation/producer-' + id },
    publisher: { live_proof: [] },
    risk: { level: 'low', reasons: [], touches_routes: false, touches_auth: false, touches_database: false, touches_generated_output: false },
    ...overrides,
  };
}
function releaseQueue(items, verificationIssues = [], overrides = {}) {
  const records = items.map((item) => ({ item, errors: validateHandoff(item), filePath: item.handoff_id + '.json' }));
  return { available: true, records, ...buildQueue(records), verification: {
    available: true,
    issues: verificationIssues,
    checks: items.filter((item) => item.status === 'ready').map((item) => ({
      handoff_id: item.handoff_id, remote_exact: true, base_ancestor: true, diff_exact: true, source_patch_sha256: 'd'.repeat(64),
    })),
  }, ...overrides };
}
const good = receipt('good-run');
const originalQueue = releaseQueue([good]);
const deadlockHealth = evaluatePolicy(releasePolicy, releaseDefinitions, originalQueue, protectedWorktrees, releaseOptions.now);
assert.ok(deadlockHealth.some((issue) => issue.code === 'expected_automation_inactive'));
assert.ok(deadlockHealth.some((issue) => issue.code === 'active_automation_worktree_budget_exceeded'));
const recovered = evaluateRelease(releasePolicy, releaseDefinitions, originalQueue, protectedWorktrees, releaseOptions);
assert.strictEqual(recovered.ready, true);
assert.strictEqual(recovered.maintenance_issues.filter((issue) => issue.severity === 'error').length, 2);
assert.strictEqual(evaluateRelease(releasePolicy, { available: true, definitions: [] }, originalQueue, protectedWorktrees, releaseOptions).ready, false, 'missing release publisher blocks');
assert.strictEqual(evaluateRelease(releasePolicy, { available: false, definitions: [] }, originalQueue, protectedWorktrees, releaseOptions).ready, false, 'unavailable definitions cannot prove publisher');
assert.strictEqual(releaseIssueBlocks({ severity: 'error', code: 'future_security_failure' }, 'publisher'), true, 'unknown failures fail closed');

const remoteFailure = { severity: 'error', code: 'ready_handoff_remote_mismatch', handoff_id: 'bad-run', detail: 'Wrong remote commit.' };
const mixed = releaseQueue([good, receipt('bad-run')], [remoteFailure]);
const isolated = evaluateRelease(releasePolicy, releaseDefinitions, mixed, protectedWorktrees, releaseOptions);
assert.strictEqual(isolated.ready, true, 'unselected remote failure does not poison valid sources');
assert.deepStrictEqual(isolated.isolated_ready_handoff_ids, ['bad-run']);
assert.ok(evaluatePolicy(releasePolicy, releaseDefinitions, mixed, protectedWorktrees, releaseOptions.now).some((issue) => issue === remoteFailure), 'full health still reports isolated failure');
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, mixed, protectedWorktrees, { ...releaseOptions, handoffIds: ['bad-run'] }).ready, false);
const missingOwnership = releaseQueue([receipt('good-run', { producer: null })]);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, missingOwnership, protectedWorktrees, releaseOptions).ready, false, 'selected source ownership remains mandatory');
const failedValidation = releaseQueue([receipt('good-run', { validations: [{ command: 'test', status: 'fail', summary: 'broken' }] })]);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, failedValidation, protectedWorktrees, releaseOptions).ready, false, 'invalid selected receipt cannot enter the release');
const unavailableRemote = { ...originalQueue, verification: { available: false, checks: [], issues: [] } };
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, unavailableRemote, protectedWorktrees, releaseOptions).ready, false);
for (const flag of ['remote_exact', 'base_ancestor', 'diff_exact']) {
  const candidateQueue = releaseQueue([good]);
  candidateQueue.verification.checks[0][flag] = false;
  assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, candidateQueue, protectedWorktrees, releaseOptions).ready, false, flag + ' is mandatory even without an issue row');
}

const am = receipt('am-run', { changed_files: ['blog/index.html'], source_files: ['blog/index.html'], conflict_keys: ['blog:hub'] });
const pm = receipt('pm-run', { changed_files: ['blog/index.html'], source_files: ['blog/index.html'], conflict_keys: ['blog:hub'], dependencies: ['am-run'] });
const blogQueue = releaseQueue([pm, am]);
const blogOptions = { ...releaseOptions, handoffIds: ['pm-run', 'am-run'] };
assert.deepStrictEqual(selectReleaseQueue(blogQueue.records, blogOptions.handoffIds).ready.map((item) => item.handoff_id), ['am-run', 'pm-run']);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, blogQueue, protectedWorktrees, blogOptions).ready, true);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, blogQueue, protectedWorktrees, { ...blogOptions, handoffIds: ['pm-run'] }).ready, false, 'ready dependencies must be explicitly selected');
const conflictQueue = releaseQueue([am, { ...pm, dependencies: [] }]);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, conflictQueue, protectedWorktrees, blogOptions).ready, false, 'unrelated selected overlaps block');
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, conflictQueue, protectedWorktrees, { ...blogOptions, handoffIds: ['am-run'] }).ready, true, 'conflicts are recomputed for the selected set');
const cycleQueue = releaseQueue([{ ...am, dependencies: ['pm-run'] }, pm]);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, cycleQueue, protectedWorktrees, blogOptions).ready, false, 'dependency cycles still block');
const consumedAm = { ...am, status: 'consumed', merge_candidate: false, publisher: {
  consumed_at: '2026-08-16T11:00:00Z', release_commit: mainSha, deploy_id: 'verified-deploy', live_proof: ['https://example.com/proof'],
} };
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([consumedAm, pm]), protectedWorktrees, { ...blogOptions, handoffIds: ['pm-run'] }).ready, true, 'validated consumed dependencies need not be selected again');
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([good, good]), protectedWorktrees, releaseOptions).ready, false, 'duplicate selected identities block');
const unknownIssue = { severity: 'error', code: 'new_integrity_check', handoff_id: 'good-run', detail: 'Unclassified failure.' };
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([good], [unknownIssue]), protectedWorktrees, releaseOptions).ready, false);
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([receipt('good-run', { created_at: '2026-08-17T10:00:00Z', updated_at: '2026-08-17T10:00:00Z' })]), protectedWorktrees, releaseOptions).ready, false, 'future created_at cannot avoid freshness checks');

// Revalidation extends review freshness, never changes producer/source identity.
const aged = receipt('good-run', { created_at: '2026-08-14T10:00:00Z' });
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([aged]), protectedWorktrees, releaseOptions).ready, false);
const evidence = {
  handoff_id: aged.handoff_id, commit: aged.commit, base_sha: aged.base_sha, current_main_sha: mainSha,
  source_patch_sha256: 'd'.repeat(64), reviewed_at: '2026-08-16T11:00:00Z',
  checks: ['primary_sources', 'source_patch', 'targeted_validation'].map((name) => ({ name, status: 'pass', evidence: 'runs/recovery/' + name + '.json' })),
};
const reviewed = { ...aged, publisher: { ...aged.publisher, revalidation: evidence } };
const reviewedQueue = releaseQueue([reviewed]);
assert.deepStrictEqual(validateRevalidation(reviewed, reviewedQueue.verification.checks[0], mainSha, releaseOptions.now, 24), []);
const freshReview = evaluateRelease(releasePolicy, releaseDefinitions, reviewedQueue, protectedWorktrees, releaseOptions);
assert.strictEqual(freshReview.ready, true);
assert.deepStrictEqual(freshReview.revalidated_handoff_ids, ['good-run']);
const legacyReviewed = { ...reviewed, producer: null };
// Simulate historical ingestion, which deliberately permits absent legacy
// metadata so it can remain visible and be reconciled with consumed history.
const legacyRecord = { item: legacyReviewed, errors: [], filePath: 'legacy-ready.json' };
const legacyQueue = { ...releaseQueue([reviewed]), records: [legacyRecord], ...buildQueue([legacyRecord]) };
assert.ok(selectReleaseQueue(legacyQueue.records, releaseOptions.handoffIds).invalid.length,
  'release selection revalidates legacy ready records under the current contract');
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, legacyQueue, protectedWorktrees, releaseOptions).ready, false,
  'fresh review cannot release pre-policy receipts without producer ownership');
const legacyMalformedRecord = { ...legacyRecord, item: { ...reviewed, validations: [{ command: 'test', status: 'fail', summary: 'old failure' }] } };
assert.ok(selectReleaseQueue([legacyMalformedRecord], releaseOptions.handoffIds).invalid.length,
  'release selection does not trust historical ingestion to validate candidate checks');
const reviewedBadSource = releaseQueue([reviewed]);
reviewedBadSource.verification.checks[0].diff_exact = false;
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, reviewedBadSource, protectedWorktrees, releaseOptions).ready, false, 'fresh review never waives the source allowlist');
assert.ok(evaluatePolicy(releasePolicy, releaseDefinitions, reviewedQueue, protectedWorktrees, releaseOptions.now).some((issue) => issue.code === 'stale_ready_handoff'), 'default health policy and original created_at stay unchanged');
for (const [field, value] of [
  ['handoff_id', 'different-id'], ['commit', 'e'.repeat(40)], ['base_sha', 'e'.repeat(40)],
  ['current_main_sha', 'e'.repeat(40)], ['source_patch_sha256', 'e'.repeat(64)],
  ['reviewed_at', '2026-08-15T10:00:00Z'], ['reviewed_at', '2026-08-17T10:00:00Z'], ['reviewed_at', 'invalid'],
]) {
  const invalid = { ...reviewed, publisher: { ...reviewed.publisher, revalidation: { ...evidence, [field]: value } } };
  assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([invalid]), protectedWorktrees, releaseOptions).ready, false, 'reject mismatched/expired revalidation ' + field);
}
const noPrimary = { ...reviewed, publisher: { ...reviewed.publisher, revalidation: { ...evidence, checks: evidence.checks.slice(1) } } };
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([noPrimary]), protectedWorktrees, releaseOptions).ready, false, 'fresh primary-source evidence is mandatory');
const failedReview = { ...reviewed, publisher: { ...reviewed.publisher, revalidation: { ...evidence, checks: [...evidence.checks, { name: 'extra', status: 'fail', evidence: 'failure.log' }] } } };
assert.strictEqual(evaluateRelease(releasePolicy, releaseDefinitions, releaseQueue([failedReview]), protectedWorktrees, releaseOptions).ready, false, 'failed revalidation cannot waive age');
assert.throws(() => parseArgs(['--release']), /requires at least one/);
assert.throws(() => parseArgs(['--release', '--handoff-id', 'good-run', '--no-remote']), /cannot skip/);
assert.throws(() => parseArgs(['--handoff-id', 'good-run']), /requires --release/);
assert.throws(() => parseArgs(['--release', '--handoff-id', 'good-run', '--handoff-id', 'good-run']), /duplicates/);
assert.strictEqual(parseArgs(['--release', '--handoff-id', 'good-run']).release, true);
console.log('selected release and publisher revalidation tests passed');
