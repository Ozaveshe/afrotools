const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { EN_CARS_COUNTRY_SLUG_TO_FR } = require('../scripts/lib/french-cars-route-map');

const root = path.join(__dirname, '..');
const priceData = require('../data/cars/price-intelligence.json');
const observations = require('../data/cars/market-observations.json').observations;

function read(route) {
  return fs.readFileSync(path.join(root, route.replace(/^\/+|\/+$/g, ''), 'index.html'), 'utf8');
}

function isFresh(reviewedAt) {
  const ageDays = (Date.now() - Date.parse(`${reviewedAt}T00:00:00Z`)) / 86400000;
  return ageDays >= 0 && ageDays <= 14;
}

test('French car directory links dated market samples and the editable import quote', () => {
  const html = read('/fr/cars/');
  assert.match(html, /name="robots" content="index, follow"/);
  assert.match(html, /href="\/tools\/car-import-cost\/"/);
  assert.doesNotMatch(html, /id="frCarsLanded"|id="fr-car-market"|data-fr-transport-download-text/);
  assert.equal((html.match(/<option value="\/fr\/cars\//g) || []).length, observations.length);
  for (const observation of observations) {
    assert.ok(html.includes(observation.sourceUrl), `${observation.vehicleId} source linked from directory`);
    assert.ok(html.includes(observation.reviewedAt), `${observation.vehicleId} observation date visible`);
  }
});

test('French model pages index only recent local observations and preserve source attribution', () => {
  for (const observation of observations) {
    const vehicle = priceData.vehicles.find((item) => item.id === observation.vehicleId);
    const country = priceData.countries[observation.countryCode];
    assert.ok(vehicle && country, `${observation.vehicleId} has a catalog vehicle and country`);
    const frCountry = EN_CARS_COUNTRY_SLUG_TO_FR[country.slug];
    assert.ok(frCountry, `${country.slug} has a French route`);
    const relative = `cars/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`;
    const french = `fr/cars/${frCountry}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`;
    const html = read(french);
    const englishHtml = read(relative);
    const frenchUrl = `https://afrotools.com/${french}/`;
    assert.ok(html.includes(observation.sourceUrl), `${french} links the observation source`);
    assert.ok(html.includes(observation.reviewedAt), `${french} shows the review date`);
    assert.ok(html.includes(`${observation.sampleSize} annonces`), `${french} shows sample size`);
    assert.ok(html.includes('prix de vente conclu'), `${french} distinguishes asks from completed sales`);
    if (isFresh(observation.reviewedAt)) {
      assert.match(html, /name="robots" content="index, follow"/);
      assert.ok(englishHtml.includes(`<link rel="alternate" hreflang="fr" href="${frenchUrl}">`));
    } else {
      assert.match(html, /name="robots" content="noindex, follow"/);
      assert.ok(!englishHtml.includes(`hreflang="fr" href="${frenchUrl}"`));
    }
  }
});

test('French pages without local observations stay out of search and do not invent local prices', () => {
  const unobserved = 'fr/cars/kenya/toyota/corolla/2018';
  const html = read(unobserved);
  const english = read('cars/kenya/toyota/corolla/2018');
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.ok(html.includes('Aucun relevé local daté'));
  assert.ok(!html.includes('hreflang="en"'));
  assert.ok(!english.includes(`hreflang="fr" href="https://afrotools.com/${unobserved}/"`));
  assert.match(read('fr/cars/kenya'), /name="robots" content="noindex, follow"/);
});
