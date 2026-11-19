'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const window = { AFRICAN_COUNTRIES: [
  { code: 'KE', name: 'Kenya', displayNames: { fr: 'Kenya', sw: 'Kenya' } },
  { code: 'CI', name: "Côte d’Ivoire", displayNames: { fr: "Côte d’Ivoire" } }
] };
const source = fs.readFileSync(path.join(__dirname, '../assets/js/lib/localized-fuel-search.js'), 'utf8');
vm.runInNewContext(source, { window, URLSearchParams });
const french = '/fr/tools/suivi-carburant/';
const swahili = '/sw/zana/ufuatiliaji-bei-za-mafuta/';
const tools = [french, swahili, '/sw/zana/bei-mafuta/'].map(href => ({href}));

test('market price queries preserve language, country and requested fuel', () => {
  for (const [query, locale, href] of [
    ['prix du diesel au Kenya', 'fr', french + '?country=KE&fuel=diesel#fuel-finder'],
    ['prix de l’essence en Côte d’Ivoire', 'fr', french + '?country=CI&fuel=petrol#fuel-finder'],
    ['bei ya dizeli Kenya', 'sw', swahili + '?country=KE&fuel=diesel#fuel-finder'],
    ['Carburant', 'fr', french + '#fuel-finder'],
    ['mafuta', 'sw', swahili + '#fuel-finder'],
    ['bei za mafuta', 'sw', swahili + '#fuel-finder']
  ]) assert.equal(window.AfroFuelDirectoryResult(query, locale, tools).href, href);
});

test('other workflows and absent directory records keep normal search behavior', () => {
  for (const query of ['prix du groupe électrogène diesel au Kenya', 'bei ya mafuta jenereta Kenya', 'prix du diesel Kenya salaire', 'prix du diesel Kenya Nigeria', 'prix du gaz GPL au Kenya']) {
    assert.equal(window.AfroFuelDirectoryResult(query, 'fr', tools), null);
  }
  assert.equal(window.AfroFuelDirectoryResult('prix du diesel au Kenya', 'fr', []), null);
});
