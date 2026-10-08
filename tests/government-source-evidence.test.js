const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const repo = path.resolve(__dirname, '..');

function fixture(t, httpStatus = 200) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'government-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'data/government', 'reports', 'government']) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  const script = path.join(root, 'scripts/update-government-source-ledger.js');
  fs.copyFileSync(path.join(repo, 'scripts/update-government-source-ledger.js'), script);
  const manifest = { version: 1, category: 'government', manualReviewRules: [],
    tools: [{ id: 'synthetic', route: '/tools/synthetic/', sourceIds: ['synthetic'] }],
    sources: [{ id: 'synthetic', country: 'XX', authority: 'Synthetic authority',
      title: 'Synthetic notice', url: 'https://synthetic.invalid/notice' }] };
  fs.writeFileSync(path.join(root, 'data/government/official-sources.json'), JSON.stringify(manifest));
  const baseline = { summary: { generatedAt: '2000-01-01T00:00:00.000Z' }, sources: [] };
  const tracked = {
    'data/government/source-status.json': JSON.stringify(baseline),
    'reports/government-source-ledger.md': 'Historical baseline report',
    'government/index.html': '<a href="/tools/synthetic/">Synthetic</a>'
  };
  for (const [file, body] of Object.entries(tracked)) fs.writeFileSync(path.join(root, file), body);
  const preload = path.join(root, 'synthetic-fetch.cjs');
  fs.writeFileSync(preload, `global.fetch = async (url) => ({ status: ${httpStatus}, url,
    headers: { get: (key) => key === 'content-type' ? 'text/html' : null },
    text: async () => '<html><title>Synthetic notice</title><body>Dated synthetic payload</body></html>' });`);
  const run = (...args) => spawnSync(process.execPath, ['--require', preload, script, ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_SHA: 'a'.repeat(40) }
  });
  const unchanged = () => {
    for (const [file, body] of Object.entries(tracked)) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), body);
  };
  return { root, run, unchanged, baseline };
}

test('plain check preserves baseline and produces no files', (t) => {
  const f = fixture(t);
  assert.equal(f.run('--check').status, 0);
  f.unchanged();
  assert.deepEqual(fs.readdirSync(path.join(f.root, 'reports')), ['government-source-ledger.md']);
});

for (const code of [200, 503]) {
  test(`fresh evidence preserves HTTP ${code} results and the original exit status`, (t) => {
    const f = fixture(t, code), output = path.join(f.root, 'check-output');
    const before = Date.now(), result = f.run('--check', '--evidence-dir', output);
    assert.equal(result.status, code === 200 ? 0 : 1, result.stderr);
    const evidence = JSON.parse(fs.readFileSync(path.join(output, 'source-status.json')));
    assert.ok(Date.parse(evidence.summary.generatedAt) >= before);
    assert.ok(Date.parse(evidence.sources[0].checkedAt) >= before);
    assert.equal(evidence.summary.sourceCount, 1);
    assert.equal(evidence.sources[0].httpStatus, code);
    assert.equal(evidence.sources[0].title, 'Synthetic notice');
    assert.match(evidence.sources[0].contentHash, /^[a-f0-9]{64}$/);
    assert.equal(evidence.evidence.baselineGeneratedAt, f.baseline.summary.generatedAt);
    assert.equal(evidence.evidence.sourceRevision, 'a'.repeat(40));
    assert.match(evidence.evidence.manifestSha256, /^[a-f0-9]{64}$/);
    assert.match(evidence.evidence.checkerSha256, /^[a-f0-9]{64}$/);
    assert.equal(evidence.evidence.outcome, code === 200 ? 'pass' : 'fail');
    assert.equal(evidence.evidence.factReview, 'not_performed');
    const report = fs.readFileSync(path.join(output, 'government-source-ledger.md'), 'utf8');
    assert.ok(report.includes(evidence.summary.generatedAt));
    assert.ok(report.includes(`Outcome: ${code === 200 ? 'pass' : 'fail'}`));
    f.unchanged();
  });
}

test('skipped fetching is explicitly labelled and cannot masquerade as healthy probes', (t) => {
  const f = fixture(t), output = path.join(f.root, 'skipped-output');
  assert.equal(f.run('--check', '--no-fetch', `--evidence-dir=${output}`).status, 0);
  const evidence = JSON.parse(fs.readFileSync(path.join(output, 'source-status.json')));
  assert.equal(evidence.evidence.fetchSkipped, true);
  assert.equal(evidence.evidence.outcome, 'fetch_skipped');
  assert.equal(evidence.sources[0].status, 'manual');
  assert.equal(evidence.sources[0].httpStatus, null);
  f.unchanged();
});

test('invalid evidence options cannot overwrite tracked outputs', (t) => {
  const f = fixture(t);
  for (const args of [['--check', '--evidence-dir'], ['--evidence-dir', 'output'],
    ['--check', '--evidence-dir', 'data/government'], ['--check', '--evidence-dir', 'reports']]) {
    assert.equal(f.run(...args).status, 1);
    f.unchanged();
  }
});

test('daily workflow uploads fresh government output and labels transport as a baseline', () => {
  const workflow = fs.readFileSync(path.join(repo, '.github/workflows/source-ledger-checks.yml'), 'utf8');
  assert.match(workflow, /government:sources:check -- --evidence-dir/);
  const governmentUpload = workflow.split('- name: Upload current government source check evidence')[1]
    .split('- name: Upload tracked transport baseline')[0];
  assert.match(governmentUpload, /if: always\(\)/);
  assert.match(governmentUpload, /runner.temp.*government-source-check\/source-status.json/);
  assert.doesNotMatch(governmentUpload, /data\/government\/source-status.json/);
  assert.match(workflow, /name: transport-source-ledger-tracked-baseline/);
});
