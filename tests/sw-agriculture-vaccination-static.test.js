'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const row = manifest.rows.find(item => item.english.id === 'vaccination-schedule');
const file = path.join(ROOT, row.swahili.file);

test('Swahili vaccination owner is native, source-owned and engine-shared', () => {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<html lang="sw"/);
  assert.match(html, /window\.__SW_AGRI_PAGE__/);
  assert.match(html, /\/engines\/vaccination-engine\.js/);
  assert.match(html, /validateInput/);
  assert.match(html, /Ratiba elekezi ya chanjo za mifugo/);
  assert.match(html, /Hesabu ya ndani/);
  assert.match(html, /<option value="KE">Kenya<\/option>/);
  assert.doesNotMatch(html, /<option value="undefined">/);
  assert.doesNotMatch(html, /<iframe\b|window\.__FR_AGRI_PAGE__|langue:'fr'|content-language" content="fr"/i);
});

test('Swahili vaccination metadata, hreflang and artwork are route-correct', () => {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com${row.swahili.route}">`));
  assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com${row.english.route}"`));
  assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.match(html, new RegExp(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.match(html, new RegExp(row.artwork.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(fs.existsSync(path.join(ROOT, row.artwork.file)), true);
});
