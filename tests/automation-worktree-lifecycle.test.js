'use strict';

const assert = require('assert');
const {
  parseRegisteredPaths,
  metadataIssues,
} = require('../scripts/automation-worktree-lifecycle');

assert.deepStrictEqual(parseRegisteredPaths([
  'worktree C:/one',
  'HEAD 123',
  '',
  'worktree C:/two',
  'HEAD 456',
].join('\n')), [
  process.platform === 'win32' ? 'c:/one' : 'C:/one',
  process.platform === 'win32' ? 'c:/two' : 'C:/two',
]);

const item = {
  status: 'consumed',
  commit: '1234567890abcdef',
  producer: {
    worktree_path: 'C:/safe/worktree',
    cleanup_after: '2026-08-16T10:00:00Z',
    remote_ref: 'refs/heads/automation/lane-run',
  },
  publisher: {
    release_commit: 'abcdef1234567890',
    deploy_id: 'deploy-1',
    live_proof: ['https://example.com/proof'],
  },
};
assert.deepStrictEqual(metadataIssues(item, 'C:/safe/worktree', new Date('2026-08-16T11:00:00Z')), []);
assert.ok(metadataIssues(
  { ...item, status: 'ready' },
  'C:/safe/worktree',
  new Date('2026-08-16T11:00:00Z')
).some((issue) => issue.includes('consumed')));
assert.ok(metadataIssues(
  item,
  'C:/other/worktree',
  new Date('2026-08-16T11:00:00Z')
).some((issue) => issue.includes('exactly match')));
assert.ok(metadataIssues(
  item,
  'C:/safe/worktree',
  new Date('2026-08-16T09:00:00Z')
).some((issue) => issue.includes('has not passed')));

console.log('automation worktree lifecycle tests passed');
