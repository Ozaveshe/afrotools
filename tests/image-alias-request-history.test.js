'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const aliasData = require('../data/image-generation/recipe-image-aliases.json');
const inventory = require('../data/image-generation/image-library.json');
const manifest = require('../tools/afrokitchen/seo-manifest.json');
const batchFile = path.join(ROOT, 'data/image-generation/next-200.json');
const historicalBytes = fs.readFileSync(batchFile);
const historical = JSON.parse(historicalBytes);
const clone = value => JSON.parse(JSON.stringify(value));
const retainedAlternatives = historical.images.filter(row => row.type === 'recipe-hero' &&
  Object.hasOwn(aliasData.aliases, row.path.replace(/^\/assets\/img\/kitchen\//, '').replace(/\.webp$/, '')));
const request = retainedAlternatives[0];
assert.ok(request, 'This regression requires an admitted reviewed alias overlapping a retained request');
const slug = request.path.replace(/^\/assets\/img\/kitchen\//, '').replace(/\.webp$/, '');
const canonical = '/assets/img/kitchen/' + aliasData.aliases[slug] + '.webp';
function input() {
  const images = clone(inventory.images);
  return { images, manifest: clone(manifest), generated_at: inventory.generated_at,
    byPath: new Map(images.map(row => [row.path.replace(/^\//, ''), row])) };
}
function producer({ aliases = aliasData, readAsset } = {}) {
  const writes = new Map(), module = { exports: {} }, logs = [];
  const virtualFs = Object.create(fs);
  virtualFs.mkdirSync = () => {};
  virtualFs.writeFileSync = (file, bytes) => writes.set(path.relative(ROOT, file).replace(/\\/g, '/'), String(bytes));
  virtualFs.readFileSync = (file, encoding) => {
    if (readAsset && String(file).replace(/\\/g, '/').endsWith(canonical)) return readAsset(file, encoding);
    return fs.readFileSync(file, encoding);
  };
  const requireOwner = name => {
    if (name === 'fs') return virtualFs;
    if (name === '../data/image-generation/recipe-image-aliases.json') return aliases;
    if (name === './lib/image-batch-delivery-reconciliation') return require('../scripts/lib/image-batch-delivery-reconciliation');
    if (name === './lib/image-size') return require('../scripts/lib/image-size');
    return require(name);
  };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'scripts/build-image-library.js'), 'utf8'), {
    require: requireOwner, module, __dirname: path.join(ROOT, 'scripts'),
    console: { log: (...args) => logs.push(args) }, process: { argv: ['node', 'source-only', '--batch=2099-01-01'] },
    Buffer, setTimeout, clearTimeout
  }, { filename: path.join(ROOT, 'scripts/build-image-library.js') });
  return { writes, run: library => module.exports.nextBatch(library) };
}

test('genuine new-batch producer omits verified alias duplicates without fulfilling historical requests', () => {
  const p = producer(); p.run(input());
  const pack = JSON.parse(p.writes.get('data/image-generation/next-200.json'));
  assert.equal(pack.images.length, 200);
  for (const row of retainedAlternatives) {
    assert.ok(!pack.images.some(next => next.path === row.path));
    assert.equal(row.status, 'pending');
    assert.equal(row.dimensions, '1200x800');
    assert.notEqual('/assets/img/kitchen/' + aliasData.aliases[row.path.replace(/^\/assets\/img\/kitchen\//, '').replace(/\.webp$/, '')] + '.webp', row.path);
  }
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(batchFile)).digest('hex'), crypto.createHash('sha256').update(historicalBytes).digest('hex'));
  assert.ok([...p.writes.keys()].every(file => /^data\/image-generation\/next-200\.(?:json|csv|md)$/.test(file)));
});

for (const [name, mutate] of [
  ['missing inventory image', library => { library.images = library.images.filter(row => row.path !== canonical); }],
  ['unreviewed image', library => { library.images.find(row => row.path === canonical).text_status = 'not-reviewed'; }],
  ['unreviewed reuse', library => { library.images.find(row => row.path === canonical).locale_reuse = false; }],
  ['held image', library => { library.images.find(row => row.path === canonical).status = 'needs-review'; }],
  ['wrong physical hash binding', library => { library.images.find(row => row.path === canonical).sha256 = '0'.repeat(64); }],
  ['nonmatching recipe placement', library => { library.images.find(row => row.path === canonical).placements = [{ path: 'tools/afrokitchen/recipes/unrelated/index.html' }]; }],
  ['duplicate canonical inventory record', library => { library.images.push(clone(library.images.find(row => row.path === canonical))); }]
]) test('genuine new-batch producer fails closed before writes for ' + name, () => {
  const library = input(); mutate(library); const p = producer();
  assert.throws(() => p.run(library), /alias|canonical/i);
  assert.equal(p.writes.size, 0);
});

test('genuine new-batch producer fails before writes for missing physical canonical bytes', () => {
  const p = producer({ readAsset: () => { throw new Error('Missing canonical alias physical file'); } });
  assert.throws(() => p.run(input()), /canonical alias/); assert.equal(p.writes.size, 0);
});

test('genuine new-batch producer rejects changed physical bytes despite matching inventory review', () => {
  const p = producer({ readAsset: file => { const bytes = Buffer.from(fs.readFileSync(file)); bytes[bytes.length - 1] ^= 1; return bytes; } });
  assert.throws(() => p.run(input()), /physical hash drift/); assert.equal(p.writes.size, 0);
});

test('noncanonical traversal alias never hides a current image request', () => {
  const aliases = clone(aliasData); aliases.aliases[slug] = '../unreviewed'; const p = producer({ aliases });
  assert.throws(() => p.run(input()), /canonical image alias/); assert.equal(p.writes.size, 0);
});

test('without an alias mapping the missing canonical hero request remains eligible', () => {
  const aliases = clone(aliasData); delete aliases.aliases[slug]; const p = producer({ aliases }); p.run(input());
  const pack = JSON.parse(p.writes.get('data/image-generation/next-200.json'));
  assert.ok(pack.images.some(row => row.path === request.path && row.type === 'recipe-hero'));
  assert.equal(request.status, 'pending');
});
