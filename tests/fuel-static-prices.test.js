'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { routes } = require('../scripts/build-fuel-market-locales');
const latest = require('../data/fuel/latest.json');
const markets = require('../data/fuel/markets.json');
const observations = require('../assets/js/lib/fuel-market-observations');

for (const [locale, route] of Object.entries(routes)) {
  test(locale + ' delivers the maintained country prices and sources in the initial HTML', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', route), 'utf8');
    const directory = html.split('<details id="fuel-static-reference" open>')[1].split('</section>')[0];
    const asOf = directory.match(/<time datetime="([\d-]+)">/)[1];
    const records = observations.merge(markets.markets, latest, asOf);
    const amounts = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
    const countries = new Map([...directory.matchAll(/<details data-country="([A-Z]+)"[^>]*>([\s\S]*?)<\/details>/g)]
      .map(match => [match[1], match[2]]));
    for (const { code } of latest.countries) assert.ok(countries.has(code), code);
    for (const [code, body] of countries) {
      const products = records.filter(market => market.country_code === code).flatMap(market => market.fuels)
        .filter(record => observations.status(record, asOf, markets.stale_after_days).valid);
      assert.equal((body.match(/<li>/g) || []).length, products.length, code);
      for (const record of products) {
        assert.ok(body.includes(record.currency + ' ' + amounts.format(record.price) + '/L'), code);
        assert.ok(body.includes(record.source_url.replaceAll('&', '&amp;')), code);
        assert.ok(body.includes(record.effective_date), code);
      }
    }
  });
}
