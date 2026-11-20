'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyReadyHandoffs } = require('../scripts/automation-control-plane');
const sha = 'a'.repeat(40);
const items = ['job', 'job-extra', 'missing'].map(branch => ({
  branch, commit: sha, handoff_id: branch, automation_id: branch, base_sha: 'b'.repeat(40), changed_files: ['a.txt']
}));
function run(remote, ready = items, options = {}) {
  const calls = [];
  const report = verifyReadyHandoffs({ ready }, options, args => {
    calls.push(args);
    if (args[0] === 'ls-remote') {
      assert.deepEqual(args, ['ls-remote', '--heads', 'origin']);
      return remote;
    }
    return { status: 0, stdout: args[0] === 'diff' ? 'a.txt\n' : '' };
  });
  return { calls, ...report };
}
const line = (name, hash = sha) => hash + '\trefs/heads/' + name + '\n';
test('one snapshot resolves exact branch names and local checks run only on matching commits', () => {
  const result = run({ status: 0, stdout: line('job-extra', 'c'.repeat(40)) + line('job') + line('other/missing') });
  assert.deepEqual(result.checks.map(c => c.remote_lookup.outcome), ['ref_present', 'ref_present', 'ref_absent']);
  assert.deepEqual(result.checks.map(c => c.remote_exact), [true, false, false]);
  assert.ok(result.checks[0].base_ancestor && result.checks[0].diff_exact);
  assert.deepEqual(result.calls.map(c => c[0]), ['ls-remote','cat-file','cat-file','merge-base','diff']);
  assert.equal(result.issues.length, 2);
});
test('transport, malformed records and duplicate refs fail closed and stay distinguishable', () => {
  for (const [response, outcome] of [
    [{status: 128, stdout: line('job')}, 'command_unavailable'],
    [{status: 0, stdout: line('job') + 'bad\n'}, 'malformed_response'],
    [{status: 0, stdout: sha + '\trefs/tags/job\n'}, 'malformed_response'],
    [{status: 0, stdout: line('job') + line('bad..ref')}, 'malformed_response'],
    [{status: 0, stdout: line('job') + line('job')}, 'ambiguous_response'],
    [{status: 0, stdout: line('job') + line('job','c'.repeat(40))}, 'ambiguous_response']
  ]) {
    const result = run(response);
    assert.equal(result.calls.length, 1);
    assert.ok(result.checks.every(c => !c.remote_exact && c.remote_lookup.outcome === outcome));
    assert.ok(result.issues.every(e => e.code === 'ready_handoff_remote_unavailable'));
  }
});
test('empty queue and --no-remote make no network calls', () => {
  assert.equal(run({}, []).calls.length, 0);
  assert.equal(run({}, items, {skipRemote:true}).calls.length, 0);
});
