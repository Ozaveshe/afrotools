'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const root = path.resolve(__dirname, '..');

test('creative artwork reaches existing heroes without changing form configuration', () => {
  for (const slug of ['media-kit-ya-mtayarishi', 'hook-za-video']) {
    const html = fs.readFileSync(path.join(root, 'sw/zana', slug, 'index.html'), 'utf8');
    const image = `/assets/img/tools/zana-${slug}-sw.webp`;
    assert.ok(html.includes(`<img src="${image}"`), slug);
    assert.ok(html.includes(`https://afrotools.com${image}`), slug);
    const config = JSON.parse(html.match(/<script id="swfaConfig" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.ok(config.owner && config.fields.length);
    assert.ok(!Object.hasOwn(config, 'image') && !Object.hasOwn(config, 'artwork'));
  }
});

test('invalid creative selection fails before writing pages', () => {
  const files = ['sw/zana/media-kit-ya-mtayarishi/index.html', 'sw/zana/hook-za-video/index.html', 'tools/creator-kit/index.html', 'sw/ubunifu-na-watayarishi/index.html'];
  const before = files.map(file => fs.readFileSync(path.join(root, file)));
  for (const option of ['--apps=', '--apps=not-an-owner', '--apps=constructor', '--apps=toString', '--apps=__proto__']) {
    const result = spawnSync(process.execPath, ['scripts/build-sw-creative-final-a.js', option], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /requires known Creative app owners/);
  }
  files.forEach((file, index) => assert.deepEqual(fs.readFileSync(path.join(root, file)), before[index], file));
});
