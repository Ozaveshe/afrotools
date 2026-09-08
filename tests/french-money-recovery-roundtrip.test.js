'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const builder=require('../scripts/build-mobile-money-fee-finder');
const guide='fr/blog/frais-orange-money-guide-2026/index.html';
const before=fs.readFileSync(path.join(root,guide),'utf8');
const run=args=>{
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
  return result.stdout;
};
// French-only article: the old lang JSON cannot overwrite it without an English source.
assert.equal(fs.existsSync(path.join(root,'blog/frais-orange-money-guide-2026/index.html')),false);
run(['scripts/build-i18n.js','--lang','fr','--page','blog/frais-orange-money-guide-2026','--overwrite-existing']);
assert.equal(fs.readFileSync(path.join(root,guide),'utf8'),before);
assert.match(before,/<title>Frais Orange Money 2026 : retrait au Cameroun/);
assert.match(before,/ne calcule pas automatiquement les frais Orange Money/);
assert.match(before,/href="\/fr\/tools\/frais-mobile-money\/#mm-form"/);
run(['scripts/build-french-mobile-money-editorial.js']);
run(['scripts/build-mobile-money-fee-finder.js']);
// EN/SW runtime and export boundaries are exercised by french-money-recovery.spec.js.
// The one-time exact baseline output comparison is recorded in the lane handoff;
// this recurring test must also work in a shallow CI checkout.
assert.match(builder.page('fr'),/Orange Money n’est pas inclus dans les tarifs intégrés/);
assert.match(builder.page('fr'),/Saisissez un pays africain de la liste/);
console.log('French money source-owner roundtrip passed.');
