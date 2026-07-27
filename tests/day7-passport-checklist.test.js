const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'tools', 'passport-checklist', 'index.html'),
  'utf8'
);

assert.match(html, /PASSPORT_AUTHORITIES/, 'authority handoff map is required');
assert.doesNotMatch(html, /PASSPORT_FEES/, 'stale built-in passport fee table must stay removed');
assert.doesNotMatch(html, /See exact fees|2026 Fees|R400 at any Post Office/i, 'unsupported fee claims remain');
assert.match(html, /Official check required/, 'result must state the official-check boundary');
assert.match(html, /does not verify a live fee, appointment slot, processing time, or approval status/i);
assert.match(html, /function resetChecklist\(\)/, 'reset path is required');
assert.match(html, /id="resultCard"[^>]+aria-live="polite"/, 'result needs a live region');

console.log('Day 7 passport checklist source boundary verified.');
