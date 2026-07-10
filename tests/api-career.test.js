const assert = require('assert');
const engine = require('../netlify/functions/_shared/career-engine.js');

function offer(id, amount, currency, period, overrides) {
  return {
    id,
    label: 'Offer ' + id.toUpperCase(),
    basePay: { amount, currency, payPeriod: period },
    payBasis: 'gross',
    estimatedDeductions: [],
    terms: { arrangement: 'employee', workMode: id === 'a' ? 'remote' : 'onsite' },
    ...(overrides || {}),
  };
}

const comparison = engine.compareOffers({
  comparisonCurrency: 'NGN',
  offerA: offer('a', 500000, 'NGN', 'monthly'),
  offerB: offer('b', 4000, 'USD', 'monthly', {
    benefits: [{ kind: 'health', value: { amount: 50000, currency: 'NGN', payPeriod: 'monthly' } }],
  }),
  fxRates: [{ from: 'USD', to: 'NGN', rate: 1500, asOf: '2026-07-10' }],
});

assert.strictEqual(comparison.offerA.basePay.annual, 6000000);
assert.strictEqual(comparison.offerB.basePay.annual, 72000000);
assert.strictEqual(comparison.differences.basePay.leader, 'offer_b');
assert.strictEqual(comparison.offerB.estimatedBenefitValue.annual, 600000);
assert.ok(comparison.nonFinancialDifferences.some(item => item.kind === 'work_mode'));
assert.ok(comparison.normalizationNotes.some(note => note.includes('1 USD = 1500 NGN')));

assert.throws(
  () => engine.compareOffers({
    comparisonCurrency: 'NGN',
    offerA: offer('a', 5000, 'USD', 'monthly'),
    offerB: offer('b', 500000, 'NGN', 'monthly'),
  }),
  /Enter an FX rate/,
);

const warning = engine.checkJobScam({
  vacancyText: 'Pay a training fee in USDT within 2 hours. The interview is WhatsApp only.',
  answers: { feeRequested: true, feePurpose: 'training' },
});
assert.strictEqual(warning.riskTier, 'high_caution');
assert.ok(warning.flags.some(flag => flag.code === 'training_or_equipment_fee'));
assert.ok(warning.flags.some(flag => flag.code === 'cryptocurrency_request'));
assert.strictEqual(warning.inputCoverage.urlFetchPerformed, false);

const negated = engine.checkJobScam({
  vacancyText: 'We will never ask you to pay an application fee or share banking credentials.',
});
assert.ok(!negated.flags.some(flag => flag.code === 'upfront_payment'));
assert.ok(!negated.flags.some(flag => flag.code === 'banking_credentials'));

(async () => {
  const api = await import('../netlify/functions/api-career.mjs');
  const response = await api.default(
    new Request('https://afrotools.com/api/v1/career/job-scam-check', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://salarypadi.com' },
      body: JSON.stringify({ answers: { pressureOrUrgency: true } }),
    }),
    { ip: '127.0.0.1' },
  );
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('access-control-allow-origin'), 'https://salarypadi.com');
  const body = await response.json();
  assert.strictEqual(body.status, 'success');
  assert.strictEqual(body.result.riskTier, 'caution');
  assert.strictEqual(body._meta.network_fetch_performed, false);
  assert.ok(!JSON.stringify(body).includes('127.0.0.1'));
  console.log('AfroTools career API tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
