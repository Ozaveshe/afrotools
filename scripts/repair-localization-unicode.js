#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const fromBase64 = (value) => Buffer.from(value, 'base64').toString('utf8');

const replacements = new Map([
  [fromBase64('w4PGksKiYcOi4oKsxaHCrGEtwp0='), '—'],
  [fromBase64('w4PGksKiYcOi4oKsxaHCrGEtb2U='), '–'],
  [fromBase64('w4PGksKiYS0gYS0t'), '→'],
  [fromBase64('w4PGksOG4oCZw4PigKAnw4PGksOi4oKsxaHDg+KAmsKh'), 'á'],
  [fromBase64('w4PGksOG4oCZw4PigKAnw4PGksOi4oKsxaHDg+KAmsKn'), 'ç'],
  [fromBase64('w4PGksOG4oCZw4PigJrCosODxpLComEtw4XCocOD4oCawqzDg8aSwqJhw6LigqzFocKsw4PigJrCnQ=='), '—'],
  [fromBase64('w4PGksOG4oCZw4PigJrCosODxpLComEtw4XCocOD4oCawqzDg8aSwqJhw6LigqzFocKsw4PigKYi'), '–'],
  [fromBase64('w6LigqzCpg=='), '…'],
  [fromBase64('w6LigqzigJ0='), '—']
]);

const sourcePatternReplacements = new Map([
  [fromBase64('w4PCrg=='), '\\u00c3\\u00ae'],
  [fromBase64('w4PCuQ=='), '\\u00c3\\u00b9'],
  [fromBase64('w4Pigqw='), '\\u00c3\\u20ac'],
  [fromBase64('w4PigLA='), '\\u00c3\\u2030'],
  [fromBase64('w6LigqxceDlk'), '\\u00e2\\u20ac\\x9d']
]);

const repairFiles = [
  'fr/index.html',
  'fr/tools/projection-pension/index.html',
  'fr/tools/ng-nhf/index.html',
  'fr/ghana/gh-paye.html',
  'sw/zimbabwe/index.html',
  'sw/zana/pdf-kwenda-sauti/index.html',
  'sw/zana/alama-za-html/index.html',
  'sw/namibia/index.html',
  'sw/mozambique/index.html',
  'sw/lesotho/index.html',
  'sw/ethiopia/index.html',
  'sw/eswatini/index.html',
  'sw/botswana/index.html'
];

const nfcFiles = [
  'assets/js/components/navbar.js',
  'assets/js/ai/i18n.js',
  'yo/owo-ori-owo-ise/index.html',
  'yo/ibaraenisoro/index.html',
  'yo/awon-ise/kiriiro-risiti/index.html',
  'yo/awon-ise/kiriiro-invoice/index.html',
  'yo/awon-ise/iwon-ajile/index.html',
  'yo/awon-ise/eso-irugbin/index.html'
];

const changed = [];
for (const relative of repairFiles) {
  const file = path.join(ROOT, relative);
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  for (const [broken, repaired] of replacements) content = content.split(broken).join(repaired);
  for (const [broken, escapedPattern] of sourcePatternReplacements) content = content.split(broken).join(escapedPattern);
  content = content.split('&rarr;\uFFFD\uFFFD').join('&rarr;');
  if (content !== before) {
    changed.push(relative);
    if (write) fs.writeFileSync(file, content, 'utf8');
  }
}

for (const relative of nfcFiles) {
  const file = path.join(ROOT, relative);
  const content = fs.readFileSync(file, 'utf8');
  const normalized = content.normalize('NFC');
  if (normalized !== content) {
    changed.push(relative);
    if (write) fs.writeFileSync(file, normalized, 'utf8');
  }
}

if (changed.length && !write) {
  console.error(`Localization Unicode repairs required: ${changed.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`${write ? 'Applied' : 'Validated'} localization Unicode repairs in ${changed.length} file(s).`);
}
