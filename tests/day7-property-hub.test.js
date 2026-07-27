const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'mortgage-property', 'index.html'), 'utf8');
const routes = [...html.matchAll(/href="(\/tools\/[^"]+\/)"/g)].map(match => match[1]);
assert.strictEqual(new Set(routes).size, 28, 'property hub must link exactly 28 canonical routes');
assert.match(html, /20 registry rows categorised as legal/);
assert.match(html, /8 Finance or Engineering adjuncts/);
assert.match(html, /67 English legal rows/);
assert.match(html, /47 legal\/compliance rows are outside/);
assert.match(html, /do not approve loans, verify title, value property, issue permits/i);
assert.doesNotMatch(html, /Nigeria NHF|SARS 1-Apr|planning-grade defaults checked|use each country's own statutory bands/i);
console.log('Day 7 property hub boundary verified for 28 routes with 20 legal + 8 adjunct ownership.');
