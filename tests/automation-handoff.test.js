const assert = require('assert');
const { validateHandoff, buildQueue } = require('../scripts/automation-handoff');

function fixture(overrides = {}) {
  const item = {
    schema_version: 1,
    handoff_id: 'lane-2026-08-12-run-1',
    automation_id: 'lane',
    run_id: 'run-1',
    created_at: '2026-08-12T08:00:00.000Z',
    updated_at: '2026-08-12T08:05:00.000Z',
    status: 'ready',
    change_kind: 'repository',
    summary: 'Scoped source update',
    merge_candidate: true,
    base_sha: 'a037f2256140691a034b2eeca465b98e7d7f8846',
    branch: 'automation/lane-2026-08-12',
    commit: '1234567890abcdef1234567890abcdef12345678',
    changed_files: ['data/example.json'],
    source_files: ['data/example.json'],
    generated_files: [],
    conflict_keys: ['data:example'],
    dependencies: [],
    producer: {
      worktree_path: 'C:/Users/Oza/.codex/worktrees/lane-run-1',
      base_fetched_at: '2026-08-12T07:58:00.000Z',
      remote_ref: 'refs/heads/automation/lane-2026-08-12',
      cleanup_after: '2026-08-13T08:05:00.000Z',
    },
    validations: [{ command: 'node tests/example.test.js', status: 'pass', summary: 'passed' }],
    risk: {
      level: 'low',
      reasons: [],
      touches_routes: false,
      touches_auth: false,
      touches_database: false,
      touches_generated_output: false,
    },
    live_mutations: [],
    rollback: 'Revert the daily release commit.',
    blocker: null,
    publisher: { consumed_at: null, release_commit: null, deploy_id: null, live_proof: [] },
    ...overrides,
  };
  if (Object.prototype.hasOwnProperty.call(overrides, 'automation_id') && !Object.prototype.hasOwnProperty.call(overrides, 'branch')) {
    item.branch = `automation/${item.automation_id}-2026-08-12`;
  }
  if (!Object.prototype.hasOwnProperty.call(overrides, 'producer')) {
    item.producer = {
      ...item.producer,
      remote_ref: `refs/heads/${item.branch}`,
    };
  }
  return item;
}

assert.deepStrictEqual(validateHandoff(fixture()), []);
assert.ok(validateHandoff(fixture({ commit: null })).some((error) => error.includes('require commit')));
assert.ok(
  validateHandoff(fixture({ changed_files: ['data/other.json'] }))
    .some((error) => error.includes('changed_files must exactly equal')),
  'ready receipts must describe the exact source/generated diff partition'
);
assert.ok(
  validateHandoff(fixture({ branch: 'codex/wrong-owner' }))
    .some((error) => error.includes('branch must start')),
  'ready receipts must use the owning automation branch prefix'
);
assert.ok(
  validateHandoff(fixture({ updated_at: '2026-08-12T07:00:00.000Z' }))
    .some((error) => error.includes('must not be earlier')),
  'receipt timestamps must be monotonic'
);
assert.ok(validateHandoff(fixture({ status: 'blocked', merge_candidate: false, blocker: null })).some((error) => error.includes('require blocker')));
assert.ok(
  validateHandoff(fixture({ dependencies: ['Do not overwrite newer statutory source updates.'] }))
    .some((error) => error.includes('must be a handoff id')),
  'dependencies must contain receipt ids rather than prose or source notes'
);

const first = fixture();
const second = fixture({ handoff_id: 'lane-2-run-1', automation_id: 'lane-2', commit: 'abcdef1234567890abcdef1234567890abcdef12' });
const queue = buildQueue([
  { filePath: 'one', item: first, errors: validateHandoff(first) },
  { filePath: 'two', item: second, errors: validateHandoff(second) },
]);
assert.strictEqual(queue.ready.length, 2);
assert.deepStrictEqual(queue.conflicts, [
  { type: 'source_file', key: 'data/example.json', handoffs: ['lane-2026-08-12-run-1', 'lane-2-run-1'] },
  { type: 'conflict_key', key: 'data:example', handoffs: ['lane-2026-08-12-run-1', 'lane-2-run-1'] },
]);

const dependent = fixture({
  handoff_id: 'dependent-run-1',
  automation_id: 'dependent',
  commit: 'fedcba0987654321fedcba0987654321fedcba09',
  changed_files: ['data/dependent.json'],
  source_files: ['data/dependent.json'],
  conflict_keys: ['data:dependent'],
  dependencies: ['lane-2026-08-12-run-1'],
});
const dependencyQueue = buildQueue([
  { filePath: 'dependent', item: dependent, errors: validateHandoff(dependent) },
  { filePath: 'one', item: first, errors: validateHandoff(first) },
]);
assert.deepStrictEqual(dependencyQueue.ready.map((item) => item.handoff_id), [
  'lane-2026-08-12-run-1',
  'dependent-run-1',
]);
assert.deepStrictEqual(dependencyQueue.dependency_issues, []);

const contentMorning = fixture({
  handoff_id: 'am-content-batch-2-2026-08-16-run-1',
  automation_id: 'am-content-batch-2',
  source_files: ['blog/morning/index.html', 'blog/index.html', 'data/content/blog-article-manifest.json'],
  generated_files: ['blog/feed.xml'],
  conflict_keys: ['blog:slug:morning', 'blog:hub', 'blog:manifest', 'blog:feed'],
});
const contentEvening = fixture({
  handoff_id: 'pm-content-batch-2-2026-08-16-run-1',
  automation_id: 'pm-content-batch-2',
  commit: 'abcdef1234567890abcdef1234567890abcdef12',
  source_files: ['blog/evening/index.html', 'blog/index.html', 'data/content/blog-article-manifest.json'],
  generated_files: ['blog/feed.xml'],
  conflict_keys: ['blog:slug:evening', 'blog:hub', 'blog:manifest', 'blog:feed'],
  dependencies: ['am-content-batch-2-2026-08-16-run-1'],
});
const contentQueue = buildQueue([
  { filePath: 'morning', item: contentMorning, errors: validateHandoff(contentMorning) },
  { filePath: 'evening', item: contentEvening, errors: validateHandoff(contentEvening) },
]);
assert.deepStrictEqual(contentQueue.conflicts, [], 'ordered content batches may share only the declared regenerable blog surfaces');

const missingDependency = fixture({
  handoff_id: 'missing-dependency-run',
  automation_id: 'missing-dependency',
  dependencies: ['not-present'],
});
assert.strictEqual(buildQueue([
  { filePath: 'missing', item: missingDependency, errors: validateHandoff(missingDependency) },
]).dependency_issues.length, 1);

const live = fixture({
  handoff_id: 'live-run-1',
  automation_id: 'live-lane',
  status: 'live_only',
  change_kind: 'live_data',
  merge_candidate: false,
  base_sha: null,
  branch: null,
  commit: null,
  changed_files: [],
  source_files: [],
  conflict_keys: [],
  live_mutations: ['public.scholarships: updated row'],
});
assert.deepStrictEqual(validateHandoff(live), []);
assert.strictEqual(buildQueue([{ filePath: 'live', item: live, errors: [] }]).informational.length, 1);

console.log('automation handoff tests passed');
