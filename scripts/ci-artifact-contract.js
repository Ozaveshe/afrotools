'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');

const MARKER = 'netlify/functions/_shared/generated-release.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const jsonHash = value => sha(JSON.stringify(value));
const git = (root, args) => cp.execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
const check = (condition, detail) => { if (!condition) throw new Error(detail); };
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function deadlineCheck(deadline, now = Date.now()) {
  check(Number.isSafeInteger(Number(deadline)) && Number(deadline) > now, 'Shared 75-minute deadline expired or invalid');
  return Number(deadline) - now;
}

function treeManifest(root, relative = 'dist') {
  const entries = [];
  function walk(file) {
    check(!/[\x00-\x1f\x7f]/.test(file) && !file.split('/').includes('..'), 'Unsupported artifact path');
    const absolute = path.join(root, file), stat = fs.lstatSync(absolute);
    check(!stat.isSymbolicLink(), 'Artifact/source symlinks are unsupported');
    if (stat.isDirectory()) {
      entries.push({path: file, type: 'directory', mode: stat.mode & 0o777});
      for (const name of fs.readdirSync(absolute).sort()) walk(file + '/' + name);
    } else {
      check(stat.isFile(), 'Unsupported artifact/source file type');
      entries.push({path: file, type: 'file', mode: stat.mode & 0o777, bytes: stat.size, sha256: sha(fs.readFileSync(absolute))});
    }
  }
  walk(relative);
  return entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

function sourceManifest(root) {
  const files = cp.execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean).sort();
  return files.map(file => {
    const entries = treeManifest(root, file);
    check(entries.length === 1 && entries[0].type === 'file', 'Tracked source must be a regular file');
    return entries[0];
  });
}

function sourceClean(root) {
  cp.execFileSync('git', ['diff', '--quiet'], {cwd: root});
  cp.execFileSync('git', ['diff', '--cached', '--quiet'], {cwd: root});
}

function inventoryCheck(inventory) {
  check(inventory.schema === 1 && inventory.groups === 2, 'Unsupported gate inventory');
  check(Array.isArray(inventory.browser) && inventory.browser.length > 0, 'Browser inventory missing');
  const seen = new Set();
  for (const gate of inventory.browser) {
    check(typeof gate.id === 'string' && !seen.has(gate.id), 'Duplicate browser gate');
    seen.add(gate.id);
    check([1, 2].includes(gate.group) && typeof gate.step.run === 'string' && gate.step.run.trim(), 'Invalid browser gate');
    check(Object.keys(gate.step).every(k => ['name', 'run', 'env'].includes(k)), 'Unreviewed step semantics');
    check(!JSON.stringify(gate.step).replaceAll('${{ runner.temp }}', '').includes('${{'), 'Unreviewed browser expression');
    check(gate.stepSha256 === jsonHash(gate.step), 'Original browser command/environment changed');
  }
  check([1, 2].every(group => inventory.browser.some(g => g.group === group)), 'Empty browser runner');
  return jsonHash(inventory);
}

function seal(root, output, binding, inventory) {
  deadlineCheck(binding.deadline);
  inventoryCheck(inventory);
  sourceClean(root);
  check(git(root, ['rev-parse', 'HEAD']) === binding.commit, 'Seal commit mismatch');
  check(git(root, ['rev-parse', 'HEAD^{tree}']) === binding.tree, 'Seal source tree mismatch');
  const dist = treeManifest(root), marker = treeManifest(root, MARKER)[0], source = sourceManifest(root);
  const release = readJson(path.join(root, 'dist/status/release.json'));
  const companion = readJson(path.join(root, MARKER));
  check(release.commit === binding.commit && typeof release.built_at === 'string', 'Release marker identity mismatch');
  check(JSON.stringify(release) === JSON.stringify(companion), 'Release markers disagree');
  const manifest = {schema: 1, ...binding, inventorySha256: jsonHash(inventory), distTreeSha256: jsonHash(dist), sourceTreeSha256: jsonHash(source), dist, marker, source};
  fs.mkdirSync(output, {recursive: true});
  const archive = path.join(output, 'payload.tar');
  cp.execFileSync('tar', ['-cf', archive, 'dist', MARKER], {cwd: root});
  manifest.archiveSha256 = sha(fs.readFileSync(archive));
  const file = path.join(output, 'manifest.json');
  fs.writeFileSync(file, JSON.stringify(manifest) + '\n');
  deadlineCheck(binding.deadline);
  return {manifest, manifestSha256: sha(fs.readFileSync(file))};
}

