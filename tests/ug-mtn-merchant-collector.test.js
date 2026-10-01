'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = {
  source_key: 'ug-mtn-merchant-wallet', dataset: 'fintech_fee',
  base_url: 'https://www.mtn.co.ug/momo/merchant/'
};

function collect(html) {
  const context = {
    module: { exports: {} },
    require(id) {
      if (id === 'pdf-parse') return () => assert.fail('Unexpected PDF parse');
      if (id === './market-data') return { cleanText: value => String(value ?? '').trim(), normalizeNumber: Number };
      if (id === './market-data-ingest') return new Proxy({}, { get: () => () => assert.fail('Collector must not mutate the database') });
      assert.fail('Unexpected dependency: ' + id);
    },
    fetch: async url => {
      assert.equal(url, source.base_url);
      return { ok: true, text: async () => html };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../netlify/functions/_shared/market-data-refresh.js'), 'utf8'), context);
  return context.module.exports.getCollector(source)(source);
}

// Synthetic table shape matches the official merchant page observed 2026-10-01.
function table(dash = ' – ', firstBand = '1', firstFee = '25') {
  return `<table><tr><th>Value Band (Tiers)</th><th>Charge</th></tr>
    <tr><td>${firstBand}${dash}2,500</td><td>${firstFee}</td></tr>
    <tr><td>2,501${dash}5,000</td><td>50</td></tr>
    <tr><td>5,001${dash}10,000</td><td>100</td></tr></table>`;
}

test('official spaced en-dash table preserves three verified payer tariffs and provenance', async () => {
  const rows = JSON.parse(JSON.stringify(await collect(table())));
  assert.deepEqual(rows.map(row => [row.amount_band, row.fee_amount]), [
    ['UGX 1-2,500', 25], ['UGX 2,501-5,000', 50], ['UGX 5,001-10,000', 100]
  ]);
  for (const row of rows) {
    assert.equal(row.source_url, source.base_url);
    assert.equal(row.country_code, 'UG');
    assert.equal(row.customer_segment, 'Payer');
    assert.equal(row.transaction_channel, 'Merchant wallet');
    assert.equal(row.source_type, 'official_notice');
    assert.ok(Number.isFinite(Date.parse(row.observed_at)));
  }
});

test('legacy compact dashes and HTML-encoded spaced dashes remain supported', async () => {
  for (const dash of ['-', ' - ', ' &#8211; ', ' &#x2013; ', '&nbsp;–&nbsp;']) {
    assert.equal((await collect(table(dash))).length, 3);
  }
});

test('changed fees and unrelated amount bands fail closed', async () => {
  for (const html of [table(' – ', '1', '250'), table(' – ', '11'), table().replace('<td>50</td>', '<td>0</td>')]) {
    await assert.rejects(collect(html), /Could not verify MTN Uganda merchant payer tiers/);
  }
});

test('missing table and script-only tariffs fail closed', async () => {
  await assert.rejects(collect('<p>Merchant wallet</p>'), /Could not verify/);
  await assert.rejects(collect(`<script>${table()}</script>`), /Could not verify/);
});
