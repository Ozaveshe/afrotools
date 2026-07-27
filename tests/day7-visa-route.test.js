const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'tools', 'visa-checker', 'index.html'),
  'utf8'
);

assert.match(html, /does not issue a visa verdict/i);
assert.match(html, /No live verdict: official confirmation required/);
assert.match(html, /passport nationality, travel purpose, and planned length of stay/i);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /passportRank|visaFreeCountries|VISA_DATA|USD 30|153 countries/i);
assert.doesNotMatch(html, /\bfetch\s*\(/, 'planner must not make a network request');
assert.doesNotMatch(html, /localStorage|sessionStorage/, 'planner must not persist travel choices');

console.log('Day 7 visa route verification boundary verified.');
