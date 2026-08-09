#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const english = read('tools/meme-generator/index.html');
const swahili = read('sw/zana/kitengeneza-meme/index.html');
const adapter = read('assets/js/lib/meme-generator-studio-sw.js');
const registry = read('assets/js/components/tool-registry.js');
const manifest = JSON.parse(read('data/localization/sw-image-design-parity.json'));
const built = spawnSync(process.execPath, ['scripts/build-sw-meme-generator.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
assert.strictEqual(built.status, 0, built.stderr || built.stdout);
assert.match(swahili, /<html\b[^>]*lang="sw"/);
assert.ok(swahili.includes('Source owner: scripts/build-sw-meme-generator.js'));
assert.ok(!/<iframe\b/i.test(swahili));
assert.ok(!/<script\b[^>]+src="https?:\/\//i.test(swahili));
for (const token of ['const STARTER_SCENES = {', 'const CAPTION_PACKS = {', 'const TEXT_STYLES = {', 'function drawStarterScene(', 'function drawTextBlock(', 'function readFileAsImage(', 'function downloadMeme()', "toDataURL('image/png')"]) {
  assert.ok(english.includes(token), `English owner missing ${token}`); assert.ok(swahili.includes(token), `Swahili owner missing ${token}`);
}
assert.ok(swahili.includes('/assets/js/lib/meme-generator-studio-sw.js'));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(swahili));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(adapter));
for (const [lang, route] of [['en', '/tools/meme-generator/'], ['fr', '/fr/tools/generateur-memes/'], ['sw', '/sw/zana/kitengeneza-meme/']]) assert.ok(swahili.includes(`hreflang="${lang}" href="https://afrotools.com${route}"`));
assert.ok(english.includes('hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-meme/"'));
assert.ok(read('fr/tools/generateur-memes/index.html').includes('hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-meme/"'));
assert.ok(swahili.includes('https://afrotools.com/assets/img/tools/meme-generator.webp'));
assert.ok(fs.existsSync(path.join(ROOT, 'assets/img/tools/meme-generator.webp')));
for (const match of swahili.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
assert.ok(swahili.includes('"inLanguage":"sw"'));
for (const leak of ['Choose your base image', 'Upload your image', 'Preview and download', 'Download PNG', 'Reset Text', 'How to make it feel local']) assert.ok(!swahili.includes(`>${leak}<`), `visible English leak: ${leak}`);
assert.ok(registry.includes("id: 'zana-kitengeneza-meme-sw-native'"));
assert.strictEqual(manifest.rows.find(row => row.id === 'meme-generator').status, 'accepted-candidate');
console.log('Swahili meme static parity: deterministic local canvas owner, native UI, PNG, privacy, SEO, artwork and discovery passed.');
