'use strict';

const fs = require('fs');
const path = require('path');
const {
  buildStaticExportContract
} = require('./lib/french-finance-export-contract');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_FILE = path.join(ROOT, 'data', 'registry', 'french-finance-tax-market-data.json');
const INVENTORY_FILE = path.join(ROOT, 'reports', 'french-free-app-parity-inventory.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
const inventory = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
const inventoryByEnglish = new Map(inventory.rows.map((row) => [row.englishRoute, row]));
const SCRIPT_SRC = '/assets/js/pages/french-finance-export-contract.js';
const START = '<!-- french-finance-export-contract:start -->';
const END = '<!-- french-finance-export-contract:end -->';
const blockPattern = new RegExp(`${START}[\\s\\S]*?${END}\\s*`, 'g');

let changed = 0;
let required = 0;
let notApplicable = 0;

for (const row of manifest.rows) {
  const ownership = inventoryByEnglish.get(row.englishRoute);
  if (!ownership || !ownership.primaryFrenchFile) throw new Error(`French owner not found: ${row.englishRoute}`);
  const file = path.join(ROOT, ownership.primaryFrenchFile);
  if (!fs.existsSync(file)) throw new Error(`French route file not found: ${row.frenchRoute}`);
  const original = fs.readFileSync(file, 'utf8');
  const withoutBlock = original.replace(blockPattern, '');
  const contract = buildStaticExportContract(ROOT, {
    ...row,
    primaryFrenchFile: ownership.primaryFrenchFile,
    primaryFrenchRoute: ownership.primaryFrenchRoute
  }, withoutBlock);
  const formats = [...new Set([
    ...contract.englishOwner.formats,
    ...contract.frenchOwner.formats
  ].map((format) => format === 'download' ? 'ics' : format))].sort();
  let updated = withoutBlock;
  if (formats.length) {
    required += 1;
    const config = JSON.stringify({
      schemaVersion: 1,
      englishId: row.englishId,
      englishRoute: row.englishRoute,
      frenchRoute: row.frenchRoute,
      formats
    }).replace(/</g, '\\u003c');
    const block = `${START}\n<script type="application/json" id="afrotools-fr-finance-export-contract">${config}</script>\n<script src="${SCRIPT_SRC}" defer></script>\n${END}\n`;
    const bodyMatches = [...updated.matchAll(/<\/body>/gi)];
    if (!bodyMatches.length) throw new Error(`Missing </body>: ${path.relative(ROOT, file)}`);
    const bodyIndex = bodyMatches[bodyMatches.length - 1].index;
    updated = `${updated.slice(0, bodyIndex)}${block}${updated.slice(bodyIndex)}`;
  } else {
    notApplicable += 1;
  }
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({
  rows: manifest.rows.length,
  required,
  notApplicable,
  changed,
  script: SCRIPT_SRC
}, null, 2));
