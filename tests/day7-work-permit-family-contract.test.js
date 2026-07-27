const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools/work-permit-cost/index.html'), 'utf8');
const match = html.match(/var sources=(\[[^\n]+\]);\n    var form/);
assert.ok(match, 'work-permit country option array is missing');
const sources = JSON.parse(match[1]);
assert.strictEqual(sources.length, 54, 'work-permit expanded country option count drifted');
assert.strictEqual(new Set(sources.map(row => row[0])).size, 54);
assert.strictEqual(sources.filter(row => row[4]).length, 4, 'bound authority count drifted');
assert.match(html, /Source gap: no immigration authority URL is bound/);
assert.match(html, /does not provide a live fee, category, eligibility rule or approval result/);
console.log('Day 7 work-permit family contract verified for 54 country options with 4 bound authorities and 50 explicit source gaps.');
