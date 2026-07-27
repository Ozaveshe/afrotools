const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'kenya-dpa', 'index.html'), 'utf8');
assert.match(html, /does not decide whether you are compliant, must register/i);
assert.match(html, /Evidence inventory only - not legal advice, compliance certification/i);
assert.match(html, /No live law, regulation, guidance version, registration status/i);
assert.match(html, /government-verification-planner\.js/, 'shared planner engine must be referenced');
assert.doesNotMatch(html, /Email checklist|unlock PDF|data-workflow-gate|must register as a controller/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);

const engine = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'pages', 'government-verification-planner.js'), 'utf8');
assert.match(engine, /form\.addEventListener\('reset'/);
console.log('Day 7 Kenya DPA evidence boundary verified.');
