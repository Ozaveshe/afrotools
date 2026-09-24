'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = {
  source_key: 'wise-ma-corridor', dataset: 'remittance_quote', country_scope: ['US', 'MA'],
  base_url: 'https://wise.com/us/send-money/send-money-to-morocco'
};

// Synthetic amounts model the official target-amount shape observed 2026-09-24.
function fixture() {
  const corridor = { sourceCurrency: 'USD', targetCurrency: 'MAD', payInCountry: 'US' };
  return {
    calculatorRequest: { ...corridor, sourceAmount: null, targetAmount: 10000 },
    quote: {
      ...corridor, providedAmountType: 'TARGET', sourceAmount: null, targetAmount: 10000, rate: 10,
      paymentOptions: [
        { payIn: 'BANK_TRANSFER', disabled: false, sourceAmount: 1010, targetAmount: 10000, fee: { total: 10 } },
        { payIn: 'DIRECT_DEBIT', disabled: false, sourceAmount: 1012, targetAmount: 10000, fee: { total: 12 } },
        { payIn: 'BALANCE', disabled: true, sourceAmount: 1008, targetAmount: 10000, fee: { total: 8 } }
      ]
    }
  };
}

function collect(page, overrides = {}, rawHtml) {
  const html = rawHtml ?? `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: page } })}</script>`;
  const context = {
    module: { exports: {} },
    require(id) {
      if (id === 'pdf-parse') return () => assert.fail('Unexpected PDF parse');
      if (id === './market-data') return { cleanText: value => String(value ?? '').trim(), normalizeNumber: Number };
      if (id === './market-data-ingest') return new Proxy({}, { get: () => () => assert.fail('Collector must not mutate the database') });
      assert.fail('Unexpected dependency: ' + id);
    },
    fetch: async url => {
      assert.equal(url, overrides.base_url || source.base_url);
      return { ok: true, text: async () => html };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../netlify/functions/_shared/market-data-refresh.js'), 'utf8'), context);
  const input = { ...source, ...overrides };
  return context.module.exports.getCollector(input)(input);
}

test('target quote preserves each enabled payment method amount and excludes disabled balance', async () => {
  const records = JSON.parse(JSON.stringify(await collect(fixture())));
  assert.equal(records.length, 2);
  assert.deepEqual(records.map(r => [r.funding_method, r.send_amount, r.fee_amount]), [
    ['Bank transfer', 1010, 10], ['Direct debit', 1012, 12]
  ]);
  for (const row of records) {
    assert.equal(row.received_amount, 10000);
    assert.equal(row.fx_rate, 10);
    assert.equal(row.receive_currency, 'MAD');
    assert.equal(row.source_url, source.base_url);
    assert.ok(Number.isFinite(Date.parse(row.observed_at)));
    assert.equal(row.payload.provided_amount_type, 'TARGET');
  }
});

test('source-amount quotes keep their actual amounts, including a zero fee', async () => {
  const page = fixture();
  Object.assign(page.calculatorRequest, { sourceAmount: 1000, targetAmount: null });
  Object.assign(page.quote, { providedAmountType: 'SOURCE', sourceAmount: 1000, targetAmount: null });
  page.quote.paymentOptions = [{ payIn: 'BANK_TRANSFER', disabled: false, sourceAmount: 1000, targetAmount: 10000, fee: { total: 0 } }];
  const [row] = await collect(page);
  assert.equal(row.send_amount, 1000);
  assert.equal(row.fee_amount, 0);
});

test('existing ingestion preserves quote amounts, provenance and the 24-hour expiry', async () => {
  const { buildImportedDomainRecord } = require('../netlify/functions/_shared/market-data');
  const records = await collect(fixture());
  for (const record of records) {
    const row = buildImportedDomainRecord('remittance_quote', {
      ...source, id: '00000000-0000-4000-8000-000000000001', source_name: 'Wise fixture', ttl_hours: 24
    }, record, { publish: true });
    for (const field of ['send_amount', 'fee_amount', 'received_amount', 'fx_rate', 'funding_method', 'source_url']) {
      assert.equal(row[field], record[field]);
    }
    assert.equal(row.is_public, true);
    assert.equal(Date.parse(row.expires_at) - Date.parse(row.observed_at), 24 * 60 * 60 * 1000);
    assert.equal(row.payload.provided_amount_type, 'TARGET');
  }
});

test('rejects missing, malformed and mismatched corridor data without prose fallback', async () => {
  await assert.rejects(collect(null, {}, '<html>Sending 1,000 USD Transfer cost</html>'), /structured quote is missing/);
  await assert.rejects(collect(null, {}, '<script id="__NEXT_DATA__">{</script>'), /invalid JSON/);
  for (const change of [
    p => { p.quote.targetCurrency = 'EUR'; },
    p => { p.calculatorRequest.payInCountry = 'GB'; },
    p => { delete p.quote; },
    p => { p.calculatorRequest.sourceCurrency = 'GBP'; }
  ]) {
    const page = fixture(); change(page);
    await assert.rejects(collect(page), /corridor mismatch/);
  }
  await assert.rejects(collect(fixture(), { country_scope: ['GH'] }), /corridor mismatch/);
});

test('rejects unbound, coerced, negative, inconsistent or duplicate enabled options', async () => {
  for (const change of [
    p => { p.quote.providedAmountType = 'UNKNOWN'; },
    p => { p.quote.rate = 0; },
    p => { p.calculatorRequest.targetAmount = 1; },
    p => { p.quote.paymentOptions[0].sourceAmount = null; },
    p => { p.quote.paymentOptions[0].sourceAmount = '1010'; },
    p => { p.quote.paymentOptions[0].fee.total = -1; },
    p => { p.quote.paymentOptions[0].fee.total = null; },
    p => { p.quote.paymentOptions[0].targetAmount = 9000; },
    p => { p.quote.paymentOptions[0].sourceAmount = 2020; },
    p => { p.quote.paymentOptions.push(p.quote.paymentOptions[0]); }
  ]) {
    const page = fixture(); change(page);
    await assert.rejects(collect(page), /invalid|inconsistent/);
  }
});

test('does not publish disabled, unknown or ambiguous availability methods', async () => {
  for (const change of [
    o => { o.disabled = true; },
    o => { delete o.disabled; },
    o => { o.disabled = 'false'; },
    o => { o.payIn = 'UNRECOGNISED'; }
  ]) {
    const page = fixture(); page.quote.paymentOptions.forEach(change);
    await assert.rejects(collect(page), /no enabled supported/);
  }
});

test('other Wise corridors preserve the existing text collector', async () => {
  const html = '<p>The cheapest way to send 1,000 USD to Ghana costs 5 USD. Direct debit 7 USD.</p>';
  const records = await collect(null, { source_key: 'wise-gh-corridor', country_scope: ['GH'] }, html);
  assert.equal(records.length, 2);
  assert.equal(records[0].send_amount, 1000);
  assert.equal(records[0].fee_amount, 5);
  assert.equal(records[1].fee_amount, 7);
});
