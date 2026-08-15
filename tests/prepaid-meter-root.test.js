'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'tools', 'prepaid-meter', 'index.html'), 'utf8');

assert(html.includes('<meta name="robots" content="noindex,follow">'));
assert(html.includes('<link rel="canonical" href="https://afrotools.com/tools/prepaid-meter/">'));
assert(html.includes('Open Electricity Cost &amp; Prepaid Units'));
assert(!html.includes('/data/energy/country-energy-index.js'));
assert(!html.includes('id="pmForm"'));

console.log('Prepaid Meter compatibility route verified: preserved self-canonical URL, noindex, and calculator handoff.');
