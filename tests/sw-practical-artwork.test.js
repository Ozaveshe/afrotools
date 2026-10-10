'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const test = require('node:test');
const root = path.resolve(__dirname, '..');

function capture(file, args) {
  const filename = path.join(root, file), writes = new Map(), directories = [];
  const nativeRequire = createRequire(filename), module = { exports: {} };
  const fakeFs = { ...fs, existsSync: () => false,
    mkdirSync: directory => directories.push(directory),
    writeFileSync: (target, value) => writes.set(path.relative(root, target).replace(/\\/g, '/'), value) };
  function localRequire(id) {
    if (id === 'fs') return fakeFs;
    if (id === './lib/safe-write') return { writeFileSyncWithRetry: fakeFs.writeFileSync };
    return nativeRequire(id);
  }
  localRequire.main = module;
  const context = { require: localRequire, module, exports: module.exports, __dirname: path.dirname(filename),
    __filename: filename, process: { argv: ['node', filename, ...args], exitCode: 0 }, console: { log() {}, error() {} } };
  let error;
  try { vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename }); } catch (caught) { error = caught; }
  return { writes, directories, error };
}

test('selected practical owners emit only their named pages and the same content as full generation', () => {
  for (const [owner, selection, expected] of [
    ['scripts/build-sw-fintech-community-credit.js', 'sacco-calc', ['sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/index.html']],
    ['scripts/generate-sw-uniquely-african-parity.js', 'fuel-cost,okada-income', ['sw/zana/gharama-za-mafuta/index.html', 'sw/zana/mapato-ya-okada-boda/index.html']]
  ]) {
    const selected = capture(owner, ['--write', '--apps=' + selection]);
    assert.ifError(selected.error);
    assert.deepEqual([...selected.writes.keys()].sort(), expected.sort());
    const full = capture(owner, ['--write', '--full']);
    // The African full generator requires existing native pages; compare captured selected owners before that guard.
    for (const file of expected) assert.equal(selected.writes.get(file), full.writes.get(file), file);
    for (const value of selected.writes.values()) assert.match(value, /assets\/img\/tools\/zana-[a-z-]+-sw\.webp/);
  }
});

test('invalid practical owner selections fail before any writes or directory creation', () => {
  for (const owner of ['scripts/build-sw-fintech-community-credit.js', 'scripts/generate-sw-uniquely-african-parity.js']) {
    for (const name of ['', 'not-an-owner', 'constructor', 'toString', '__proto__']) {
      const result = capture(owner, ['--write', '--apps=' + name]);
      assert.match(result.error?.message || '', /--apps requires known/);
      assert.equal(result.writes.size, 0);
      assert.equal(result.directories.length, 0);
    }
  }
  const incompatible = capture('scripts/generate-sw-uniquely-african-parity.js', ['--write', '--full', '--apps=fuel-cost']);
  assert.match(incompatible.error?.message || '', /cannot be combined with --full/);
  assert.equal(incompatible.writes.size, 0);
});

test('community artwork dimensions match the reviewed image and preserve the fallback owner', () => {
  const result = capture('scripts/build-sw-fintech-community-credit.js', ['--write']);
  assert.ifError(result.error);
  for (const [file, image, width, height] of [
    ['kikokotoo-sacco-na-vyama-vya-akiba', 'zana-kikokotoo-sacco-na-vyama-vya-akiba-sw', 800, 533],
    ['alama-ya-mkopo', 'credit-score', 800, 450]
  ]) {
    const html = result.writes.get(`sw/zana/${file}/index.html`);
    assert.ok(html.includes(`<img class="hero-art" src="/assets/img/tools/${image}.webp" width="${width}" height="${height}"`));
    assert.ok(html.includes(`<meta property="og:image:width" content="${width}">`));
    assert.ok(html.includes(`<meta property="og:image:height" content="${height}">`));
  }
});
