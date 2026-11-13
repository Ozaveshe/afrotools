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
const permitSourceIds = new Set(ledger.tools.find(tool => tool.id === 'work-permit-cost').sourceIds);
const sources = new Map();
for (const source of ledger.sources) {
  if (permitSourceIds.has(source.id) && source.country && source.workPermitUrl) {
    if (sources.has(source.country)) throw new Error(`Multiple work permit sources for ${source.country}`);
    sources.set(source.country, source);
  }
}
const rows = countries.map(country => {
  const source = sources.get(country.code);
  return [
    country.code,
    country.name,
    country.currency,
    source ? source.authority : '',
    source ? source.workPermitUrl : '',
  ];
});
const file = path.join(root, 'tools/work-permit-cost/index.html');
const html = fs.readFileSync(file, 'utf8');
const replacement = `var sources=${JSON.stringify(rows).replace(/</g, '\\u003c')};\n    var form`;
const sourceMarker = /var sources=\[[\s\S]*?\];\r?\n    var form/;
if (!sourceMarker.test(html)) throw new Error('Work permit source array marker not found');
const next = html.replace(sourceMarker, replacement);
if (next !== html) fs.writeFileSync(file, next, 'utf8');
console.log(
  `${next === html ? 'Verified' : 'Built'} ${rows.length} work-permit country options ` +
  `(${rows.filter(row => row[4]).length} bound authorities).`,
);
