#!/usr/bin/env node
/**
 * Add save-state.js + paye-save.js to all 6 Tier 1 PAYE files
 */
const fs = require('fs');
const path = require('path');

const files = [
  { file: 'nigeria/ng-salary-tax.html', slug: 'ng-salary-tax' },
  { file: 'kenya/ke-paye.html', slug: 'ke-paye' },
  { file: 'ghana/gh-paye.html', slug: 'gh-paye' },
  { file: 'south-africa/za-paye.html', slug: 'za-paye' },
  { file: 'egypt/eg-paye.html', slug: 'eg-paye' },
  { file: 'tanzania/tz-paye.html', slug: 'tz-paye' },
];

let count = 0;

files.forEach(({ file, slug }) => {
  const fp = path.resolve(file);
  if (!fs.existsSync(fp)) { console.log('SKIP (not found): ' + file); return; }

  let c = fs.readFileSync(fp, 'utf8');

  // Skip if already has paye-save
  if (c.includes('paye-save.js')) {
    console.log('SKIP (already has): ' + file);
    return;
  }

  // Insert before </head>: save-state.js + config + paye-save.js
  const inject = `<script type="module" src="/assets/js/lib/save-state.js"></script>\n<script>window.PAYE_SAVE_SLUG='${slug}';</script>\n<script src="/assets/js/lib/paye-save.js" defer></script>\n`;

  c = c.replace('</head>', inject + '</head>');

  fs.writeFileSync(fp, c);
  count++;
  console.log('DONE: ' + file);
});

console.log('\nUpdated ' + count + ' files');
