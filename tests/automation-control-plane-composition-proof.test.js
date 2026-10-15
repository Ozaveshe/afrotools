'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { buildQueue, validateHandoff } = require('../scripts/automation-handoff');
const { parseArgs, validateCompositionProof, evaluateRelease, verifyReadyHandoffs } = require('../scripts/automation-control-plane');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const NOW = new Date('2026-10-15T12:00:00Z');
const MAIN = 'a'.repeat(40), HEAD = 'b'.repeat(40), TREE = 'c'.repeat(40), PATCH = 'd'.repeat(64);
// A harness may place all temporary files inside its own bounded Q envelope.
// Normal repository tests use an ordinary temporary directory.
const temporary = process.env.AFROTOOLS_COMPOSITION_TEST_TMP || os.tmpdir();
fs.mkdirSync(temporary, { recursive: true });
function receipt(id, number) {
  return { schema_version: 1, handoff_id: id, automation_id: 'producer', run_id: id,
    created_at: '2026-10-15T10:00:00Z', updated_at: '2026-10-15T10:00:00Z', status: 'ready',
    change_kind: 'repository', summary: id, merge_candidate: true, base_sha: 'e'.repeat(40),
    commit: String(number).repeat(40), branch: 'automation/producer-' + id,
    source_files: ['scripts/shared.js'], changed_files: ['scripts/shared.js'], generated_files: [],
    conflict_keys: [], dependencies: [], live_mutations: [],
    producer: { worktree_path: 'C:/synthetic/' + id, remote_ref: 'refs/heads/automation/producer-' + id,
      base_fetched_at: '2026-10-15T09:00:00Z', cleanup_after: '2026-10-16T12:00:00Z' },
    validations: [{ command: 'synthetic', status: 'pass', summary: 'synthetic' }],
    publisher: { live_proof: [] },
    risk: { level: 'low', reasons: [], touches_routes: false, touches_auth: false, touches_database: false, touches_generated_output: false } };
}
function fixture() {
  const root = fs.mkdtempSync(path.join(temporary, 'composition-proof-'));
  const evidencePath = path.join(root, 'manual-review.json');
  const evidence = Buffer.from('{"kind":"synthetic_manual_composition_review"}\n');
  fs.writeFileSync(evidencePath, evidence);
  const items = [receipt('a-run', 1), receipt('b-run', 2)];
  const records = items.map(item => ({ item, errors: validateHandoff(item), filePath: item.handoff_id + '.json' }));
  assert(records.every(record => record.errors.length === 0));
  const queue = { available: true, records, ...buildQueue(records), verification: { available: true, issues: [],
    checks: items.map(item => ({ handoff_id: item.handoff_id, commit: item.commit, remote_commit: item.commit,
      remote_exact: true, base_ancestor: true, diff_exact: true, source_patch_sha256: PATCH })) } };
  assert.equal(queue.conflicts.length, 1);
  const body = Buffer.from('synthetic composed source\n');
  const proof = { schema_version: 1, kind: 'source_composition', reviewed_at: NOW.toISOString(), current_main_sha: MAIN,
    release_commit: HEAD, release_tree: TREE,
    selected: items.map(item => ({ handoff_id: item.handoff_id, commit: item.commit, base_sha: item.base_sha, source_patch_sha256: PATCH })),
    conflicts: queue.conflicts.map(conflict => ({ ...conflict, final_blob_sha256: sha(body), evidence: [{ path: evidencePath, sha256: sha(evidence) }] })) };
  const options = { release: true, handoffIds: items.map(item => item.handoff_id), skipRemote: false,
    publisherId: 'publisher', currentMainSha: MAIN, now: NOW, compositionMaxAgeHours: 24,
    compositionProofPath: path.join(root, 'proof.json') };
  const calls = [];
  const native = args => {
    calls.push(args.slice());
    const key = JSON.stringify(args);
    const values = new Map([
      [JSON.stringify(['rev-parse', 'origin/main']), MAIN],
      [JSON.stringify(['ls-remote', 'origin', 'refs/heads/main']), MAIN + '\trefs/heads/main\n'],
      [JSON.stringify(['rev-parse', 'HEAD']), HEAD],
      [JSON.stringify(['rev-parse', HEAD + '^{tree}']), TREE],
      [JSON.stringify(['merge-base', '--is-ancestor', MAIN, HEAD]), ''],
      [JSON.stringify(['--literal-pathspecs', 'ls-tree', '-z', TREE, '--', 'scripts/shared.js']), '100644 blob ' + 'f'.repeat(40) + '\tscripts/shared.js\0'],
      [JSON.stringify(['cat-file', 'blob', 'f'.repeat(40)]), body],
    ]);
    if (!values.has(key)) throw Error('Unexpected Git operation: ' + key);
    return { status: 0, stdout: values.get(key), stderr: '' };
  };
  return { root, items, queue, proof, options, native, calls };
}
function seal(f) {
  const bytes = Buffer.from(JSON.stringify(f.proof));
  fs.writeFileSync(f.options.compositionProofPath, bytes);
  f.options.compositionProofSha256 = sha(bytes);
}
function validate(f, git = f.native) { seal(f); return validateCompositionProof(f.queue, f.options, git); }
const policy = { active_automation_budget: 1, active_automations: [{ id: 'publisher', role: 'publisher', expected_schedule: 'FREQ=DAILY', model: 'test', reasoning_effort: 'high' }],
  handoffs: { max_ready_age_hours: 24, require_worktree_ownership: true, policy_effective_at: '2026-08-01T00:00:00Z' } };