function boundManifest(bundle, expected, now = Date.now()) {
  const file = path.join(bundle, 'manifest.json');
  check(/^[a-f0-9]{64}$/.test(expected.manifestSha256 || ''), 'Expected manifest hash missing');
  check(sha(fs.readFileSync(file)) === expected.manifestSha256, 'Sealed manifest changed');
  const manifest = readJson(file);
  check(manifest.schema === 1, 'Invalid seal schema');
  for (const field of ['commit', 'tree', 'runId', 'attempt', 'deadline']) {
    check(String(manifest[field]) === String(expected[field]), 'Seal binding mismatch: ' + field);
  }
  deadlineCheck(manifest.deadline, now);
  check(sha(fs.readFileSync(path.join(bundle, 'payload.tar'))) === manifest.archiveSha256, 'Artifact archive mismatch');
  return manifest;
}

function restore(root, bundle, expected) {
  const manifest = boundManifest(bundle, expected);
  check(!fs.existsSync(path.join(root, 'dist')), 'Consumer must not rebuild or overlay dist');
  check(git(root, ['rev-parse', 'HEAD']) === manifest.commit && git(root, ['rev-parse', 'HEAD^{tree}']) === manifest.tree, 'Consumer source identity differs');
  // Hash-verified producer archives contain only regular files/directories; no untrusted archive is extracted.
  cp.execFileSync('tar', ['-xf', path.join(bundle, 'payload.tar')], {cwd: root});
  verify(root, bundle, expected);
  return manifest;
}

function verify(root, bundle, expected) {
  const manifest = boundManifest(bundle, expected);
  check(git(root, ['rev-parse', 'HEAD']) === manifest.commit && git(root, ['rev-parse', 'HEAD^{tree}']) === manifest.tree, 'Source identity mismatch');
  sourceClean(root);
  check(jsonHash(treeManifest(root)) === manifest.distTreeSha256, 'Dist tree changed');
  check(JSON.stringify(treeManifest(root, MARKER)[0]) === JSON.stringify(manifest.marker), 'Companion release marker changed');
  check(jsonHash(sourceManifest(root)) === manifest.sourceTreeSha256, 'Tracked source bytes changed');
  return manifest;
}

function aggregate(inventory, manifest, reports, needs, now = Date.now()) {
  inventoryCheck(inventory);
  deadlineCheck(manifest.deadline, now);
  check(needs.artifact?.result === 'success' && needs.browser?.result === 'success', 'Producer/browser job failed, skipped or cancelled');
  check(reports.length === 2, 'Missing or duplicate group reports');
  const groups = new Set(), seen = new Set();
  for (const report of reports) {
    check([1, 2].includes(report.group) && !groups.has(report.group), 'Duplicate/unknown report group');
    groups.add(report.group);
    check(report.status === 'success' && report.integrity === 'pass' && report.setup === 'pass', 'Group failed, skipped or cancelled');
    for (const key of ['commit', 'tree', 'runId', 'attempt', 'deadline', 'inventorySha256', 'distTreeSha256', 'sourceTreeSha256', 'archiveSha256']) {
      check(String(report[key]) === String(manifest[key]), 'Report artifact/source binding mismatch: ' + key);
    }
    for (const gate of report.gates || []) {
      const original = inventory.browser.find(g => g.id === gate.id);
      check(original && original.group === report.group && !seen.has(gate.id), 'Duplicate/unknown/misassigned gate');
      seen.add(gate.id);
      check(gate.status === 'success' && gate.exitCode === 0 && gate.stepSha256 === original.stepSha256, 'Original gate failed, skipped, cancelled or changed');
    }
  }
  check(manifest.inventorySha256 === jsonHash(inventory), 'Gate inventory differs from seal');
  check(seen.size === inventory.browser.length && inventory.browser.every(g => seen.has(g.id)), 'Original browser gate missing');
  return true;
}

module.exports = {MARKER, sha, jsonHash, readJson, check, git, deadlineCheck, treeManifest, sourceManifest, sourceClean, inventoryCheck, seal, boundManifest, restore, verify, aggregate};
