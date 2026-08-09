#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const english = read('tools/thumbnail-maker/index.html');
const swahili = read('sw/zana/kitengeneza-thumbnail/index.html');
const engine = read('assets/js/lib/thumbnail-maker-studio.js');
const adapter = read('assets/js/lib/thumbnail-maker-studio-sw.js');
const registry = read('assets/js/components/tool-registry.js');
const hub = read('sw/picha-na-design/index.html');
const french = read('fr/tools/createur-miniatures/index.html');

const built = spawnSync(process.execPath, ['scripts/build-sw-thumbnail-maker.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
assert.strictEqual(built.status, 0, built.stderr || built.stdout);

const ids = html => [...html.matchAll(/\bid="(thumb[A-Za-z0-9]+)"/g)].map(match => match[1]).sort();
assert.deepStrictEqual(ids(swahili), ids(english), 'Swahili route must preserve every English thumbnail studio DOM id');
assert.ok(ids(swahili).length >= 40, 'thumbnail studio DOM contract unexpectedly shrank');

assert.match(swahili, /<html\b[^>]*\blang="sw"/);
assert.ok(swahili.includes('Source owner: scripts/build-sw-thumbnail-maker.js; engine: assets/js/lib/thumbnail-maker-studio.js'));
assert.ok(swahili.includes('/assets/js/lib/thumbnail-maker-studio.js?v=6f0b6a39'));
assert.ok(swahili.includes('/assets/js/lib/thumbnail-maker-studio-sw.js'));
assert.ok(!/<iframe\b/i.test(swahili));
assert.ok(!/<script\b[^>]+src="https?:\/\//i.test(swahili), 'Swahili route must not load a remote script');

for (const source of [swahili, engine, adapter]) {
  assert.ok(!/\b(?:fetch|sendBeacon|XMLHttpRequest|WebSocket)\s*\(/.test(source), 'thumbnail workflow must not contain a network-send primitive');
}
assert.ok(!/createElement\(["']script["']\)/.test(engine), 'thumbnail engine must not inject a runtime script');

const expectedHash = '74d8bd703e82e2772410d2df37c4c1235e902812c5e7f790cfe984e6f14c4c1c';
assert.strictEqual(crypto.createHash('sha256').update(engine).digest('hex'), expectedHash, 'shared thumbnail owner changed without an oracle review');
for (const contract of [
  'youtube4k:{label:"YouTube recommended",width:3840,height:2160',
  'youtube:{label:"YouTube compact",width:1280,height:720',
  'fullhd:{label:"Full HD draft",width:1920,height:1080',
  'shorts:{label:"Shorts cover draft",width:1080,height:1920',
  'square:{label:"Square promo",width:1080,height:1080',
  '"image/jpeg"===l.exportFormat?"jpg":"image/webp"===l.exportFormat?"webp":"png"',
  'f.slice(0,3)',
  'window.AfroTools.thumbnailStudio={renderPreview:O,getState:function(){return Object.assign({},l)},getSizes:function(){return Object.assign({},n)}}'
]) assert.ok(engine.includes(contract), `shared engine contract missing: ${contract}`);

assert.ok(swahili.includes('<link rel="canonical" href="https://afrotools.com/sw/zana/kitengeneza-thumbnail/">'));
assert.ok(swahili.includes('<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/thumbnail-maker/">'));
assert.ok(swahili.includes('<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/createur-miniatures/">'));
assert.ok(swahili.includes('<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-thumbnail/">'));
assert.ok(english.includes('<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-thumbnail/">'), 'English reciprocal Swahili hreflang is missing');
assert.ok(french.includes('<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-thumbnail/">'), 'French reciprocal Swahili hreflang is missing');
assert.ok(swahili.includes('https://afrotools.com/assets/img/tools/thumbnail-maker.webp'));
assert.ok(fs.existsSync(path.join(ROOT, 'assets/img/tools/thumbnail-maker.webp')), 'dedicated thumbnail artwork is missing');
const schemas = [...swahili.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(schema => JSON.parse(schema[1]));
assert.strictEqual(schemas.length, 4, 'WebApplication, WebPage, BreadcrumbList and FAQPage schemas are required');
assert.strictEqual(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity.length, 5);
assert.ok(swahili.includes('"inLanguage":"sw"'));

assert.ok(registry.includes('id: "zana-kitengeneza-thumbnail-sw"'));
assert.ok(registry.includes('href: "/sw/zana/kitengeneza-thumbnail/"'));
assert.ok(registry.includes("sourceId: 'thumbnail-maker', imageId: 'thumbnail-maker'"));
assert.ok(hub.includes('<a href="/sw/zana/kitengeneza-thumbnail/">Studio ya thumbnail za YouTube</a>'));
assert.ok(!hub.includes('<a href="/tools/thumbnail-maker/" hreflang="en">YouTube thumbnail studio</a>'));

console.log('Swahili thumbnail-maker static parity: exact shared owner, five sizes, three formats, three A/B variants, local-only data path, reciprocal SEO and discovery passed.');
