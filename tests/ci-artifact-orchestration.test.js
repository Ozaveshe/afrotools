'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const c = require('../scripts/ci-artifact-contract');
const {selectNativeStart, bindNativeDeadline, readNativeJobs} = require('../scripts/ci-artifact-deadline');
const inventory = require('../scripts/ci-artifact-groups.json');
const ROOT = path.resolve(__dirname, '..');
const clone = value => structuredClone(value);

function originalBrowserStep(block) {
  const lines = block.trimEnd().split('\n'), step = {name: lines[0].slice('      - name: '.length)};
  const envAt = lines.indexOf('        env:'), runAt = lines.findIndex(line => line.startsWith('        run:'));
  assert.ok(runAt >= 0, 'Every original browser gate has a native run block');
  if (envAt >= 0) {
    step.env = {};
    for (const line of lines.slice(envAt + 1, runAt)) {
      const match = line.match(/^          ([A-Z_0-9]+): (.+)$/); assert.ok(match, 'Unexpected original env semantics');
      let value = match[2];
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1).replaceAll("''", "'");
      step.env[match[1]] = value;
    }
  }
  const run = lines[runAt].slice('        run: '.length);
  step.run = run === '|' ? lines.slice(runAt + 1).map(line => line.slice(10)).join('\n') + '\n' : run;
  return step;
}

test('mechanically preserves all current commands/env/specs/workers and Verify/smoke blocks', () => {
  const original = fs.readFileSync(path.join(ROOT, 'tests/fixtures/ci-artifact-original-a225.yml'), 'utf8');
  assert.equal(c.sha(original), inventory.originalWorkflowSha256);
  const current = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8').replaceAll('\r\n', '\n');
  assert.ok(current.includes(inventory.originalVerifyYaml)); assert.ok(current.includes(inventory.originalSmokeYaml));
  const body = original.split('  build:\n')[1].split('  e2e:\n')[0];
  const blocks = body.match(/      - name: .*?(?=\n      - name:|$)/gs);
  const inverse = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/automation/workflow-inverses/afrostream-fr-sw-provenance-614.json'), 'utf8'));
  const originalInventoryBytes = Buffer.from(inverse.baselineBase64, 'base64');
  assert.equal(c.sha(originalInventoryBytes), inverse.baselineRawSha256);
  const originalInventory = JSON.parse(originalInventoryBytes);
  const addition = inventory.browser.filter(gate => !originalInventory.browser.some(old => old.id === gate.id));
  const originals = inventory.browser.filter(gate => originalInventory.browser.some(old => old.id === gate.id));
  assert.equal(blocks.length, 42);
  assert.equal(inventory.producer.length, 10);
  assert.equal(originals.length, 32);
  assert.equal(inventory.browser.length, 33);
  assert.equal(inventory.producer.length + inventory.browser.length, 43);
  assert.deepEqual(originals, originalInventory.browser);
  assert.deepEqual(inventory.producer, originalInventory.producer);
  assert.equal(addition.length, 1);
  assert.equal(addition[0].id, 'afrostream-localized-provenance');
  assert.equal(addition[0].group, 2);
  assert.deepEqual(addition[0].step.env, {AFROTOOLS_TEST_PUBLISH_ARTIFACT:'1', AFROTOOLS_TEST_DISABLE_ANALYTICS:'1', PORT:'4199'});
  assert.equal(addition[0].step.run, 'npx playwright test tests/e2e/afrostream-localized-provenance.spec.js --project=chromium --workers=1 --retries=0 --trace=off --output="$RUNNER_TEMP/afrostream-provenance-browser"');
  const restored = clone(inventory);
  restored.browser = originals;
  assert.deepEqual(restored, originalInventory);
  assert.equal(blocks.length, inventory.producer.length + originals.length);
  const covered = new Set();
  for (const [index, block] of blocks.entries()) {
    const name = block.split('\n')[0].slice('      - name: '.length);
    const producer = inventory.producer.find(item => item.step.name === name);
    const browser = inventory.browser.find(item => item.step.name === name);
    assert.equal(Boolean(producer) !== Boolean(browser), true, 'Each original step owned exactly once');
    if (producer) {
      assert.equal(producer.originalYaml, block.trimEnd() + '\n\n');
      const artifactJob = current.split('  artifact:\n')[1].split('  browser:\n')[0];
      assert.equal(artifactJob.split(producer.originalYaml).length, 2);
    } else {
      assert.equal(browser.originalIndex, index); assert.deepEqual(browser.step, originalBrowserStep(block));
      assert.equal(browser.stepSha256, c.jsonHash(browser.step));
    }
    assert.ok(!covered.has(name)); covered.add(name);
  }
  assert.equal(c.inventoryCheck(inventory), c.jsonHash(inventory));
  assert.deepEqual(inventory.consumerSetup, inventory.producer.filter(item => ['Install dependencies', 'Install Chromium for optimized artifact checks'].includes(item.step.name)).map(item => item.step));
  assert.deepEqual(inventory.generatedCheck, inventory.producer.find(item => item.step.name === 'Verify generated outputs are committed').step);
  assert.ok(current.indexOf('Verify current French finance shared-controller exports') < current.indexOf('Seal the single artifact'));
  assert.ok(current.indexOf('Verify generated outputs are committed') < current.indexOf('Seal the single artifact'));
  assert.match(current, /name: Build and audit\n    needs: \[artifact, browser\]\n    if: \$\{\{ always\(\) \}\}/);
  assert.match(current, /max-parallel: 2/); assert.match(current, /fail-fast: false/);
  assert.equal((current.match(/run: npm run build:deploy/g) || []).length, 1);
  assert.equal((current.match(/writeReleaseMetadata\(\)/g) || []).length, 1);
});

