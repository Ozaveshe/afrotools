#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const english = read('tools/logo-maker/index.html');
const swahili = read('sw/zana/kitengeneza-logo/index.html');
const adapter = read('assets/js/lib/logo-maker-sw.js');
const manifest = JSON.parse(read('data/localization/sw-image-design-parity.json'));
const built = spawnSync(process.execPath, ['scripts/build-sw-logo-maker.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
assert.strictEqual(built.status, 0, built.stderr || built.stdout);
assert.match(swahili, /<html\b[^>]*lang="sw"/);
assert.ok(swahili.includes('Source owner: scripts/build-sw-logo-maker.js'));
for (const token of ["const PRESETS = {", 'function makeTextNode(', 'function updatePreview()', "downloadSvgBtn.addEventListener('click'", "downloadPngBtn.addEventListener('click'", "canvas.width = 400", "canvas.height = 300", "canvas.toDataURL('image/png')"]) {
  assert.ok(english.includes(token), `English owner missing ${token}`); assert.ok(swahili.includes(token), `Swahili owner missing ${token}`);
}
assert.ok(!/<iframe\b/i.test(swahili));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(swahili));
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(adapter));
for (const [lang, route] of [['en', '/tools/logo-maker/'], ['fr', '/fr/tools/createur-logo/'], ['sw', '/sw/zana/kitengeneza-logo/']]) assert.ok(swahili.includes(`hreflang="${lang}" href="https://afrotools.com${route}"`));
assert.ok(english.includes('hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-logo/"'));
assert.ok(read('fr/tools/createur-logo/index.html').includes('hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-logo/"'));
assert.ok(fs.existsSync(path.join(ROOT, 'assets/img/tools/logo-maker.webp')));
assert.ok(swahili.includes('https://afrotools.com/assets/img/tools/logo-maker.webp'));
for (const match of swahili.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
assert.ok(swahili.includes('"inLanguage":"sw"'));
for (const leak of ['Logo Settings', 'African Starter Kits', 'Logo Text', 'Background Color', 'Text Only', 'Preview', 'Professional quality']) assert.ok(!swahili.includes(`>${leak}<`), `visible English leak: ${leak}`);
assert.strictEqual(manifest.rows.find(row => row.id === 'logo-maker').status, 'accepted-candidate');
console.log('Swahili logo static parity: exact presets, SVG/PNG owner, native UI, privacy, SEO and artwork passed.');
