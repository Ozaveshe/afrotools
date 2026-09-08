'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const { imageSize } = require('../scripts/lib/image-size');
const { routeFile } = require('../scripts/build-image-library');
const library = require('../data/image-generation/image-library.json');
const batch = require('../data/image-generation/next-200.json');
const intake = require('../data/image-generation/kitchen-import-2026-09-08.json');
assert.equal(intake.images.length, 63);
assert.equal(intake.images.filter(i=>i.status==='placed').length, 60);
assert.equal(intake.images.filter(i=>i.status==='needs-review').length, 3);
assert.equal(new Set(library.images.map(i=>i.path)).size, library.images.length);
for(const entry of intake.images) {
  const file = path.join(ROOT,entry.path);
  const bytes = fs.readFileSync(file);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  if(entry.status!=='placed') continue;
  assert.ok(!fs.existsSync(path.join(ROOT,entry.source)), 'Consolidated input should be moved: '+entry.slug);
  const page = 'tools/afrokitchen/recipes/'+entry.slug+'/index.html';
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  assert.ok(html.includes('src="'+entry.path+'"'), 'Missing recipe img '+entry.slug);
  assert.ok(html.includes('content="https://afrotools.com'+entry.path+'"'));
  const size=imageSize(file);
  assert.ok(html.includes('property="og:image:width" content="'+size.w+'"'));
  // Release-owned metadata must survive the offline image-only regeneration.
  const before=cp.execFileSync('git',['show','HEAD:'+page],{cwd:ROOT,encoding:'utf8',maxBuffer:1024*1024});
  for(const tag of before.match(/<(?:script|link)[^>]*(?:analytics-bootstrap|hreflang=|rel="canonical")[^>]*>/g)||[]) assert.ok(html.includes(tag),'Lost release metadata '+tag);
}
assert.equal(batch.images.length,200);
assert.equal(new Set(batch.images.map(i=>i.id)).size,200);
assert.equal(new Set(batch.images.map(i=>i.path)).size,200);
const stems=new Set(library.images.map(i=>i.path.replace(/\.[^.]+$/,'')));
for(const row of batch.images) {
  assert.ok(routeFile(row.route),'Missing route '+row.route);
  assert.ok(!stems.has(row.path.replace(/\.[^.]+$/,'')),'Already available '+row.path);
  assert.ok(row.prompt.length>250);
  assert.ok(row.locale_reuse);
  if(row.reference_image) assert.ok(fs.existsSync(path.join(ROOT,row.reference_image)));
}
assert.equal(require('../data/image-generation/missing-image-references.json').images.length,0);
const aliases = require('../data/image-generation/recipe-image-aliases.json').aliases;
const sandbox = { window:{} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'tools/afrokitchen/cuisine-intelligence-data.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,'tools/afrokitchen/image-pipeline.js'),'utf8'),sandbox);
for(const [slug,canonical] of Object.entries(aliases)) {
  const expected='/assets/img/kitchen/'+canonical+'.webp';
  assert.equal(sandbox.window.AfroKitchenImages.getCandidatePaths(slug)[0],expected,'Alias must load canonical image before nonexistent probes');
  assert.ok(fs.readFileSync(path.join(ROOT,'tools/afrokitchen/recipes',slug,'index.html'),'utf8').includes('src="'+expected+'"'));
  assert.ok(!batch.images.some(i=>i.path==='/assets/img/kitchen/'+slug+'.webp'),'Aliased recipe must not request a duplicate image');
}
for(const file of ['tool-registry.js','tool-registry.min.js']) {
  const tools = {};
  vm.createContext(tools);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'assets/js/components',file),'utf8'),tools);
  for(const id of require('../data/image-generation/reviewed-shared-artwork.json').tool_ids) {
    const row = tools.AFRO_TOOLS.find(r=>r.id===id);
    assert.ok(row);
    assert.equal(tools.getToolCardImagePath(row),'/assets/img/tools/'+id+'.webp',file+' '+id);
  }
}
console.log('PASS: 63 incoming assets, 60 placements, 6 canonical image aliases, metadata preserved, 200 unique gaps, reference scan clean.');
