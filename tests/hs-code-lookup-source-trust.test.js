const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'tools/hs-code-lookup/index.html'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'engines/src/hs-lookup-engine.js'), 'utf8');
const aiContext = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/hs-code-lookup.json'), 'utf8'));
const { HS_DATABASE } = require('../data/trade/hs-codes-database.js');
const { COUNTRY_DUTY_RATES } = require('../data/trade/country-duty-rates.js');

test('HS lookup publishes the actual seeded coverage', () => {
  const headingCount = HS_DATABASE.chapters.reduce((total, chapter) => total + (chapter.headings || []).length, 0);

  assert.equal(Object.keys(COUNTRY_DUTY_RATES).length, 24);
  assert.equal(HS_DATABASE.chapters.length, 30);
  assert.equal(headingCount, 119);
  assert.equal(HS_DATABASE.searchIndex.length, 353);
  assert.match(page, /30 Seeded HS Chapters/);
  assert.match(page, /24 Country Profiles/);
});

test('HS lookup avoids unsupported universal and automatic-preference claims', () => {
  const trustSurfaces = [page, engine, aiContext.staticText].join('\n');

  assert.doesNotMatch(trustSurfaces, /all 54 African countries/i);
  assert.doesNotMatch(trustSurfaces, /all 97 HS Chapters/i);
  assert.doesNotMatch(trustSurfaces, /MFN \+ AfCFTA Rates/i);
  assert.match(engine, /AfCFTA preference is not applied automatically here/);
  assert.match(aiContext.staticText, /indicative chapter-level duty assumptions/);
});

test('HS lookup exposes official verification routes', () => {
  for (const url of [
    'wcoomd.org/en/topics/nomenclature',
    'cet.customs.gov.ng/',
    'eac.int/documents',
    'sars.gov.za/legal-counsel/primary-legislation',
    'gra.gov.gh/customs/customs-tariffs-and-levies/'
  ]) {
    assert.match(page, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('HS lookup structured data remains valid JSON', () => {
  const jsonLdBlocks = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  assert.ok(jsonLdBlocks.length >= 2);
  for (const block of jsonLdBlocks) JSON.parse(block[1]);
});
