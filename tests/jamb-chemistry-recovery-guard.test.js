'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

test('only exact reviewed Chemistry recoveries may replace historical held records', () => {
  const folder = path.join(__dirname, '../ops/jamb/review-candidates/chemistry');
  const file = path.join(folder, 'assert-source-record.cjs');
  const source = fs.readFileSync(file, 'utf8');
  function load(integrated) {
    const mod = { exports: {} };
    new Function('require', 'module', '__dirname', 'process', source)(
      createRequire(file), mod, folder, { argv: integrated ? ['node', 'check', '--integrated'] : ['node', 'check'] });
    return mod.exports;
  }
  const before = load(false), after = load(true);
  let checked = 0;
  for (let n = 1; n <= 6; n++) {
    const batch = JSON.parse(fs.readFileSync(path.join(folder, 'recovery-' + String(n).padStart(3, '0') + '.json')));
    for (const record of batch.records.filter(r => r.candidate)) {
      const historical = JSON.parse(fs.readFileSync(path.join(folder, record.first_pass_file))).records.find(r => r.id === record.id);
      before(record.original_record, historical, record.original_content_sha256);
      assert.throws(() => before(record.candidate, historical, record.original_content_sha256));
      after(record.candidate, historical, record.original_content_sha256);
      const wrong = structuredClone(record.candidate);
      wrong.answer = wrong.answer === 'A' ? 'B' : 'A';
      assert.throws(() => after(wrong, historical, record.original_content_sha256));
      const changed = structuredClone(historical);
      changed.hold_reason += ' altered';
      assert.throws(() => after(record.candidate, changed, record.original_content_sha256));
      checked++;
    }
  }
  assert.equal(checked, 26);
});
