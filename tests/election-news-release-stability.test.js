'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const test = require('node:test');

const repo = path.resolve(__dirname, '..');
const manifestFile = 'assets/js/bundles/manifest.json';
const newsPrefix = 'tools/africa-election-tracker/news/';
const seedFiles = [
  'scripts/generate-election-news.js', 'scripts/update-html-bundles.js',
  'scripts/lib/shared-asset-references.js', 'scripts/lib/content-integrity.js',
  'data/government/election-news.json', 'data/government/africa-election-tracker.json',
  'data/government/official-sources.json', manifestFile,
  'assets/js/analytics-bootstrap.js', 'assets/js/lazy-analytics.js',
  'assets/js/components/navbar.min.js', 'assets/js/components/footer.min.js',
  'assets/css/design-system.min.css', 'assets/css/global.min.css',
  'tools/africa-election-tracker/index.html', newsPrefix + 'feed.xml'
];

// Execute both maintained owners against a private in-memory filesystem. No
// generated page, manifest, asset, or editorial source in the repo is written.
function fixture() {
  const root = path.resolve(repo, '.synthetic-election-news');
  const store = new Map(seedFiles.map(file => [file, fs.readFileSync(path.join(repo, file))]));
  const news = JSON.parse(store.get('data/government/election-news.json'));
  const tracker = JSON.parse(store.get('data/government/africa-election-tracker.json'));
  const official = JSON.parse(store.get('data/government/official-sources.json'));
  const htmlFiles = [newsPrefix + 'index.html', ...news.articles.map(article => newsPrefix + article.slug + '/index.html')];
  for (const file of htmlFiles) store.set(file, fs.readFileSync(path.join(repo, file)));
  const manifest = JSON.parse(store.get(manifestFile));
  store.set(manifest.chat.path.slice(1), Buffer.from('/* synthetic existing chat bundle */'));
  const original = new Map(store);
  const writes = [];
  const cache = new Map();
  function relative(file) {
    const key = path.relative(root, path.resolve(file)).split(path.sep).join('/');
    assert.ok(key && !key.startsWith('../') && !path.isAbsolute(key), 'Owner escaped the synthetic filesystem');
    return key;
  }
  const fakeFs = {
    existsSync(file) {
      const key = relative(file);
      return store.has(key) || [...store.keys()].some(item => item.startsWith(key + '/'));
    },
    readFileSync(file, encoding) {
      const key = relative(file);
      assert.ok(store.has(key), 'Missing synthetic input: ' + key);
      return encoding ? store.get(key).toString('utf8') : Buffer.from(store.get(key));
    },
    writeFileSync(file, body) {
      const key = relative(file);
      assert.ok(htmlFiles.includes(key) || key === newsPrefix + 'feed.xml' || key === 'tools/africa-election-tracker/index.html', 'Unexpected owner output: ' + key);
      store.set(key, Buffer.from(body));
      writes.push(key);
    },
    mkdirSync() {},
    readdirSync(file) {
      const prefix = relative(file) + '/';
      const entries = new Map();
      for (const item of store.keys()) if (item.startsWith(prefix)) {
        const suffix = item.slice(prefix.length), name = suffix.split('/')[0], directory = suffix.includes('/');
        entries.set(name, {name, isDirectory: () => directory, isFile: () => !directory});
      }
      return [...entries.values()];
    }
  };
  function load(file, argv = ['node', file]) {
    if (cache.has(file)) return cache.get(file);
    const module = {exports: {}};
    function localRequire(id) {
      if (id === 'fs') return fakeFs;
      if (id === 'path' || id === 'crypto') return require(id);
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), id + (id.endsWith('.js') ? '' : '.js')));
      if (target === 'scripts/lib/safe-write.js') return {writeFileSyncWithRetry: (...args) => fakeFs.writeFileSync(...args)};
      assert.ok(store.has(target), 'Unexpected owner dependency: ' + id);
      return load(target);
    }
    localRequire.main = {};
    vm.runInNewContext(store.get(file).toString('utf8'), {
      require: localRequire, module, exports: module.exports,
      __dirname: path.join(root, path.dirname(file)), __filename: path.join(root, file),
      process: {argv, exit(code) {throw new Error('Unexpected owner exit: ' + code);}},
      console: {log() {}, error(message) {throw new Error(String(message));}},
      Buffer, URL, Intl, Date, Atomics, SharedArrayBuffer, Int32Array
    }, {filename: file});
    cache.set(file, module.exports);
    return module.exports;
  }
  const owner = load('scripts/generate-election-news.js');
  function updateBundles() {
    cache.delete('scripts/update-html-bundles.js');
    load('scripts/update-html-bundles.js', ['node', 'scripts/update-html-bundles.js', '--only=' + htmlFiles.join(',')]);
  }
  function changeNav() {
    store.set('assets/js/components/navbar.min.js', Buffer.concat([store.get('assets/js/components/navbar.min.js'), Buffer.from('\n/* synthetic navbar rebuild */')]));
  }
  function assertChat(expected) {
    for (const file of htmlFiles) {
      const html = store.get(file).toString('utf8');
      assert.equal((html.match(/data-chat-bundle=/g) || []).length, 1, file + ' needs exactly one release pointer');
      assert.ok(html.startsWith('<!doctype html>\n<html data-chat-bundle="' + expected + '" lang="en">'), file + ' must use the current manifest pointer');
    }
  }
  return {store, original, writes, owner, news, tracker, official, htmlFiles, manifest, updateBundles, changeNav, assertChat};
}

