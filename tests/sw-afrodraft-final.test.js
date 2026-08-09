'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

childProcess.execFileSync(process.execPath, ['scripts/build-sw-afrodraft-final.js'], {
  cwd: ROOT,
  stdio: 'pipe'
});

const app = read('sw/zana/afrodraft-cad/app.html');
const landing = read('sw/zana/afrodraft-cad/index.html');
const english = read('engineering/afrodraft/app.html');
const french = read('fr/ingenierie/afrodraft/app.html');
const localizer = read('assets/js/pages/sw-afrodraft-i18n.js');

assert.match(app, /<html\b[^>]*\blang="sw"/);
assert.match(app, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/afrodraft-cad\/app"/);
assert.match(app, /hreflang="en" href="https:\/\/afrotools\.com\/engineering\/afrodraft\/app"/);
assert.match(app, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/ingenierie\/afrodraft\/app"/);
assert.match(app, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/afrodraft-cad\/app"/);
assert.match(app, /"inLanguage":"sw"/);
assert.match(app, /\/assets\/img\/tools\/afrodraft\.webp/);
assert.match(app, /afrotools-source-owner" content="scripts\/build-sw-afrodraft-final\.js"/);

for (const sharedOwner of [
  '/engineering/afrodraft/app.js',
  '/engineering/afrodraft/src/ui/WorkspaceShell.js',
  '/engineering/afrodraft/src/ui/TemplateLauncher.js',
  '/engineering/afrodraft/src/features/v7-features.js'
]) assert.ok(app.includes(sharedOwner), `missing shared owner ${sharedOwner}`);
assert.ok(!/app\.sw\.js|WorkspaceShell\.sw\.js|iframe/i.test(app), 'must not fork or iframe the CAD runtime');

assert.match(landing, /href="\/sw\/zana\/afrodraft-cad\/app"/);
assert.doesNotMatch(landing, /href="\/engineering\/afrodraft\/app(?:\.html)?"/);
assert.match(english, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/afrodraft-cad\/app"/);
assert.match(french, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/afrodraft-cad\/app"/);

for (const requiredOwner of [
  'src/core/Engine.js', 'src/core/DrawingFile.js', 'src/core/LayerManager.js',
  'src/core/BlockManager.js', 'src/core/UndoManager.js', 'src/io/DxfImporter.js',
  'src/io/DxfExporter.js', 'src/io/SvgExporter.js', 'src/io/ImageExporter.js',
  'src/io/PdfExporter.js', 'src/ui/FileWorkflow.js'
]) assert.ok(fs.existsSync(path.join(ROOT, 'engineering/afrodraft', requiredOwner)), `missing ${requiredOwner}`);

assert.match(read('engineering/afrodraft/src/ui/FileWorkflow.js'), /\.adraft,.json,.dxf,.dwg/);
assert.match(read('engineering/afrodraft/src/ui/FileWorkflow.js'), /DWG adapter did not return a usable export/);
assert.match(localizer, /MutationObserver/);
assert.match(localizer, /PdfExporter\.export\(window\.app\.engine, window\.app\.viewport/);
assert.match(localizer, /window\.AfroToolsSwAfroDraft/);
assert.match(localizer, /\/engineering\/afrodraft\/\$\{href/);

console.log('Swahili AfroDraft source-owner, route, shared-runtime and reciprocal contracts passed.');
