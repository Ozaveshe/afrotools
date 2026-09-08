'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
// Keep generator templates and their existing output aligned without regenerating
// unrelated page content. Shared OG fallback is 1200x630, matching page hints.
const repairs = [
  { files:['scripts/build-french-mortgage-property-parity.js','fr/mortgage-property/index.html'], from:'/assets/img/tools/mortgage-property.webp', to:'/assets/img/og-default.png' },
  { files:['scripts/build-sw-energy-remaining-parity.js','sw/nishati-na-huduma/index.html'], from:'/assets/img/category/energy.webp', to:'/assets/img/og-default.png' },
  { files:['data/localization/fr-religious-cultural-parity.json','fr/religion-culture/index.html'], from:'/assets/img/categories/religious-cultural.webp', to:'/assets/img/og-default.png' },
  { files:['fr/tools/calculateur-solaire/index.html','fr/tools/generateur-boq/index.html','tools/boq-generator/index.html','tools/solar-calculator/index.html'], from:'/assets/img/favicon.ico', to:'/favicon.ico' }
];
let changed=0;
for(const repair of repairs) {
  if(!fs.existsSync(path.join(ROOT,repair.to))) throw new Error('Missing replacement '+repair.to);
  for(const file of repair.files) {
    const absolute=path.join(ROOT,file), before=fs.readFileSync(absolute,'utf8');
    const after=before.split(repair.from).join(repair.to);
    if(before===after) continue;
    if(process.argv.includes('--check')) throw new Error('Stale image reference: '+file);
    fs.writeFileSync(absolute,after);changed++;
  }
}
console.log('Image references: '+changed+' repaired');