const definitions = { available: true, definitions: [{ id: 'publisher', status: 'ACTIVE', rrule: 'FREQ=DAILY', model: 'test', reasoning_effort: 'high' }] };
test('native buildQueue still reports source conflicts; no proof retains the original blocker', () => {
  const f = fixture(), before = JSON.stringify(f.queue);
  delete f.options.compositionProofPath;
  const result = evaluateRelease(policy, definitions, f.queue, { issues: [] }, f.options);
  assert.equal(result.ready, false);
  assert(result.blockers.some(issue => issue.code === 'handoff_conflict'));
  assert.deepEqual(result.queue.conflicts, f.queue.conflicts);
  assert.equal(JSON.stringify(f.queue), before);
});
test('exact digest-bound composition resolves only exact source pairs and preserves raw queue and receipts', () => {
  const f = fixture(), before = JSON.stringify(f.queue);
  seal(f);
  const result = evaluateRelease(policy, definitions, f.queue, { issues: [] }, f.options, f.native);
  assert.equal(result.ready, true);
  assert.equal(result.queue.conflicts.length, 1);
  assert.equal(result.queue.composition_proof.resolved_conflicts.length, 1);
  assert.equal(result.queue.composition_proof.conflicts[0].status, 'resolved');
  assert.equal(JSON.stringify(f.queue), before);
  assert(!f.calls.some(args => ['fetch', 'update-ref', 'config', 'reset'].includes(args[0])));
});
test('handoff pairs are unordered and evidence binds the final blob, not a path allowlist', () => {
  const f = fixture(); f.proof.conflicts[0].handoffs.reverse();
  assert.equal(validate(f).valid, true);
});
const negatives = [
  ['unknown proof schema', f => { f.proof.schema_version = 2; }],
  ['unexpected proof fields', f => { f.proof.allowAll = true; }],
  ['stale review', f => { f.proof.reviewed_at = '2026-10-13T10:00:00Z'; }],
  ['future review', f => { f.proof.reviewed_at = '2026-10-16T12:00:00Z'; }],
  ['changed origin identity', f => { f.proof.current_main_sha = '0'.repeat(40); }],
  ['changed release HEAD', f => { f.proof.release_commit = '0'.repeat(40); }],
  ['changed release tree', f => { f.proof.release_tree = '0'.repeat(40); }],
  ['missing selected identity', f => { f.proof.selected.pop(); }],
  ['extra selected identity', f => { f.proof.selected.push({ ...f.proof.selected[0], handoff_id: 'other-run' }); }],
  ['duplicate selected identity', f => { f.proof.selected[1] = structuredClone(f.proof.selected[0]); }],
  ['changed receipt commit', f => { f.proof.selected[0].commit = '0'.repeat(40); }],
  ['changed original base', f => { f.proof.selected[0].base_sha = '0'.repeat(40); }],
  ['changed original patch digest', f => { f.proof.selected[0].source_patch_sha256 = '0'.repeat(64); }],
  ['remote verification unavailable', f => { f.queue.verification.available = false; }],
  ['remote lookup failed', f => { f.queue.verification.checks[0].remote_exact = false; }],
  ['remote target mismatch', f => { f.queue.verification.checks[0].remote_commit = '0'.repeat(40); }],
  ['failed native ancestry', f => { f.queue.verification.checks[0].base_ancestor = false; }],
  ['failed native allowlist', f => { f.queue.verification.checks[0].diff_exact = false; }],
  ['ambiguous native check', f => { f.queue.verification.checks.push({ ...f.queue.verification.checks[0] }); }],
  ['missing actual conflict proof', f => { f.proof.conflicts.pop(); }],
  ['extra actual source conflict', f => { f.queue.conflicts.push({ type: 'source_file', key: 'scripts/new.js', handoffs: ['a-run', 'b-run'] }); }],
  ['unknown proof conflict path', f => { f.proof.conflicts[0].key = 'scripts/other.js'; }],
  ['unknown proof conflict pair', f => { f.proof.conflicts[0].handoffs[1] = 'other-run'; }],
  ['duplicate conflict proof', f => { f.proof.conflicts.push(structuredClone(f.proof.conflicts[0])); }],
  ['path traversal', f => { f.proof.conflicts[0].key = '../scripts/shared.js'; }],
  ['conflict-key exemption attempt', f => { f.proof.conflicts[0].type = 'conflict_key'; }],
  ['changed final blob', f => { f.proof.conflicts[0].final_blob_sha256 = '0'.repeat(64); }],
  ['no manual composition evidence', f => { f.proof.conflicts[0].evidence = []; }],
  ['changed evidence digest', f => { f.proof.conflicts[0].evidence[0].sha256 = '0'.repeat(64); }],
  ['missing evidence file', f => { f.proof.conflicts[0].evidence[0].path += '.missing'; }],
  ['relative evidence path', f => { f.proof.conflicts[0].evidence[0].path = 'relative.json'; }],
];
for (const [name, mutate] of negatives) test('composition fails closed: ' + name, () => {
  const f = fixture(); mutate(f); const result = validate(f);
  assert.equal(result.valid, false); assert.equal(result.resolved_conflicts.length, 0);
  assert.deepEqual(result.unresolved_conflicts, f.queue.conflicts); assert(result.errors.length > 0);
});
test('proof bytes must match separately supplied digest', () => {
  const f = fixture(); seal(f); f.options.compositionProofSha256 = '0'.repeat(64);
  assert.equal(validateCompositionProof(f.queue, f.options, f.native).valid, false);
});
test('API rejects an orphan proof digest and a proof larger than the bounded input budget', () => {
  const f = fixture(); seal(f);
  const orphan = { ...f.options }; delete orphan.compositionProofPath;
  assert.equal(validateCompositionProof(f.queue, orphan, f.native).valid, false);
  fs.truncateSync(f.options.compositionProofPath, 1024 * 1024 + 1);
  assert.equal(validateCompositionProof(f.queue, f.options, f.native).valid, false);
});
test('failed current remote main and symlink Git source modes cannot be acknowledged', () => {
  for (const variant of ['remote', 'symlink']) {
    const f = fixture(); seal(f);
    const result = validateCompositionProof(f.queue, f.options, args => {
      if (variant === 'remote' && args[0] === 'ls-remote') return { status: null, error: { code: 'ETIMEDOUT' }, stdout: '' };
      if (variant === 'symlink' && args[1] === 'ls-tree') return { status: 0, stdout: '120000 blob ' + 'f'.repeat(40) + '\tscripts/shared.js\0' };
      return f.native(args);
    });
    assert.equal(result.valid, false); assert.equal(result.resolved_conflicts.length, 0);
  }
});
test('valid source proof never hides conflict-key, dependency or unrelated integrity blockers', () => {
  for (const variant of ['conflict', 'dependency', 'integrity', 'publisher']) {
    const f = fixture();
    if (variant === 'conflict') for (const r of f.queue.records) r.item.conflict_keys = ['shared:key'];
    if (variant === 'dependency') f.queue.records[0].item.dependencies = ['missing-run'];
    if (variant === 'integrity') f.queue.verification.issues.push({ severity: 'error', code: 'future_integrity_check', handoff_id: 'a-run', detail: 'synthetic failure' });
    seal(f);
    const result = evaluateRelease(policy, variant === 'publisher' ? { available: true, definitions: [] } : definitions,
      f.queue, { issues: [] }, f.options, f.native);
    assert.equal(result.ready, false, variant);
    if (variant === 'conflict') {
      assert.equal(result.queue.conflicts.length, 2);
      assert.equal(result.queue.composition_proof.unresolved_conflicts[0].type, 'conflict_key');
    }
  }
});
test('paired CLI proof arguments require release mode and cannot skip native remote checks', () => {
  for (const args of [ ['--composition-proof', 'x.json'], ['--composition-proof-sha256', PATCH],
    ['--release', '--handoff-id', 'a-run', '--composition-proof', 'x.json'],
    ['--release', '--handoff-id', 'a-run', '--composition-proof', '--json'],
    ['--release', '--handoff-id', 'a-run', '--composition-proof', 'x.json', '--composition-proof-sha256', PATCH, '--no-remote'] ]) assert.throws(() => parseArgs(args));
  const options = parseArgs(['--release', '--handoff-id', 'a-run', '--composition-proof', 'x.json', '--composition-proof-sha256', PATCH]);
  assert.equal(options.compositionProofSha256, PATCH); assert(path.isAbsolute(options.compositionProofPath));
});
test('remote command error/null differs from authoritative no-match; both block and never fetch', () => {
  for (const unavailable of [true, false]) {
    const calls = [], item = receipt('a-run', 1);
    const report = verifyReadyHandoffs({ ready: [item] }, { skipRemote: false }, args => {
      calls.push(args);
      return unavailable ? { status: null, signal: 'SIGTERM', error: { code: 'ETIMEDOUT', message: 'spawnSync git ETIMEDOUT' }, stdout: '', stderr: 'https://secret-token@example.test/repo?token=sensitive Bearer abc123\n' + 'x'.repeat(3000) }
        : { status: 0, stdout: '', stderr: '' };
    });
    const check = report.checks[0]; assert.equal(check.remote_exact, false); assert.equal(calls.length, 1);
    assert.equal(check.remote_commit, unavailable ? null : '');
    assert.equal(check.remote_lookup.outcome, unavailable ? 'command_unavailable' : 'ref_absent');
    assert.equal(check.remote_lookup.error_message, unavailable ? 'spawnSync git ETIMEDOUT' : null);
    assert.equal(report.issues[0].code, unavailable ? 'ready_handoff_remote_unavailable' : 'ready_handoff_remote_mismatch');
    assert(check.remote_lookup.stderr.length <= 2048);
    assert(!/secret-token|sensitive|abc123/.test(check.remote_lookup.stderr));
  }
});
test('selected composition verification computes the original source patch even without age revalidation', () => {
  const item = receipt('a-run', 1), calls = [];
  const report = verifyReadyHandoffs({ ready: [item] }, { skipRemote: false, release: true,
    handoffIds: ['a-run'], compositionProofPath: 'synthetic-proof.json' }, args => {
    calls.push(args);
    if (args[0] === 'ls-remote') return { status: 0, stdout: item.commit + '\trefs/heads/' + item.branch + '\n' };
    if (args[0] === 'diff') return { status: 0, stdout: 'scripts/shared.js\n' };
    if (args[0] === '-c') return { status: 0, stdout: 'original source patch\n' };
    return { status: 0, stdout: '' };
  });
  assert.equal(report.checks[0].source_patch_sha256, sha('original source patch\n'));
  assert.equal(report.checks[0].diff_exact, true);
  assert(calls.some(args => args.includes('--binary') && args.includes(item.base_sha) && args.includes(item.commit)));
  assert(!calls.some(args => args[0] === 'fetch'));
});

