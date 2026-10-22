'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const a = require('node:assert/strict');
const root = process.cwd(), input = require('./input.json');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const jhash = v => hash(JSON.stringify(v));
const git = args => cp.execFileSync('git', ['-c', 'gc.auto=0', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 }).trim();
const forbidden = ['.git', '.github', '.codex', '.agents', 'node_modules', 'netlify', 'scripts', 'supabase', 'tests', 'docs', 'reports', 'audit-results', 'artifacts', 'test-results', 'package.json', 'package-lock.json', 'AGENTS.md', '.env', 'data/registry', 'data/automation', 'data/image-generation'];
function inventory() {
  const v = JSON.parse(fs.readFileSync('scripts/ci-artifact-groups.json', 'utf8'));
  a.equal(jhash(v), input.expected_ci_inventory_sha256);
  a.equal(v.originalBuildTimeoutMinutes, 75);
  const original = v.browser.filter(x => input.original_browser_ids.includes(x.id)).map(({ group, ...x }) => x);
  a.equal(original.length, 46);
  a.equal(jhash(original), input.original46_contract_sha256);
  a.equal(v.browser.length, 47);
  a.equal(v.browser.filter(x => x.id === 'browser-47').length, 1);
  return jhash(v);
}
function sourcePins() {
  for (const p of input.source_inputs.filter(x => !x.file.endsWith('.html'))) a.equal(hash(fs.readFileSync(p.file)), p.sha256, p.file);
  for (const p of input.cache_inputs.concat(input.unchanged_guards)) a.equal(hash(fs.readFileSync(p.file)), p.sha256, p.file);
  for (const p of input.absent_files) a.equal(fs.existsSync(p), false, p);
}
function distCheck() {
  a.deepEqual(forbidden.filter(f => fs.existsSync(path.join(root, 'dist', f))), []);
  const marker = JSON.parse(fs.readFileSync('dist/status/release.json', 'utf8'));
  a.equal(marker.context, 'local'); a.equal(marker.production, false); a.equal(marker.commit, process.env.GITHUB_SHA);
  console.log(JSON.stringify({ direct_dist_forbidden: [], marker }));
}
async function main() {
  const mode = process.argv[2];
  if (mode === 'verify') {
    a.equal(git(['rev-parse', 'HEAD']), process.env.GITHUB_SHA);
    a.equal(git(['show', '-s', '--format=%P', 'HEAD']), input.base_sha);
    a.equal(git(['status', '--porcelain', '--untracked-files=all']), '');
    sourcePins();
    for (const p of input.source_inputs) a.equal(hash(fs.readFileSync(p.file)), p.sha256, p.file);
    inventory();
    console.log(JSON.stringify({ status: 'EXACT_DEPENDENCY_SAFE49_HANDOFF_SOURCE_AND_REVIEWED_TECHNICAL_METADATA', source: input.source_inputs.length, producer_handoffs: input.selected_handoff_ids.length, cache: input.cache_inputs.length, original46_unchanged: true, additive_gate: 47, shared_minutes: 75 }));
    return;
  }
  if (mode === 'dist') { distCheck(); return; }
  if (mode === 'targeted') {
    a(input.targeted_node_tests.length > 0);
    const result = cp.spawnSync(process.execPath, ['--test', ...input.targeted_node_tests], { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    a.equal(result.status, 0, 'All selected changed Node test files must pass unfiltered');
    return;
  }
  a.equal(mode, 'export');
  const target = path.join(process.env.RUNNER_TEMP, 'publisher-prep');
  fs.mkdirSync(target, { recursive: true });
  const privateSet = new Set(input.operator_paths);
  const tracked = git(['diff', '--name-only', input.base_sha]).split('\n').filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
  const products = [...new Set([...tracked, ...untracked])].filter(f => !privateSet.has(f)).sort();
  const deletions = git(['diff', '--diff-filter=D', '--name-only', input.base_sha]).split('\n').filter(Boolean);
  a.deepEqual(deletions, []);
  sourcePins();
  const statuses = { build: process.env.BUILD_RESULT, build_checks: process.env.CHECK_RESULT, targeted: process.env.TARGETED_RESULT, security: process.env.SECURITY_RESULT, audit_dist: process.env.DIST_RESULT, direct_dist: process.env.DIRECT_RESULT, fallbacks: process.env.FALLBACK_RESULT, recovery_preflight: process.env.PREFLIGHT_RESULT };
  const inv = inventory(), rows = [];
  const gzip = zlib.createGzip({ level: 6 }), dest = fs.createWriteStream(path.join(target, 'product-postimages.ndjson.gz'));
  gzip.pipe(dest);
  const complete = new Promise((resolve, reject) => { dest.on('finish', resolve); dest.on('error', reject); gzip.on('error', reject); });
  for (const file of products) {
    a(!file.startsWith('/') && !file.includes('\\') && !file.split('/').some(p => p === '..' || p === '.' || !p));
    a(!file.startsWith('.github/') || input.source_inputs.some(p => p.file === file), file);
    const absolute = path.resolve(root, file); a(absolute.startsWith(path.resolve(root) + path.sep));
    const stat = fs.lstatSync(absolute); a(stat.isFile() && !stat.isSymbolicLink(), file);
    const b = fs.readFileSync(absolute), text = b.toString('utf8');
    const binary = !b.equals(Buffer.from(text, 'utf8'));
    if (binary) a(input.source_inputs.some(p => p.file === file && p.binary && p.sha256 === hash(b)), 'Unowned binary output: ' + file);
    const rec = { file, bytes: b.length, sha256: hash(b), git_blob_sha1: crypto.createHash('sha1').update(Buffer.from('blob ' + b.length + '\0')).update(b).digest('hex'), git_mode: stat.mode & 0o111 ? '100755' : '100644', encoding: binary ? 'base64' : 'utf8' };
    if (binary) rec.content_base64 = b.toString('base64'); else rec.content_utf8 = text;
    rows.push({ file, bytes: rec.bytes, sha256: rec.sha256, git_blob_sha1: rec.git_blob_sha1, git_mode: rec.git_mode, encoding: rec.encoding, source: input.source_inputs.some(p => p.file === file) });
    if (!gzip.write(JSON.stringify(rec) + '\n')) await new Promise(resolve => gzip.once('drain', resolve));
  }
  gzip.end(); await complete;
  const ready = Object.values(statuses).every(s => s === 'success');
  const summary = { schema: 1, kind: 'publisher-hosted-cumulative-generation-preparation-not-release-proof', at: new Date().toISOString(), base_sha: input.base_sha, preparation_commit: git(['rev-parse', 'HEAD']), preparation_tree: git(['rev-parse', 'HEAD^{tree}']), run_id: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT, ready_for_review: ready, gate_outcomes: statuses, source_inputs: input.source_inputs, cache_inputs: input.cache_inputs, selected_handoff_ids: input.selected_handoff_ids, publisher_owned_sources: input.publisher_owned_sources, expected_ci_inventory_sha256: inv, original46_contract_sha256: input.original46_contract_sha256, original_gate_count: 46, additive_gate: 47, original_shared_minutes: 75, operator_paths_excluded: input.operator_paths, deletions, untracked_paths: untracked.filter(p => !privateSet.has(p)), product_count: rows.length, products: rows, export_sha256: hash(fs.readFileSync(path.join(target, 'product-postimages.ndjson.gz'))), full_builds_in_this_preparation: 1, full_npm_test: 'NOT_RUN_IN_PREPARATION_REQUIRED_IN_FINAL_NATIVE_VERIFY', main_pushes: 0, deployments: 0, statement: 'Preparatory source generation and targeted tests only. Independently review every final generated/source postimage and composition, create one flat final child of unchanged main, then require the complete native CI with all original46 plus additive Kitchen47 and unchanged75minute clock. Exact artifact, mobile, clean-main channel, production visitor and natural scheduled stock/fuel proof remain mandatory. Failed5e/513 and all raw failures stay preserved.' };
  fs.writeFileSync(path.join(target, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ status: 'CUMULATIVE_PREPARATION_EXPORTED_NOT_RELEASED', ready_for_review: ready, gate_outcomes: statuses, product_count: rows.length, export_sha256: summary.export_sha256, original46_unchanged: true, additive47: true, source_claims_or_production_acceptance: false }));
  if (!ready) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
