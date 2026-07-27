const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'tools', 'national-id-guide', 'index.html'),
  'utf8'
);

assert.match(html, /Prepare evidence, not identity data/i);
assert.match(html, /does not collect document numbers, decide eligibility/i);
assert.match(html, /Official-source handoff only/);
assert.match(html, /form\.addEventListener\('reset'/);
assert.match(html, /id="result" aria-live="polite"/);
assert.doesNotMatch(html, /\bfetch\s*\(/, 'planner must not make a network request');
assert.doesNotMatch(html, /localStorage|sessionStorage/, 'planner must not persist identity choices');
assert.doesNotMatch(html, /₦|KES|ZAR|GHS|RWF|\bfee:\s*['"`]?\d/i, 'planner must not embed fees');

console.log('Day 7 national ID evidence boundary verified.');
