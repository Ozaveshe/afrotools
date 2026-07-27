const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'insurance', 'index.html'), 'utf8');
const routes = [...html.matchAll(/href="(\/tools\/[^"]+\/)"/g)].map((match) => match[1]);
assert.strictEqual(new Set(routes).size, 16, 'insurance hub must link exactly 16 canonical apps');
assert.match(html, /That is not 322 separately accepted canonical apps/);
assert.match(html, /do not bind cover, issue a policy, verify an insurer/i);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /premiums as low as|South Africa leads at|mandatory in all 54|Real premium ranges/i);
console.log('Day 7 insurance hub boundary verified for 16 canonical routes.');
