'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { repairFrenchBoqWorkspaceLinks: repair } = require('../scripts/lib/fr-boq-workspace-links');
const root = path.resolve(__dirname, '..');
const english = fs.readFileSync(path.join(root, 'tools/boq-builder/index.html'), 'utf8');
const french = fs.readFileSync(path.join(root, 'fr/tools/devis-quantitatif/index.html'), 'utf8');
const target = '/tools/boq-builder/app';
const owner = { id: 'boq-generator' };
const anchors = html => [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map(m => m[0]);
const workspace = html => anchors(html).filter(a => /href="\/tools\/boq-builder\/app"/.test(a));

assert.equal(repair({ id: 'boq-gen' }, english), english, 'Different BOQ generator owner is unchanged');
const projected = repair(owner, english);
assert.equal(workspace(projected).length, 4, 'All four inherited English app CTAs are repaired');
assert.equal(repair(owner, projected), projected, 'Generation is idempotent');
const originalAnchors = anchors(english), nextAnchors = anchors(projected);
let changed = 0;
for (let i = 0; i < originalAnchors.length; i++) {
  if (originalAnchors[i] === nextAnchors[i]) continue;
  changed++;
  assert.match(originalAnchors[i], /href="app\.html"/);
  assert.match(nextAnchors[i], /hreflang="en"/);
  assert.match(nextAnchors[i], /aria-label="[^"]*\(en anglais\)"/);
  assert.match(nextAnchors[i], />[^<]*\(en anglais\)/);
  assert.equal((originalAnchors[i].match(/<svg\b[\s\S]*$/) || [])[0], (nextAnchors[i].match(/<svg\b[\s\S]*$/) || [])[0], 'Existing arrow artwork preserved');
}
assert.equal(changed, 4);
assert.equal(english.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, '<ANCHOR>'), projected.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, '<ANCHOR>'), 'Every byte outside anchors is unchanged');
assert.equal(workspace(french).length, 4, 'Generated French page contains the four repaired CTAs');
assert.equal(workspace(french).filter(a => /aria-label="Créer un devis \(en anglais\)"/.test(a)).length, 2);
assert.equal(workspace(french).filter(a => /aria-label="Ouvrir l’éditeur de devis \(en anglais\)"/.test(a)).length, 1);
assert(!anchors(french).some(a => /href="app\.html"/.test(a)), 'No nonexistent sibling app CTA remains');
assert(french.includes('data-fr-engineering-owner="boq-generator"'), 'Native French review workflow retained');
for (const a of workspace(french)) {
  assert.match(a, /hreflang="en"/); assert.match(a, /aria-label="[^"]*\(en anglais\)"/); assert.match(a, />[^<]*\(en anglais\)/);
  const u = new URL(target, 'https://afrotools.com/fr/tools/devis-quantitatif/');
  assert.equal(u.pathname, '/tools/boq-builder/app');
  const app = fs.readFileSync(path.join(root, u.pathname.slice(1) + '.html'), 'utf8');
  assert.match(app, /function addItem\(/); assert.match(app, /function exportCSV\(/); assert.match(app, /function exportPDF\(/);
  assert.match(app, /data-no-gate="true" data-no-pdf-gate="true"/);
}
const generation = spawnSync(process.execPath, [path.join(root, 'scripts/build-french-engineering-parity.js'), '--boq-workspace-links-only'], { encoding: 'utf8' });
assert.equal(generation.status, 0, generation.stderr);
assert.match(generation.stdout, /Would change 0 French BOQ workspace-link page/);
const invalid = spawnSync(process.execPath, [path.join(root, 'scripts/build-french-engineering-parity.js'), '--boq-workspace-links-only', '--ids=other'], { encoding: 'utf8' });
assert.notEqual(invalid.status, 0, 'Targeted generation cannot expand to other owners');
console.log('French BOQ workspace CTA source checks passed: 4 targets, visible/accessibility language disclosure, owner scope, idempotence, preserved native review.');


// Exercise the owned module projection and actual shared renderer; the shared
// SaveState implementation is read, never edited or replaced by this fix.
const vm = require('node:vm');
const { test } = require('node:test');
const { repairFrenchBoqSavedWorkspaceRuntime: repairSaved } = require('../scripts/lib/fr-boq-workspace-links');
const legacySavedModule = fs.readFileSync(path.join(root, 'assets/js/pages/engineering-parity/boq-generator-1.js'), 'utf8');
const projectedSavedModule = repairSaved(owner, legacySavedModule);
test('French BOQ saved-workspace admission rejects ambiguous source before idempotence', () => {
  assert.equal(repairSaved({ id: 'boq-gen' }, legacySavedModule), legacySavedModule);
  assert.equal(repairSaved(owner, 'const unrelated = true;'), 'const unrelated = true;');
  assert.equal(repairSaved(owner, projectedSavedModule), projectedSavedModule);
  const legacyCall = legacySavedModule.slice(legacySavedModule.indexOf('renderSavedItems(')).trim();
  const projectedBody = projectedSavedModule.slice(projectedSavedModule.indexOf('function discloseSavedBoqWorkspace'));
  const mixed = [projectedSavedModule + '\n' + legacyCall, legacySavedModule + '\n' + projectedBody];
  for (const input of [...mixed, projectedSavedModule + '\n' + projectedBody, legacySavedModule + '\n' + legacyCall]) {
    assert.throws(() => repairSaved(owner, input), /Ambiguous French BOQ/);
  }
  const unsupported = legacyCall.replace("appUrl: 'app.html'", "appUrl: '/wrong-target'");
  assert.throws(() => repairSaved(owner, unsupported), /Ambiguous French BOQ/);
  assert.throws(() => repairSaved(owner, projectedSavedModule + '\n' + unsupported), /Ambiguous French BOQ/);
  assert.equal(projectedSavedModule.split('\n')[0], legacySavedModule.split('\n')[0], 'Shared import is unchanged');
});

test('actual shared saved-card rendering retains encoded IDs and BOQ-only disclosure after deletion', () => {
  const queue = [], storage = new Map(), parent = { style: {}, classList: { contains: name => name === 'landing-saved' } };
  const makeLink = attributes => ({ attributes, textContent: 'Ouvrir', setAttribute(k,v) { this.attributes[k]=String(v); }, getAttribute(k) { return this.attributes[k]; }, focus() {} });
  const target = { links: [], buttons: [], closest: () => parent,
    querySelectorAll(selector) { return selector === '.saved-card-open' ? this.links : selector === '[data-delete]' ? this.buttons : []; },
    querySelector() { return this.buttons[0] || this.links[0] || null; },
    replaceChildren() { this.links=[];this.buttons=[]; },
    set innerHTML(html) {
      this.links=[...html.matchAll(/<a class="saved-card-open" href="([^"]+)">/g)].map(m=>makeLink({href:m[1]}));
      this.buttons=[...html.matchAll(/<button class="saved-card-delete" data-delete="([^"]+)">/g)].map(m=>({ getAttribute:()=>m[1], addEventListener(type,fn){this.click=fn;},focus(){} }));
    }
  };
  const rootWindow = { document: { documentElement:{lang:'fr'},getElementById:id=>id==='saved-boqs'?target:null }, localStorage: {
    getItem:key=>storage.has(key)?storage.get(key):null,setItem:(key,value)=>storage.set(key,value)
  },confirm:()=>true };
  const box = vm.createContext({ window:rootWindow, document:rootWindow.document, queueMicrotask:fn=>queue.push(fn) });
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/lib/src/save-state.js'),'utf8')+'\nthis.actualSaveApi=createSaveStateApi(window);',box);
  box.renderSavedItems=box.actualSaveApi.renderSavedItems;
  const store=new box.actualSaveApi.SaveState('boq-builder');
  const first=store.save({id:'draft/one ?&',title:'Synthetic first',data:{projName:'Synthetic first'}});
  store.save({id:'draft-two',title:'Synthetic second',data:{projName:'Synthetic second'}});
  vm.runInContext(projectedSavedModule.replace(/^import[^\n]*\n/,''),box);
  assert.equal(parent.style.display,'');assert.equal(target.links.length,2);
  for(const link of target.links){
    const url=new URL(link.getAttribute('href'),'https://afrotools.com/fr/tools/devis-quantitatif/');
    assert.equal(url.pathname,'/tools/boq-builder/app');assert(['draft-two',first.id].includes(url.searchParams.get('id')));
    assert.equal(link.textContent,'Ouvrir ce devis (éditeur en anglais)');assert.equal(link.getAttribute('hreflang'),'en');assert.match(link.getAttribute('aria-label'),/éditeur de devis \(en anglais\)$/);
  }
  target.buttons[0].click({preventDefault(){},stopPropagation(){}});
  assert.equal(target.links.length,1);assert.equal(target.links[0].textContent,'Ouvrir','Actual renderer rerender occurs before local callback');
  assert.equal(queue.length,1);queue.shift()();
  assert.equal(target.links[0].textContent,'Ouvrir ce devis (éditeur en anglais)');assert.equal(target.links[0].getAttribute('hreflang'),'en');
  assert.equal(store.getAll().length,1);assert.equal(storage.has('afrotools-saved-boq-builder'),true);
});
