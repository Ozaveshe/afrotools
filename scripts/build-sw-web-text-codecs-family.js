#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const owners = [
  'sw/zana/kusimba-url/index.html',
  'sw/zana/alama-za-html/index.html'
];

const contracts = {
  'sw/zana/kusimba-url/index.html': {
    required: [
      'href="/sw/zana-za-developer/"',
      'aria-label="Eneo la kufanyia kazi URL"',
      'aria-label="Uchunguzi wa URL"',
      'Herufi zilizohifadhiwa, herufi zisizohifadhiwa na sintaksia ya jumla ya URI.',
      'outline:3px solid #0b4ea2!important',
      'outline-color:#fbbf24!important'
    ],
    forbidden: ['href="/developer-tools/"', 'aria-label="URL workbench"', 'aria-label="URL diagnostics"', 'Reserved characters, unreserved characters']
  },
  'sw/zana/alama-za-html/index.html': {
    required: [
      'class="codec-action-row"',
      'button-label="Shiriki matokeo"',
      'Hakuna upakiaji wa lazima',
      'outline:3px solid #0b4ea2!important',
      'outline-color:#fbbf24!important'
    ],
    forbidden: ['class="action-row"', 'Share as Image', 'Hakuna upakiaji ya lazima']
  }
};

function maintain(source) {
  return source
    .replace(/\n?<script class="sw-dev-runtime-localizer">[\s\S]*?<\/script>\s*/g, '\n')
    .replace(/\s+lang="en"\s+data-explicit-language-fallback="true"/g, '');
}

let stale = false;
for (const relative of owners) {
  const file = path.join(root, relative);
  const before = fs.readFileSync(file, 'utf8');
  const after = maintain(before);
  if (after.includes('sw-dev-runtime-localizer') || after.includes('data-explicit-language-fallback')) {
    throw new Error(`generic localization fallback remains in ${relative}`);
  }
  const contract = contracts[relative];
  for (const snippet of contract.required) {
    if (!after.includes(snippet)) throw new Error(`required maintained contract missing in ${relative}: ${snippet}`);
  }
  for (const snippet of contract.forbidden) {
    if (after.includes(snippet)) throw new Error(`forbidden residue remains in ${relative}: ${snippet}`);
  }
  if (after !== before) {
    stale = true;
    if (write) fs.writeFileSync(file, after, 'utf8');
    else console.error(`stale maintained Swahili owner: ${relative}`);
  }
}

if (stale && !write) process.exitCode = 1;
else console.log(`${write ? 'updated' : 'verified'} ${owners.length} exact Swahili web-text codec owners`);
