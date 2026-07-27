const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'work-permit-cost', 'index.html'), 'utf8');
assert.match(html, /does not supply a permit fee, exchange rate, category/i);
assert.match(html, /User-entered budget only - not an official quote/i);
assert.match(html, /work-permit-cost-assumptions\.txt/);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /const countries = \[|3876|planning timeline|payroll exposure|localStorage\.setItem/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);
console.log('Day 7 work permit cost assumption boundary verified.');
