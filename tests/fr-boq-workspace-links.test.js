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
