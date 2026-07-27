const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'land-registry-fees', 'index.html'), 'utf8');

assert.match(html, /does not supply a tax rate, registration charge, consent requirement/i);
assert.match(html, /User-entered scenario only - not a legal quote/i);
assert.match(html, /Confirm jurisdiction, valuation basis, exemptions, tax, registry, consent/i);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /Governor's Consent \(State\)|Lagos rates used|R1,210,000|KES 500|stamp duty is 1\.5%/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);

console.log('Day 7 land transfer cost assumption boundary verified.');