test('late news rewrite retains the release pointer and the next asset pass is byte stable', () => {
  const f = fixture();
  f.updateBundles();
  const before = new Map(f.store);
  f.writes.length = 0;
  f.changeNav();
  const navHash = crypto.createHash('md5').update(f.store.get('assets/js/components/navbar.min.js').toString('utf8').replace(/\r\n?/g, '\n')).digest('hex').slice(0, 8);
  f.owner.main();
  assert.deepEqual(f.writes.slice().sort(), f.htmlFiles.slice().sort(), 'Only the four news HTML pages should be regenerated');
  f.assertChat(f.manifest.chat.path);
  for (const file of f.htmlFiles) {
    const expected = before.get(file).toString('utf8').replace(/(navbar\.min\.js\?v=)[0-9a-f]{8}/g, '$1' + navHash);
    assert.equal(f.store.get(file).toString('utf8'), expected, 'No content/schema/other asset change: ' + file);
  }
  f.writes.length = 0;
  f.updateBundles();
  f.owner.main();
  assert.deepEqual(f.writes, [], 'A second asset/news sequence must have no generated drift');
  assert.ok(f.store.get(newsPrefix + 'feed.xml').equals(f.original.get(newsPrefix + 'feed.xml')));
  assert.ok(f.store.get('tools/africa-election-tracker/index.html').equals(f.original.get('tools/africa-election-tracker/index.html')));
});

test('new news pages and later manifest changes use the current release bundle', () => {
  const f = fixture();
  for (const file of f.htmlFiles) f.store.delete(file);
  f.owner.main();
  f.assertChat(f.manifest.chat.path);
  f.writes.length = 0;
  f.updateBundles();
  f.owner.main();
  assert.deepEqual(f.writes, []);

  const next = '/assets/js/bundles/chat.1234abcd.min.js';
  f.store.set(manifestFile, Buffer.from(JSON.stringify({...f.manifest, chat: {...f.manifest.chat, path: next}})));
  f.store.set(next.slice(1), Buffer.from('/* synthetic next bundle */'));
  f.updateBundles();
  f.changeNav();
  f.owner.main();
  f.assertChat(next);
  f.writes.length = 0;
  f.updateBundles();
  f.owner.main();
  assert.deepEqual(f.writes, [], 'No stale cached manifest pointer after an asset rebuild');
});

test('missing, malformed or unsafe chat metadata fails before any news write', () => {
  const invalidPaths = [undefined, '', 'https://example.org/chat.1234abcd.min.js', '//example.org/chat.1234abcd.min.js',
    '/assets/js/bundles/../chat.1234abcd.min.js', '/assets/js/bundles/chat.1234abcd.min.js?x=1',
    '/assets/js/bundles/chat.1234abcd.min.js" onload="bad', '/assets/js/bundles/core.1234abcd.min.js'];
  for (const chatPath of invalidPaths) {
    const f = fixture();
    f.store.set(manifestFile, Buffer.from(JSON.stringify({...f.manifest, chat: {path: chatPath}})));
    assert.throws(() => f.owner.main(), /chat bundle/i, String(chatPath));
    assert.deepEqual(f.writes, []);
  }
  for (const kind of ['missing-manifest', 'malformed-manifest', 'missing-bundle']) {
    const f = fixture();
    if (kind === 'missing-manifest') f.store.delete(manifestFile);
    if (kind === 'malformed-manifest') f.store.set(manifestFile, Buffer.from('{invalid'));
    if (kind === 'missing-bundle') f.store.delete(f.manifest.chat.path.slice(1));
    assert.throws(() => f.owner.main(), /chat bundle/i, kind);
    assert.deepEqual(f.writes, []);
  }
});
