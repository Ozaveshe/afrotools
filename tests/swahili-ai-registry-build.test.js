'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ROOT = process.env.AFROTOOLS_TEST_ROOT || path.resolve(__dirname, '..');
const OVERLAY = process.env.AFROTOOLS_TEST_OVERLAY;
function read(file) {
  const candidate = OVERLAY && path.join(OVERLAY, file);
  return fs.readFileSync(candidate && fs.existsSync(candidate) ? candidate : path.join(ROOT, file), 'utf8');
}
const registryTag = '<script src="/assets/js/components/tool-registry.min.js" defer></script>';
const entryTag = '<script src="/assets/js/pages/sw-ai-route-entry.js" defer></script>';
const registryTags = html => [...html.matchAll(/<script\b[^>]*src=["'][^"']*\/tool-registry(?:\.min)?\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)];
function fixture(t) {
  const temporaryParent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temporaryParent, 'afro-sw-registry-'));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), temporaryParent);
    assert(path.basename(resolved).startsWith('afro-sw-registry-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  function write(file, bytes) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  for (const file of ['scripts/prune-unused-registry.js', 'scripts/lib/safe-write.js', 'scripts/update-html-bundles.js', 'scripts/lib/shared-asset-references.js', 'assets/js/ai/tool-manifest.js', 'assets/js/pages/sw-ai-route-entry.js']) write(file, read(file));
  write('assets/js/bundles/manifest.json', '{}');
  function run(script, args = []) {
    const result = spawnSync(process.execPath, [path.join(root, script), ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  return { write, read: file => fs.readFileSync(path.join(root, file), 'utf8'), prune: () => run('scripts/prune-unused-registry.js'), bundles: file => run('scripts/update-html-bundles.js', ['--only=' + file]) };
}
function generatedSwPage() {
  const pages = new Map(['fr/ai/index.html', 'sw/ai/index.html', 'fr/api/index.html', 'sw/api/index.html'].map(file => [path.resolve(ROOT, file), read(file)]));
  const fakeFs = {
    readFileSync: file => pages.has(path.resolve(file)) ? pages.get(path.resolve(file)) : read(path.relative(ROOT, file)),
    existsSync: file => pages.has(path.resolve(file)),
    writeFileSync: (file, content) => pages.set(path.resolve(file), content)
  };
  vm.runInNewContext(read('scripts/build-localized-ai-api-pages.js'), {
    require: name => name === 'fs' ? fakeFs : require(name), __dirname: path.join(ROOT, 'scripts'), module: { exports: {} },
    process: { argv: ['node', 'owner', '--write'] }, console: { log() {}, error() {} }
  });
  return pages.get(path.resolve(ROOT, 'sw/ai/index.html'));
}

test('actual generated Swahili page keeps its registry through bundle update then pruning', t => {
  const f = fixture(t), original = generatedSwPage(), file = 'sw/ai/index.html';
  f.write(file, original);
  assert.equal(registryTags(original).length, 1);
  f.bundles(file);
  assert.equal(registryTags(f.read(file)).length, 1, 'bundle updater correctly keeps the external consumer dependency');
  f.prune();
  const after = f.read(file);
  assert.equal(registryTags(after).length, 1, 'later pruning must not break the working router');
  assert(after.indexOf('tool-registry.min.js') < after.indexOf('sw-ai-route-entry.js'));
  assert.equal((after.match(/class="ai-local-link" href="\/sw\/ai\/\?lang=sw&amp;q=/g) || []).length, 6);
  assert.deepEqual(after.match(/<link\b[^>]*(?:canonical|hreflang)[^>]*>/g), original.match(/<link\b[^>]*(?:canonical|hreflang)[^>]*>/g));
  f.bundles(file); f.prune();
  assert.equal(f.read(file), after, 'the two maintained transforms are idempotent together');
});

test('pruning restores a previously removed registry before the deferred Swahili entry', t => {
  const f = fixture(t), file = 'sw/ai/index.html';
  const original = generatedSwPage();
  const originalEntry = original.match(/<script\b[^>]*src="[^"]*sw-ai-route-entry\.js[^"]*"[^>]*><\/script>/)[0];
  f.write(file, original.replace(registryTags(original)[0][0], ''));
  f.prune();
  const html = f.read(file);
  assert.equal(registryTags(html).length, 1);
  assert(html.includes(originalEntry));
  assert(html.indexOf('tool-registry.min.js') < html.indexOf('sw-ai-route-entry.js'));
  f.prune(); assert.equal(f.read(file), html);
});

test('minified and cachebusted Swahili runtime retains and restores the dependency before navbar', t => {
  const f = fixture(t), entry = '<script src="/assets/js/pages/sw-ai-route-entry.min.js?v=12345678" defer></script>';
  f.write('retained.html', '<html><head>' + registryTag + entry + '</head></html>');
  f.write('restored.html', '<html><head><script src="/assets/js/components/navbar.min.js?v=12345678" defer></script>' + entry + '</head></html>');
  f.prune();
  for (const file of ['retained.html', 'restored.html']) {
    const html = f.read(file);
    assert.equal(registryTags(html).length, 1);
    assert(html.indexOf('tool-registry.min.js') < html.indexOf('sw-ai-route-entry.min.js'));
  }
});

test('ordinary pages still lose unused eager registry and unrelated inline bytes stay exact', t => {
  const f = fixture(t), inline = '<script>window.keep = "exact visitor content";</script>';
  f.write('ordinary.html', '<html><head>' + registryTag + '</head><body>' + inline + '</body></html>');
  f.bundles('ordinary.html'); f.prune();
  const html = f.read('ordinary.html');
  assert.equal(registryTags(html).length, 0); assert(html.includes(inline));
});

test('explicit lazy registry pages keep their loader and no duplicate eager tag', t => {
  const f = fixture(t), loader = '<script>window.lazyEvent="afrotools:lazy-registry";</script>';
  f.write('lazy.html', '<html><head>' + registryTag + entryTag + '</head><body>' + loader + '</body></html>');
  f.prune(); const html = f.read('lazy.html');
  assert.equal(registryTags(html).length, 0); assert(html.includes(loader)); assert(html.includes(entryTag));
});

test('lightweight indexes retain their existing no-eager-registry exception', t => {
  const f = fixture(t);
  for (const file of ['search/index.html', 'salary-tax/index.html']) f.write(file, '<html><head>' + registryTag + entryTag + '</head><body><script>window.AFRO_TOOLS;</script></body></html>');
  f.prune();
  for (const file of ['search/index.html', 'salary-tax/index.html']) assert.equal(registryTags(f.read(file)).length, 0);
});

test('existing inline consumers and related-tools cleanup retain their behavior', t => {
  const f = fixture(t);
  f.write('hub.html', '<html><head>' + registryTag + '</head><body><script>window.AFRO_TOOLS;</script></body></html>');
  f.write('related.html', '<html><head>' + registryTag + '<script src="/assets/js/related-tools-data.min.js" defer></script></head><body><afro-related-tools data-ssr="1"></afro-related-tools></body></html>');
  f.prune();
  assert.equal(registryTags(f.read('hub.html')).length, 1);
  assert.equal(registryTags(f.read('related.html')).length, 0);
  assert(!f.read('related.html').includes('related-tools-data.min.js'));
});
