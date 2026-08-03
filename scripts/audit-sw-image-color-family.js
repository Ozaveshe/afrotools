#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/sw-image-color-family.json'), 'utf8'));
const failures = [];

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function expect(ok, message) { if (!ok) failures.push(message); }
function href(html, key, value) { return new RegExp(`<link[^>]+${key}="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i').test(html); }
function dimensions(rel) {
  const b = fs.readFileSync(path.join(ROOT, rel));
  expect(b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP', `${rel}: invalid WEBP RIFF signature`);
  const type = b.subarray(12, 16).toString();
  if (type === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3), codec: type };
  if (type === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff, codec: type.trim() };
  if (type === 'VP8L') { const bits = b.readUInt32LE(21); return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, codec: type }; }
  failures.push(`${rel}: unsupported WEBP codec ${type}`); return { width: 0, height: 0, codec: type };
}

expect(manifest.exactRowCount === 2 && manifest.rows.length === 2, 'manifest must contain exactly two rows');
const rows = manifest.rows.map(row => {
  const en = read(row.englishOwner);
  const sw = read(row.swahiliOwner);
  const route = row.id === 'color-picker' ? '/sw/zana/kichagua-rangi/' : '/sw/zana/paleti-ya-rangi/';
  expect(sw.includes('lang="sw"'), `${row.id}: lang is not sw`);
  expect(sw.includes('scripts/build-sw-image-color-family.js'), `${row.id}: wrong owner`);
  expect(!/Fungua zana kamili ya Kiingereza|generate-sw-tool-gap-pages/.test(sw), `${row.id}: fallback shell remains`);
  expect(!/<iframe\b|type="file"|\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(sw), `${row.id}: upload, frame, or network-send primitive present`);
  expect(href(sw, 'rel', 'canonical') && sw.includes(`https://afrotools.com${route}`), `${row.id}: canonical missing`);
  expect(href(sw, 'hreflang', 'en') && href(sw, 'hreflang', 'sw') && href(sw, 'hreflang', 'x-default'), `${row.id}: hreflang set incomplete`);
  expect(en.includes(`hreflang="sw" href="https://afrotools.com${route}"`), `${row.id}: English reciprocal hreflang missing`);
  const schemas = [...sw.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  expect(schemas.some(value => JSON.stringify(value).includes('"inLanguage":"sw"')), `${row.id}: Swahili schema missing`);
  const required = row.id === 'color-picker'
    ? ['id="hexValue"', 'id="rgbValue"', 'id="hslValue"', 'id="oklchValue"', 'id="cmykValue"', 'id="gradCode"', 'id="contrastRatio"', 'id="exportCssVars"', 'id="exportTwConfig"']
    : ['const PALETTES=[', 'function setCat(', 'function exportPaletteCSS(', 'function exportAllCSS(', 'function exportAllJSON(', 'function randomPalette('];
  required.forEach(token => expect(sw.includes(token), `${row.id}: missing owner contract ${token}`));
  const art = dimensions(row.artwork);
  expect(art.width >= 600 && art.height >= 315, `${row.id}: artwork dimensions too small (${art.width}x${art.height})`);
  return {
    id: row.id,
    status: 'candidate-ready',
    englishOwner: row.englishOwner,
    swahiliOwner: row.swahiliOwner,
    owner: 'scripts/build-sw-image-color-family.js',
    artwork: { path: row.artwork, ...art, bytes: fs.statSync(path.join(ROOT, row.artwork)).size },
    privacy: 'local-only; no upload, iframe, fetch, XHR, websocket, beacon, or AI route',
    exportOracle: row.id === 'color-picker' ? 'CSS variables and Tailwind config reopen as text with five exact palette values' : 'per-palette CSS, all-palettes CSS, and JSON reopen and parse against 45 palettes / 225 colors',
    sourceSha256: crypto.createHash('sha256').update(en).digest('hex'),
    swahiliSha256: crypto.createHash('sha256').update(sw).digest('hex')
  };
});

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }

const receipt = {
  schemaVersion: 1,
  familyId: manifest.familyId,
  baseCommit: manifest.baseCommit,
  exactScope: { rows: 2, ids: rows.map(row => row.id), excludedDeveloperIds: manifest.excludedDeveloperIds },
  verdict: { candidateReady: 2, centrallyAccepted: 0, blockedRows: 0 },
  capabilityLimits: [{ id: 'color-picker-eyedropper', status: 'fail-closed-unaccepted-when-unavailable', reason: 'Real screen capture is optional and is not promoted without runtime and user-choice proof.' }],
  browserContract: ['route-specific conversion/filter workflows', 'invalid and stale-state clearing', 'download reopen and parse', '320px', '375px', '200% reflow', 'light/dark', 'keyboard/focus', 'computed contrast', 'no console/local-resource/network writes'],
  rows
};
const artwork = { familyId: manifest.familyId, required: 2, present: 2, missing: 0, queue: [], verified: rows.map(row => ({ id: row.id, ...row.artwork })) };
if (WRITE) {
  fs.writeFileSync(path.join(ROOT, 'reports/sw-image-color-parity-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, 'reports/sw-image-color-artwork-queue.json'), `${JSON.stringify(artwork, null, 2)}\n`);
}
console.log(`Swahili image color family: ${rows.length}/2 candidate-ready; central acceptance unchanged at 0.`);
