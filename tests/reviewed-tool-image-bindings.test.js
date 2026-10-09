'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadBindings, applyReviewedBindings, resolveReviewedToolArtwork } = require('../scripts/lib/reviewed-tool-image-bindings');
const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
const bindings = loadBindings();
function registry(code) { const sandbox = {}; vm.createContext(sandbox); vm.runInContext(code, sandbox); return sandbox; }

test('reviewed aliases are idempotent and preserve all routing and calculator metadata', () => {
  const next = applyReviewedBindings(source);
  assert.equal(applyReviewedBindings(next), next);
  const before = registry(source).AFRO_TOOLS;
  const after = registry(next).AFRO_TOOLS;
  const ids = new Map(bindings.map(row => [row.id, row.source_id]));
  assert.equal(before.length, after.length);
  for (let i = 0; i < before.length; i++) {
    const expected = JSON.parse(JSON.stringify(before[i]));
    if (ids.has(expected.id)) expected.imageId = ids.get(expected.id);
    assert.deepEqual(JSON.parse(JSON.stringify(after[i])), expected, before[i].id);
  }
});

test('route changes, hash drift, duplicate targets and unreviewed rows fail closed', () => {
  const first = bindings[0];
  for (const [change, message] of [
    [{ route: '/sw/wrong-route/' }, /route drift/],
    [{ source_route: '/tools/wrong-source/' }, /route drift/],
    [{ sha256: '0'.repeat(64) }, /hash drift/],
    [{ mapping_evidence: [] }, /Unreviewed/],
    [{ status: 'pending' }, /Unreviewed/],
    [{ path: '/assets/img/tools/../private.webp' }, /Invalid artwork path/],
  ]) assert.throws(() => applyReviewedBindings(source, [{ ...first, ...change }]), message);
  assert.throws(() => applyReviewedBindings(source, [first, first]), /Duplicate/);
  const other = bindings.find(binding => binding.source_id !== first.source_id);
  assert.throws(() => applyReviewedBindings(source, [{ ...other, id: first.id, route: first.route }]), /Existing image conflict/);
});

test('both registry consumers resolve the reviewed canonical asset', () => {
  const context = registry(source);
  for (const binding of bindings) {
    const row = context.AFRO_TOOLS.find(row => row.id === binding.id);
    assert.equal(row.imageId, binding.source_id);
    assert.equal(context.getToolCardImagePath(row), binding.path);
    assert.equal(context.TOOL_CARD_IMAGE_EXTENSIONS[row.imageId], 'webp');
    assert.ok(fs.existsSync(path.join(ROOT, binding.route, 'index.html')), 'Missing localized route ' + binding.route);
    assert.ok(fs.existsSync(path.join(ROOT, binding.source_route, 'index.html')), 'Missing source route ' + binding.source_route);
  }
});

test('page artwork is exact-route scoped and rejects ambiguous or changed evidence', () => {
  const binding = bindings.find(row => row.id === 'zana-kikokotoo-umwagiliaji-sw');
  const fallback = '/assets/img/tools/irrigation-calculator.webp';
  assert.equal(resolveReviewedToolArtwork(binding.route, fallback), binding.path);
  for (const route of ['/tools/irrigation-calculator/', '/fr/outils/irrigation/', '/sw/zana/unreviewed/', binding.route + '?country=KE']) {
    assert.equal(resolveReviewedToolArtwork(route, fallback), fallback);
  }
  assert.throws(() => resolveReviewedToolArtwork(binding.route, fallback, [binding, binding]), /Ambiguous/);
  assert.throws(() => resolveReviewedToolArtwork(binding.route, fallback, [{ ...binding, sha256: '0'.repeat(64) }]), /hash drift/);
  assert.throws(() => resolveReviewedToolArtwork(binding.route, fallback, [{ ...binding, status: 'pending' }]), /Unreviewed/);
});
