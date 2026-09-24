'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildManifest, shouldKeepToolSource } = require('../scripts/apply-tool-verification');
const previous = require('../data/tool-verification.json');

test('Liberia source collection retains specific documents and review dates', () => {
  const files = ['liberia/lr-paye.html', 'fr/liberia/lr-paye.html'].map(file => path.resolve(__dirname, '..', file));
  const built = buildManifest(files);
  for (const id of ['lr-paye', 'lr-paye-fr']) {
    assert.deepEqual(built.tools[id].source_urls, previous.tools[id].source_urls);
    assert.deepEqual(built.tools[id].source_titles, ['Liberia Revenue Authority tax education', 'NASSCORP revised employer guide']);
    assert.equal(built.tools[id].last_verified, '2026-07-21');
  }
  for (const [id, entry] of Object.entries(previous.tools)) {
    if (!['lr-paye', 'lr-paye-fr'].includes(id)) assert.deepEqual(built.tools[id], entry, id);
  }
});

test('Liberia homepage filtering preserves specific evidence and other tools', () => {
  for (const url of ['https://lra.gov.lr', 'https://revenue.lra.gov.lr', 'https://www.nasscorp.org.lr/', 'https://nasscorp.org.lr']) {
    assert.equal(shouldKeepToolSource(url, 'lr-paye'), false);
    assert.equal(shouldKeepToolSource(url, 'lr-paye-fr'), false);
    assert.equal(shouldKeepToolSource(url, 'lr-vat'), true);
  }
  for (const url of previous.tools['lr-paye'].source_urls) assert.equal(shouldKeepToolSource(url, 'lr-paye'), true);
});
