'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(root, 'data/insurance/country-insurance-index.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(dataCode, sandbox);
const countries = Object.values(sandbox.window.AfroTools.insuranceData.countries).sort((a, b) => a.name.localeCompare(b.name));
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data/government/official-sources.json'), 'utf8'));
const sources = new Map();
for (const source of ledger.sources) {
  if (source.country && /immigration|home affairs/i.test(`${source.authority || ''} ${source.title || ''}`) && !sources.has(source.country)) {
    sources.set(source.country, source);
  }
}
const rows = countries.map(country => {
  const source = sources.get(country.code);
  return [country.code, country.name, country.currency, source ? source.authority : '', source ? source.url : ''];
});
const file = path.join(root, 'tools/work-permit-cost/index.html');
const html = fs.readFileSync(file, 'utf8');
const replacement = `var sources=${JSON.stringify(rows).replace(/</g, '\\u003c')};\n    var form`;
const next = html.replace(/var sources=\[[\s\S]*?\];\r?\n    var form/, replacement);
if (next === html) throw new Error('Work permit source array marker not found');
fs.writeFileSync(file, next, 'utf8');
console.log(`Built ${rows.length} work-permit country options (${rows.filter(row => row[4]).length} bound authorities).`);