test('additive provenance gate is mandatory under the unchanged sealed inventory and deadline', () => {
  const f = goodAcceptance();
  const report = f.reports.find(item => item.group === 2);
  const gate = report.gates.find(item => item.id === 'afrostream-localized-provenance');
  assert.ok(gate, 'The eight-scenario gate must be enrolled in the sealed artifact group');
  gate.status = 'skipped';
  assert.throws(() => c.aggregate(inventory, f.manifest, f.reports, f.needs), /gate failed/);
  report.gates = report.gates.filter(item => item.id !== gate.id);
  assert.throws(() => c.aggregate(inventory, f.manifest, f.reports, f.needs), /missing/);
});

test('inventory rejects duplicate commands, unsupported contexts and changed native flags', () => {
  const duplicate = clone(inventory); duplicate.browser.push(clone(duplicate.browser[0]));
  assert.throws(() => c.inventoryCheck(duplicate), /Duplicate/);
  const changed = clone(inventory); changed.browser[0].step.run += ' --workers=12';
  assert.throws(() => c.inventoryCheck(changed), /changed/);
  const expression = clone(inventory); expression.browser[0].step.env.NEW = '${{ secrets.BAD }}';
  assert.throws(() => c.inventoryCheck(expression), /expression/);
});

test('runner-specific paths are bound at step scope, never pre-run job env', () => {
  const current = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8').replaceAll('\r\n', '\n');
  for (const job of current.split(/^  [a-z_]+:\n/m).slice(1)) {
    const header = job.split('    steps:\n')[0];
    const jobEnv = header.split('    env:\n')[1] || '';
    assert.doesNotMatch(jobEnv, /\$\{\{\s*(runner|steps|job|env)\./, 'GitHub does not allow these contexts in jobs.<job_id>.env');
  }
  assert.match(current, /name: Run assigned unchanged native commands against the sealed artifact\n        env:\n          SEALED_BUNDLE: \$\{\{ runner.temp \}\}/);
  assert.match(current, /name: Require every original gate, source\/artifact identity and original deadline\n        env:\n          SEALED_BUNDLE: \$\{\{ runner.temp \}\}/);
});

function goodAcceptance() {
  const manifest = {commit: 'a'.repeat(40), tree: 'b'.repeat(40), runId: '42', attempt: '1', deadline: Date.now() + 60000,
    inventorySha256: c.jsonHash(inventory), distTreeSha256: 'c'.repeat(64), sourceTreeSha256: 'd'.repeat(64), archiveSha256: 'e'.repeat(64)};
  const reports = [1, 2].map(group => ({...manifest, group, status: 'success', integrity: 'pass', setup: 'pass',
    gates: inventory.browser.filter(g => g.group === group).map(g => ({id: g.id, stepSha256: g.stepSha256, status: 'success', exitCode: 0}))}));
  return {manifest, reports, needs: {artifact: {result: 'success'}, browser: {result: 'success'}}};
}

test('aggregate succeeds only with both runners and every original gate', () => {
  const f = goodAcceptance(); assert.equal(c.aggregate(inventory, f.manifest, f.reports, f.needs), true);
});
for (const status of ['failed', 'skipped', 'cancelled', 'not_run']) {
  test('aggregate rejects an ordinary gate ' + status, () => {
    const f = goodAcceptance(); f.reports[0].gates[0].status = status;
    assert.throws(() => c.aggregate(inventory, f.manifest, f.reports, f.needs), /gate failed/);
  });
}
for (const status of ['failure', 'skipped', 'cancelled']) {
  test('aggregate rejects producer or matrix ' + status, () => {
    for (const job of ['artifact', 'browser']) {
      const f = goodAcceptance(); f.needs[job].result = status;
      assert.throws(() => c.aggregate(inventory, f.manifest, f.reports, f.needs), /job failed/);
    }
  });
}
test('aggregate rejects missing, duplicate, misassigned and changed command reports', () => {
  const missing = goodAcceptance(); missing.reports[0].gates.pop();
  assert.throws(() => c.aggregate(inventory, missing.manifest, missing.reports, missing.needs), /missing/);
  const duplicate = goodAcceptance(); duplicate.reports[0].gates.push(clone(duplicate.reports[0].gates[0]));
  assert.throws(() => c.aggregate(inventory, duplicate.manifest, duplicate.reports, duplicate.needs), /Duplicate/);
  const group = goodAcceptance(); group.reports[1].group = 1;
  assert.throws(() => c.aggregate(inventory, group.manifest, group.reports, group.needs), /Duplicate/);
  const changed = goodAcceptance(); changed.reports[0].gates[0].stepSha256 = '0'.repeat(64);
  assert.throws(() => c.aggregate(inventory, changed.manifest, changed.reports, changed.needs), /changed/);
  const noReport = goodAcceptance(); noReport.reports.pop();
  assert.throws(() => c.aggregate(inventory, noReport.manifest, noReport.reports, noReport.needs), /Missing/);
});
for (const field of ['commit', 'tree', 'runId', 'attempt', 'deadline', 'inventorySha256', 'distTreeSha256', 'sourceTreeSha256', 'archiveSha256']) {
  test('aggregate rejects mismatched ' + field, () => {
    const f = goodAcceptance(); f.reports[0][field] = 'different';
    assert.throws(() => c.aggregate(inventory, f.manifest, f.reports, f.needs), /binding mismatch/);
  });
}
test('shared deadline cannot restart in consumers or aggregate', () => {
  const f = goodAcceptance();
  assert.throws(() => c.aggregate(inventory, f.manifest, f.reports, f.needs, f.manifest.deadline), /deadline/);
  assert.throws(() => c.deadlineCheck(NaN), /invalid/);
  assert.throws(() => c.deadlineCheck(Date.now() - 1), /deadline/);
});

test('native deadline uses the actual job start even if status propagation is delayed', () => {
  const start = Date.parse('2026-10-13T07:00:00Z'), now = start + 120000;
  for (const status of ['queued', 'in_progress']) {
    assert.equal(selectNativeStart([{name:'Artifact producer',status,started_at:new Date(start).toISOString()}], now), start + 75*60000);
  }
  assert.throws(() => selectNativeStart([], now), /uniquely/);
  assert.throws(() => selectNativeStart([{name:'Artifact producer',status:'queued',started_at:null}], now), /valid/);
  assert.throws(() => selectNativeStart([{name:'Artifact producer',status:'in_progress',started_at:new Date(now+1).toISOString()}], now), /valid/);
});

test('native start lookup retries bounded visibility without restarting the deadline', async () => {
  const start = Date.parse('2026-10-13T07:00:00Z'), now = start + 120000;
  let reads=0; const waits=[];
  const deadline=await bindNativeDeadline(async()=>++reads===1?[]:[{name:'Artifact producer',status:'in_progress',started_at:new Date(start).toISOString()}],async ms=>waits.push(ms),()=>now);
  assert.equal(reads,2);assert.deepEqual(waits,[1000]);assert.equal(deadline,start+75*60000);
});

test('native start lookup fails after three reads and cannot substitute the current clock', async () => {
  let reads=0,waits=0;
  await assert.rejects(bindNativeDeadline(async()=>{reads++;return[];},async()=>{waits++;}),/three bounded reads/);
  assert.equal(reads,3);assert.equal(waits,2);
  const start=Date.parse('2026-10-13T07:00:00Z'),job={name:'Artifact producer',status:'in_progress',started_at:new Date(start).toISOString()};
  assert.throws(()=>selectNativeStart([job,job],start+1000),/uniquely/);
  assert.throws(()=>selectNativeStart([job],start+75*60000),/expired/);
});

test('complete real repository inventory survives the default-buffer failure', () => {
  const expected = cp.execFileSync('git', ['ls-files', '-z'], {cwd: ROOT, maxBuffer: 32 * 1024 * 1024});
  assert.ok(expected.length > 1024 * 1024, 'Current real inventory reproduces the native >1 MiB case');
  assert.throws(() => cp.execFileSync('git', ['ls-files', '-z'], {cwd: ROOT, maxBuffer: 1024 * 1024}), error => error.code === 'ENOBUFS');
  assert.deepEqual(c.trackedSourceFiles(ROOT), expected.toString('utf8').split('\0').filter(Boolean).sort());
});

for (const status of [400, 401, 403, 404]) {
  test('native HTTP ' + status + ' cannot retry, decode an error body or leak its content', async () => {
    let reads=0,waits=0,decoded=0;const evidence=[];
    await assert.rejects(bindNativeDeadline(async()=>{reads++;return readNativeJobs({status,ok:false,json:async()=>{decoded++;return{private:'synthetic-key-marker'};}},{runId:'42',attempt:'1'},value=>evidence.push(value));},async()=>{waits++;}),new RegExp('HTTP '+status));
    assert.equal(reads,1);assert.equal(waits,0);assert.equal(decoded,0);assert.doesNotMatch(JSON.stringify(evidence),/synthetic-key-marker/);
    assert.equal(evidence[0].http_status,status);assert.equal(evidence[0].response_body_decoded,false);
  });
}

test('sanitized metadata verifies exact run/attempt and rejects malformed response shape', async () => {
  const evidence=[],request={runId:'42',attempt:'1'},job={name:'Artifact producer',status:'in_progress',run_id:42,run_attempt:1,started_at:'2026-10-13T07:00:00Z'};
  assert.deepEqual(await readNativeJobs({status:200,ok:true,json:async()=>({jobs:[job]})},request,row=>evidence.push(row)),[job]);
  assert.equal(evidence[0].matching_name_count,1);assert.equal(evidence[0].matches[0].run_id_matches,true);
  await assert.rejects(readNativeJobs({status:200,ok:true,json:async()=>({jobs:{private:'synthetic-key-marker'}})},request,()=>{}),/array missing/);
  await assert.rejects(readNativeJobs({status:200,ok:true,json:async()=>({jobs:[{...job,run_attempt:2}]})},request,()=>{}),/identity mismatch/);
});

test('temporary HTTP errors have bounded reads with actual start required', async () => {
  let reads=0,waits=0;const evidence=[];
  await assert.rejects(bindNativeDeadline(async()=>{reads++;return readNativeJobs({status:429,ok:false},{runId:'42',attempt:'1'},row=>evidence.push(row));},async()=>{waits++;}),/three bounded reads/);
  assert.equal(reads,3);assert.equal(waits,2);assert.ok(evidence.every(row=>row.http_status===429));
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-ci-seal-'));
  cp.execFileSync('git', ['init', '--quiet'], {cwd: root});
  cp.execFileSync('git', ['config', 'core.autocrlf', 'false'], {cwd: root});
  fs.writeFileSync(path.join(root, '.gitignore'), 'dist/\nnetlify/\nbundle/\n');
  fs.writeFileSync(path.join(root, 'app.js'), 'original source\n');
  cp.execFileSync('git', ['add', '.'], {cwd: root});
  cp.execFileSync('git', ['-c', 'user.name=CI Fixture', '-c', 'user.email=ci-fixture@example.invalid', 'commit', '--quiet', '-m', 'Synthetic CI fixture'], {cwd: root});
  const binding = {commit: c.git(root, ['rev-parse', 'HEAD']), tree: c.git(root, ['rev-parse', 'HEAD^{tree}']), runId: '1', attempt: '1', deadline: Date.now() + 60000};
  fs.mkdirSync(path.join(root, 'dist/status'), {recursive: true}); fs.mkdirSync(path.join(root, 'netlify/functions/_shared'), {recursive: true});
  fs.writeFileSync(path.join(root, 'dist/index.html'), '<h1>Synthetic sealed artifact</h1>');
  const marker = JSON.stringify({schema_version: 1, commit: binding.commit, built_at: '2026-10-13T00:00:00Z'});
  fs.writeFileSync(path.join(root, 'dist/status/release.json'), marker); fs.writeFileSync(path.join(root, c.MARKER), marker);
  const bundle = path.join(root, 'bundle'), sealed = c.seal(root, bundle, binding, inventory);
  return {root, bundle, manifest: sealed.manifest, expected: {...binding, manifestSha256: sealed.manifestSha256}};
}

test('seal binds exact dist tree, source tree and companion marker without restamping', () => {
  const f = fixture(); assert.equal(c.verify(f.root, f.bundle, f.expected).archiveSha256, f.manifest.archiveSha256);
  assert.equal(c.readJson(path.join(f.root, c.MARKER)).built_at, '2026-10-13T00:00:00Z');
});
for (const mutation of ['artifact', 'marker', 'source', 'unexpected', 'archive', 'manifest']) {
  test('hard integrity gate rejects ' + mutation + ' mutation', () => {
    const f = fixture();
    const targets = {artifact: 'dist/index.html', marker: c.MARKER, source: 'app.js', unexpected: 'dist/extra.txt', archive: 'bundle/payload.tar', manifest: 'bundle/manifest.json'};
    fs.appendFileSync(path.join(f.root, targets[mutation]), ' changed');
    assert.throws(() => c.verify(f.root, f.bundle, f.expected));
  });
}
test('consumer rejects a different commit and overlay/rebuild before extraction', () => {
  const f = fixture(); assert.throws(() => c.restore(f.root, f.bundle, f.expected), /overlay/);
  const different = {...f.expected, commit: 'f'.repeat(40)};
  assert.throws(() => c.boundManifest(f.bundle, different), /binding mismatch/);
});

test('an independent consumer restores exactly one archive and retains producer marker bytes', () => {
  const f = fixture(), consumer = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-ci-consumer-')), 'checkout');
  cp.execFileSync('git', ['-c', 'core.autocrlf=false', 'clone', '--quiet', f.root, consumer]);
  c.restore(consumer, f.bundle, f.expected);
  assert.deepEqual(fs.readFileSync(path.join(consumer, c.MARKER)), fs.readFileSync(path.join(f.root, c.MARKER)));
  assert.deepEqual(c.treeManifest(consumer), f.manifest.dist);
});
