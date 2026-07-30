'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_FILE = process.env.MP66_EVIDENCE_DIR
  ? path.join(process.env.MP66_EVIDENCE_DIR, 'evidence.json')
  : path.join(ROOT, 'reports', 'french-mortgage-property-evidence.json');
const receipt = JSON.parse(
  fs.readFileSync(EVIDENCE_FILE, 'utf8')
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'registry', 'french-mortgage-property.json'), 'utf8')
);
const forbiddenControl = /\b(inscrire|newsletter|register|sign\s*up|subscribe|email|télécharger|download|export|imprimer|print|copier|copy|partager|share)\b/i;

test('fail-closed receipt is exactly 66 accepted physical apps', () => {
  assert.equal(receipt.denominator, 66);
  assert.equal(receipt.rows.length, 66);
  assert.equal(receipt.accepted, 66);
  assert.equal(receipt.blocked, 0);
  assert.equal(Object.hasOwn(manifest, 'accepted'), false);
  assert.equal(Object.hasOwn(manifest, 'blocked'), false);
});

test('static titles and non-calculation CTAs cannot satisfy a workflow oracle', () => {
  for (const row of receipt.rows) {
    const mutation = row.browserProofs.resultMutation;
    assert.equal(mutation.controlOwnedByForm, true, row.englishId);
    assert.equal(forbiddenControl.test(mutation.workflowControl), false, row.englishId);
    assert.notDeepEqual(mutation.before, mutation.after, row.englishId);
    assert.equal(String(mutation.before.text || '').trim(), '', row.englishId);
    assert.ok(String(mutation.after.text || '').trim(), row.englishId);
    assert.ok(row.routeSpecificContract.expectedResults.length > 0, row.englishId);
    for (const expected of row.routeSpecificContract.expectedResults) {
      assert.match(expected.selector, /^\[data-result-field=/, row.englishId);
      assert.notEqual(String(expected.value).trim(), row.englishName.trim(), row.englishId);
      assert.equal(String(mutation.resultFields[expected.label]), String(expected.value), row.englishId);
    }
  }
});

test('every required export has a parsed format-specific oracle', () => {
  for (const row of receipt.rows) {
    assert.equal(row.exportContract.classification, 'required', row.englishId);
    assert.deepEqual(
      row.exportContract.frenchOwner.formats,
      ['copy', 'txt', 'json', 'pdf', 'print'],
      row.englishId
    );
    assert.equal(row.exportContract.finalStatus, 'accepted', row.englishId);
    assert.equal(row.exportContract.privacyGate.localOnly, true, row.englishId);
    assert.equal(row.exportContract.privacyGate.accountOrEmailGate, false, row.englishId);
    assert.equal(row.exportContract.privacyGate.fixtureValueNetworkLeak, false, row.englishId);
    for (const format of ['copy', 'txt', 'json', 'pdf', 'print']) {
      const oracle = row.exportContract.oracles.find(item => item.format === format);
      assert.ok(oracle, `${row.englishId}:${format}`);
      assert.equal(oracle.status, 'parsed-and-accepted', `${row.englishId}:${format}`);
      assert.ok(oracle.evidence, `${row.englishId}:${format}`);
    }
  }
});

test('route contracts remain distinct and bound to English owner source', () => {
  assert.equal(new Set(receipt.rows.map(row => row.engineMode)).size, 66);
  for (const row of receipt.rows) {
    assert.equal(row.engineMode, row.englishId, row.englishId);
    assert.match(row.englishOwnerSourceContract.sha256, /^[a-f0-9]{64}$/, row.englishId);
    assert.equal(row.englishOwnerSourceContract.file.endsWith('/index.html'), true, row.englishId);
    assert.deepEqual(
      row.englishOwnerSourceContract.fixtureBinding.frenchFieldNames,
      row.routeSpecificContract.fields.map(field => field.name),
      row.englishId
    );
    assert.equal(row.artwork.exists, true, row.englishId);
    assert.ok(row.artwork.rendered.currentSrc.includes(row.artwork.url), row.englishId);
    assert.equal(row.artwork.rendered.complete, true, row.englishId);
    assert.ok(row.artwork.rendered.naturalWidth > 0 && row.artwork.rendered.naturalHeight > 0, row.englishId);
    assert.ok(row.artwork.rendered.renderedWidth > 0 && row.artwork.rendered.renderedHeight > 0, row.englishId);
    assert.ok(Math.abs(row.artwork.rendered.naturalAspect - row.artwork.rendered.renderedAspect) < 0.02, row.englishId);
    assert.ok(row.artwork.alt.includes(row.englishName) || row.artwork.alt.length > 20, row.englishId);
    assert.match(row.routeSpecificContract.source.url, /^https?:\/\//, row.englishId);
    assert.equal(row.browserProofs.source.url, row.routeSpecificContract.source.url, row.englishId);
    assert.equal(row.browserProofs.source.support, row.routeSpecificContract.source.support, row.englishId);
    assert.equal(row.browserProofs.source.checkedAt, row.routeSpecificContract.source.checkedAt, row.englishId);
    assert.equal(row.browserProofs.source.freshness, row.routeSpecificContract.source.freshness, row.englishId);
    assert.deepEqual(row.browserProofs.source.confidence, row.routeSpecificContract.source.confidence, row.englishId);
  }
});
