const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'budget-comparator', 'index.html'), 'utf8');
assert.match(html, /does not publish built-in allocations, adjusted estimates/i);
assert.match(html, /Arithmetic comparison only - not proof of appropriation/i);
assert.match(html, /whether each figure is proposed, approved, released, spent, or audited/i);
assert.match(html, /form\.addEventListener\('reset'/);
assert.doesNotMatch(html, /var BUDGET_DATA|54990000000000|population: 220000000|2024 estimates/i);
assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/);
console.log('Day 7 budget comparator assumption boundary verified.');
