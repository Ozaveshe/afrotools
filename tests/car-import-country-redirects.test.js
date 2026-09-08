// Local route-contract proof. Netlify deployment behavior still needs a live check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const routeApi = require('../scripts/lib/route-contract');
const cars = require('../assets/js/lib/car-price-intelligence');
const data = require('../data/cars/price-intelligence.json');

const root = path.resolve(__dirname, '..');
const base = '/tools/car-import-cost/';
const rules = routeApi.parseRedirectsFile().filter(rule => rule.route.startsWith(base));
const countries = Object.values(data.countries).filter(country => country.directory_enabled !== false);
const real = countries.filter(country => fs.existsSync(path.join(root, base, country.slug, 'index.html')));
const missing = countries.filter(country => !real.includes(country));

test('every emitted car-directory link has a real country page or an exact non-forced fallback', () => {
  assert.equal(real.length, 6);
  assert.equal(missing.length, 14);
  const fallbacks = rules.filter(rule => rule.target.startsWith(base + '#requested-country='));
  assert.equal(fallbacks.length, missing.length);
  for (const country of countries) {
    const url = new URL(cars.buildCalculatorUrl({country, sourceMarket: 'japan',
      vehicle: {make: 'Toyota', model: 'Hilux', year: 2020, cc: [2600, 2600]}, sourcePrice: {median: 28500}}), 'https://afrotools.com');
    assert.equal(url.pathname, `${base}${country.slug}/`);
    assert.equal(url.searchParams.get('country'), country.code);
    const rule = fallbacks.find(rule => rule.route === url.pathname);
    if (real.includes(country)) assert.equal(rule, undefined, `${country.slug} keeps its real page`);
    else {
      assert.ok(rule, `${country.slug} needs a fallback for the emitted link`);
      assert.equal(rule.statusCode, 301);
      assert.equal(rule.force, false);
      assert.equal(rule.target, base + '#requested-country=' + country.code);
      assert.equal(new URL(rule.target, 'https://afrotools.com').search, '', 'no target query may discard incoming prefill parameters');
    }
  }
});

test('fallbacks cannot capture the canonical, arbitrary country names, or deeper paths', () => {
  const aliases = rules.filter(rule => rule.target.startsWith(base + '#requested-country='));
  for (const rule of aliases) {
    assert.ok(!/[*:]/.test(rule.route), 'an exact allowlist replaces the self-matching splat');
    assert.notEqual(rule.route.replace(/\/$/, ''), base.replace(/\/$/, ''));
    assert.ok(missing.some(country => rule.route === `${base}${country.slug}/`));
  }
  for (const route of [base, `${base}not-a-country/`, `${base}mozambique/details/`, `${base}mozambique/index.html`]) {
    assert.ok(!aliases.some(rule => rule.route.replace(/\/$/, '') === route.replace(/\/$/, '')));
  }
});

test('route synchronization preserves the unmanaged exact fallback rules', () => {
  const before = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
  const after = routeApi.syncRedirectContract(routeApi.buildRouteGraph(), {write: false}).content;
  for (const country of missing) {
    const rule = rules.find(rule => rule.route === `${base}${country.slug}/`);
    assert.ok(before.indexOf(rule.raw) > before.indexOf('# END CANONICAL ROUTE CONTRACT'));
    assert.ok(after.includes(rule.raw));
  }
});
