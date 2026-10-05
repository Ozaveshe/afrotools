const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildReport, verification, fingerprint, REQUIRED_GATES } = require('../scripts/build-hausa-free-app-parity-inventory');

const report = buildReport();
assert.equal(report.rows.length, report.totals.englishFreeApps);
assert.equal(new Set(report.rows.map(row => row.englishId)).size, report.rows.length);
assert.equal(report.totals.excludedPaidRows, 1);
assert.equal(report.rows.find(row => row.englishId === 'cv-builder').state, 'partial-workflow');
assert.equal(report.rows.find(row => row.englishId === 'invoice-generator').accepted, false);
assert.equal(verification({ status: 'accepted' }, 'current').accepted, false);
const evidence = { sourceFingerprint: 'current', sourceFiles: ['engine.js'], testedRevision: 'a'.repeat(40), productionRevision: 'b'.repeat(40), editor: 'fixture editor', independentReviewer: 'fixture reviewer', reviewedAt: '2026-10-05', gates: Object.fromEntries(REQUIRED_GATES.map(gate => [gate, { status: 'passed', receipt: 'fixture proof' }])) };
assert.equal(verification({ status: 'accepted', evidence }, 'current', ['engine.js']).accepted, true);
assert.equal(verification({ status: 'accepted', evidence }, 'changed', ['engine.js']).status, 'needs-revalidation');
assert.equal(verification({ status: 'accepted', evidence }, 'current', ['missing-dependency.js']).accepted, false);
assert.equal(verification({ status: 'accepted', evidence: { ...evidence, gates: { ...evidence.gates, exports: { status: 'failed' } } } }, 'current').accepted, false);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'hausa-parity-fingerprint-'));
try {
  fs.writeFileSync(path.join(temporary, 'engine.js'), 'rate=1');
  const before = fingerprint(['engine.js'], temporary);
  fs.writeFileSync(path.join(temporary, 'engine.js'), 'rate=2');
  assert.notEqual(fingerprint(['engine.js'], temporary), before);
  assert.equal(fingerprint(['missing.js'], temporary), null);
  assert.equal(fingerprint(['../outside.js'], temporary), null);
} finally {
  fs.unlinkSync(path.join(temporary, 'engine.js'));
  fs.rmdirSync(temporary);
}
console.log('Hausa inventory reconciles the English denominator and fails closed on absent or changed evidence.');