// Schema 2 is an explicit proof for the complete raw typed conflict set. It
// never changes receipts or replaces native source/remote/publisher gates.
function keyFixture() {
  const f = fixture();
  f.items[0].source_files.push('scripts/first.js');
  f.items[1].source_files.push('scripts/second.js');
  for (const item of f.items) {
    item.changed_files = item.source_files.slice();
    item.conflict_keys = ['shared:key', 'registry:key'];
    assert.deepEqual(validateHandoff(item), []);
  }
  Object.assign(f.queue, buildQueue(f.queue.records));
  const bodies = new Map([
    ['scripts/shared.js', Buffer.from('synthetic composed source\n')],
    ['scripts/first.js', Buffer.from('first exact contribution\n')],
    ['scripts/second.js', Buffer.from('second exact contribution\n')],
  ]);
  const oids = new Map([['scripts/first.js', '6'.repeat(40)], ['scripts/second.js', '7'.repeat(40)]]);
  const native = f.native;
  f.native = args => {
    if (args[0] === '--literal-pathspecs' && oids.has(args[args.length - 1])) {
      const file = args[args.length - 1];
      f.calls.push(args.slice());
      return { status: 0, stdout: '100644 blob ' + oids.get(file) + '\t' + file + '\0' };
    }
    if (args[0] === 'cat-file') {
      const file = [...oids].find(([, oid]) => oid === args[2]);
      if (file) { f.calls.push(args.slice()); return { status: 0, stdout: bodies.get(file[0]) }; }
    }
    return native(args);
  };
  const evidence = structuredClone(f.proof.conflicts[0].evidence);
  f.proof.schema_version = 2; f.proof.kind = 'release_composition';
  f.proof.conflicts = f.queue.conflicts.map(conflict => conflict.type === 'source_file'
    ? { ...conflict, final_blob_sha256: sha(bodies.get(conflict.key)), evidence: structuredClone(evidence) }
    : { ...conflict,
      source_bindings: [...bodies].map(([file, body]) => ({ file,
        owners: f.items.filter(item => item.source_files.includes(file)).map(item => item.handoff_id),
        final_blob_sha256: sha(body) })),
      contributions: f.items.map(item => ({ handoff_id: item.handoff_id, commit: item.commit,
        base_sha: item.base_sha, source_patch_sha256: PATCH, source_files: item.source_files.slice(),
        evidence: structuredClone(evidence) })), evidence: structuredClone(evidence) });
  return f;
}
const keyRow = f => f.proof.conflicts.find(row => row.type === 'conflict_key');
test('schema2 proves every raw source/key conflict with exact union, owners, final blobs and both original contributions', () => {
  const f = keyFixture(), before = JSON.stringify(f.queue);
  seal(f);
  const result = evaluateRelease(policy, definitions, f.queue, { issues: [] }, f.options, f.native);
  assert.equal(result.ready, true);
  assert.equal(result.queue.conflicts.length, 3);
  assert.equal(result.queue.composition_proof.resolved_conflicts.length, 3);
  assert.deepEqual(result.queue.composition_proof.unresolved_conflicts, []);
  assert(result.queue.composition_proof.conflicts.every(row => row.status === 'resolved'));
  assert.equal(JSON.stringify(f.queue), before);
  assert(!f.calls.some(args => ['fetch', 'update-ref', 'config', 'reset'].includes(args[0])));
});
test('schema2 pairs, source unions and contribution lists are unordered', () => {
  const f = keyFixture(); f.proof.conflicts.reverse();
  for (const row of f.proof.conflicts) {
    row.handoffs.reverse();
    if (row.type === 'conflict_key') {
      row.source_bindings.reverse(); row.contributions.reverse();
      for (const binding of row.source_bindings) binding.owners.reverse();
      for (const item of row.contributions) item.source_files.reverse();
    }
  }
  assert.equal(validate(f).valid, true);
});
test('schema1 continues to leave declared keys unresolved', () => {
  const f = keyFixture(); f.proof.schema_version = 1; f.proof.kind = 'source_composition';
  f.proof.conflicts = f.proof.conflicts.filter(row => row.type === 'source_file');
  const result = validate(f);
  assert.equal(result.valid, true); assert.equal(result.resolved_conflicts.length, 1);
  assert.equal(result.unresolved_conflicts.length, 2);
  assert(result.unresolved_conflicts.every(row => row.type === 'conflict_key'));
});
const keyNegatives = [
  ['schema2 with legacy kind', f => { f.proof.kind = 'source_composition'; }],
  ['unknown schema3', f => { f.proof.schema_version = 3; }],
  ['missing actual key proof', f => { f.proof.conflicts.pop(); }],
  ['new raw key pair', f => { f.queue.conflicts.push({ type: 'conflict_key', key: 'new:key', handoffs: ['a-run', 'b-run'] }); }],
  ['unknown raw conflict type', f => { f.queue.conflicts.push({ type: 'route', key: 'scripts/shared.js', handoffs: ['a-run', 'b-run'] }); }],
  ['duplicate raw key identity', f => { f.queue.conflicts.push(structuredClone(f.queue.conflicts[1])); }],
  ['duplicate proof key identity', f => { f.proof.conflicts[2] = structuredClone(f.proof.conflicts[1]); }],
  ['unknown unproved key', f => { keyRow(f).key = 'unknown:key'; }],
  ['wildcard key', f => { keyRow(f).key = '*'; }],
  ['new key pair', f => { keyRow(f).handoffs[1] = 'other-run'; }],
  ['only one receipt declares key', f => { f.items[1].conflict_keys = ['registry:key']; }],
  ['neither receipt declares key', f => { for (const item of f.items) item.conflict_keys = []; }],
  ['omitted union member', f => { keyRow(f).source_bindings.pop(); }],
  ['additional union member', f => { keyRow(f).source_bindings.push({ file: 'scripts/unrelated.js', owners: ['a-run'], final_blob_sha256: PATCH }); }],
  ['duplicate union member', f => { keyRow(f).source_bindings[2] = structuredClone(keyRow(f).source_bindings[1]); }],
  ['receipt source union changed', f => { f.items[1].source_files.push('scripts/new.js'); }],
  ['traversing source union path', f => { keyRow(f).source_bindings[1].file = '../scripts/first.js'; }],
  ['shared binding omits owner', f => { keyRow(f).source_bindings[0].owners.pop(); }],
  ['private binding has wrong owner', f => { keyRow(f).source_bindings[1].owners = ['b-run']; }],
  ['duplicate owner', f => { keyRow(f).source_bindings[1].owners.push('a-run'); }],
  ['stale final key-only blob', f => { keyRow(f).source_bindings[1].final_blob_sha256 = '0'.repeat(64); }],
  ['missing contribution', f => { keyRow(f).contributions.pop(); }],
  ['duplicate contribution', f => { keyRow(f).contributions[1] = structuredClone(keyRow(f).contributions[0]); }],
  ['unknown contribution', f => { keyRow(f).contributions[1].handoff_id = 'other-run'; }],
  ['changed contribution commit', f => { keyRow(f).contributions[0].commit = '0'.repeat(40); }],
  ['changed contribution original base', f => { keyRow(f).contributions[0].base_sha = '0'.repeat(40); }],
  ['changed contribution original patch', f => { keyRow(f).contributions[0].source_patch_sha256 = '0'.repeat(64); }],
  ['missing contribution source', f => { keyRow(f).contributions[0].source_files.pop(); }],
  ['duplicate contribution source', f => { keyRow(f).contributions[0].source_files[1] = keyRow(f).contributions[0].source_files[0]; }],
  ['missing contribution review', f => { keyRow(f).contributions[0].evidence = []; }],
  ['tampered contribution review pin', f => { keyRow(f).contributions[0].evidence[0].sha256 = '0'.repeat(64); }],
  ['missing key review', f => { keyRow(f).evidence = []; }],
  ['unexpected source binding field', f => { keyRow(f).source_bindings[0].allowAll = true; }],
  ['unexpected contribution field', f => { keyRow(f).contributions[0].allowAll = true; }],
];
for (const [name, mutate] of keyNegatives) test('schema2 fails closed: ' + name, () => {
  const f = keyFixture(); mutate(f); const result = validate(f);
  assert.equal(result.valid, false); assert.deepEqual(result.resolved_conflicts, []);
  assert.deepEqual(result.unresolved_conflicts, f.queue.conflicts); assert(result.errors.length > 0);
});
test('schema2 rejects tampered review bodies, remote changes and nonregular key-only source blobs', () => {
  for (const variant of ['evidence', 'remote', 'symlink', 'directory']) {
    const f = keyFixture(); seal(f);
    if (variant === 'evidence') fs.appendFileSync(keyRow(f).contributions[0].evidence[0].path, 'tampered');
    const result = validateCompositionProof(f.queue, f.options, args => {
      if (variant === 'remote' && args[0] === 'ls-remote') return { status: 0, stdout: '0'.repeat(40) + '\trefs/heads/main\n' };
      if (['symlink', 'directory'].includes(variant) && args[1] === 'ls-tree' && args.at(-1) === 'scripts/first.js') {
        return { status: 0, stdout: (variant === 'symlink' ? '120000 blob ' : '040000 tree ') + '6'.repeat(40) + '\tscripts/first.js\0' };
      }
      return f.native(args);
    });
    assert.equal(result.valid, false, variant); assert.deepEqual(result.resolved_conflicts, []);
  }
});
test('schema2 never hides dependency, native-integrity, source identity or publisher blockers', () => {
  for (const variant of ['dependency', 'integrity', 'source', 'publisher']) {
    const f = keyFixture();
    if (variant === 'dependency') f.items[0].dependencies = ['missing-run'];
    if (variant === 'integrity') f.queue.verification.issues.push({ severity: 'error', code: 'future_integrity_check', handoff_id: 'a-run', detail: 'synthetic' });
    if (variant === 'source') f.queue.verification.checks[0].diff_exact = false;
    seal(f);
    const result = evaluateRelease(policy, variant === 'publisher' ? { available: true, definitions: [] } : definitions,
      f.queue, { issues: [] }, f.options, f.native);
    assert.equal(result.ready, false, variant);
  }
});
