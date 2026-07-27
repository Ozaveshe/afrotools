const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'foi-template', 'index.html'), 'utf8');

assert.match(html, /does not determine whether a body is covered/i);
assert.match(html, /Draft only - not legal advice, a statutory form, proof of delivery, or a filing/);
assert.match(html, /Confirm the current law, covered body, required form/i);
assert.match(html, /public-information-request-draft\.txt/);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /respond within 7|statutory timeframe of 21|within 14 working days|within 30 days/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);

console.log('Day 7 public-information draft boundary verified.');
