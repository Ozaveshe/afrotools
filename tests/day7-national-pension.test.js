const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'national-pension', 'index.html'), 'utf8');

assert.match(html, /does not supply a current statutory rate/i);
assert.match(html, /Scenario estimate only - not a pension statement or benefit promise/);
assert.match(html, /monthly end-of-period contributions/);
assert.match(html, /contribution definitions, caps, fees, vesting, access, tax, benefit/i);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /employeeRate|employerRate|8% annual compound growth|full pension entitlement/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);

console.log('Day 7 national pension assumption boundary verified.');
