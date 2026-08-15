'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const html = read('tools/electricity-tariff/index.html');
const runtime = read('assets/js/pages/electricity-cost-prepaid-units.js');
const prepaid = read('tools/prepaid-meter/index.html');

assert.equal((html.match(/<title>/g) || []).length, 1);
assert.equal((html.match(/<meta name="description"/g) || []).length, 1);
assert.equal((html.match(/<h1>/g) || []).length, 1);
assert(html.includes('<title>Electricity Cost &amp; Prepaid Units Calculator | AfroTools</title>'));
assert(html.includes('<h1>Electricity Cost &amp; Prepaid Units</h1>'));
assert(html.includes('<link rel="canonical" href="https://afrotools.com/tools/electricity-tariff/">'));
for (const locale of ['en', 'fr', 'sw', 'x-default']) assert(html.includes(`hreflang="${locale}"`));
assert(!html.includes('name="robots" content="noindex'));
assert(!/[?&](?:amount|units|provider|tariff|class)=/i.test(html));

const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
assert(jsonLd.some((value) => value['@type'] === 'WebApplication'));
assert(jsonLd.some((value) => value['@type'] === 'FAQPage'));

for (const id of ['electricityCountry', 'electricityProvider', 'electricityTariff', 'electricityAmount', 'electricityResult', 'electricitySourceCard']) {
  assert(html.includes(`id="${id}"`), `Missing labelled/live workflow element ${id}`);
}
assert(html.includes('aria-live="polite"'));
assert(html.includes('/data/energy/electricity-tariffs.json') === false, 'Dataset should be fetched by the runtime, not duplicated in HTML');
assert(runtime.includes("fetch('/data/energy/electricity-tariffs.json')"));
assert(!/localStorage|sessionStorage/.test(runtime));
assert(!/console\.(?:log|warn|error|info)/.test(runtime));

for (const event of [
  'electricity_country_selected', 'electricity_provider_selected', 'electricity_tariff_selected',
  'electricity_money_to_units_completed', 'electricity_units_to_bill_completed', 'electricity_custom_rate_used',
  'electricity_stale_data_shown', 'electricity_unsupported_market', 'electricity_source_opened'
]) assert(runtime.includes(event), `Missing analytics event ${event}`);
assert(!/raw_(?:amount|units)|meter_number|token_number|address|latitude|longitude/.test(runtime));

assert(prepaid.includes('<meta name="robots" content="noindex,follow">'));
assert(prepaid.includes('<link rel="canonical" href="https://afrotools.com/tools/prepaid-meter/">'));
assert(prepaid.includes('Open Electricity Cost &amp; Prepaid Units'));

for (const family of ['electricity-tariff', 'prepaid-meter']) {
  const directory = path.join(root, 'tools', family);
  const countries = fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'index.html')));
  assert.equal(countries.length, 54, `${family} must preserve 54 country URLs`);
  countries.forEach((entry) => {
    const countryHtml = fs.readFileSync(path.join(directory, entry.name, 'index.html'), 'utf8');
    assert(countryHtml.includes('<meta name="robots" content="noindex,follow">'), `${family}/${entry.name} must be noindex`);
    assert(countryHtml.includes(`<link rel="canonical" href="https://afrotools.com/tools/${family}/${entry.name}/">`), `${family}/${entry.name} self-canonical compatibility ownership`);
    assert(!countryHtml.includes('country-energy-index.js'), `${family}/${entry.name} must not load stale national tariff data`);
  });
}

const sitemapFiles = fs.readdirSync(root).filter((name) => /^sitemap.*\.xml$/.test(name));
assert(sitemapFiles.some((name) => read(name).includes('https://afrotools.com/tools/electricity-tariff/')), 'Canonical route must exist in a sitemap');

console.log('Electricity demand-capture route, SEO, analytics, privacy and compatibility contracts passed.');
