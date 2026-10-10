const assert = require('node:assert/strict');
const { test } = require('node:test');
const { billingFixture } = require('./support/pro-billing-fixture');

for (const [name, profile] of [
  ['expired', { subscription_tier: 'pro', subscription_expires_at: '2020-01-01T00:00:00Z' }],
  ['future', { subscription_tier: 'pro', subscription_expires_at: '2099-01-01T00:00:00Z' }],
  ['malformed expiry', { subscription_tier: 'pro', subscription_expires_at: 'invalid' }],
  ['lifetime', { subscription_tier: 'lifetime' }],
  ['free', { tier: 'free' }]
]) {
  test(name + ' profile tier and expiry do not establish provider status or renewal', async () => {
    const result = await billingFixture({ profile });
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.billing.plan, profile.subscription_tier || profile.tier);
    assert.equal(result.data.billing.status, 'unverified');
    assert.equal(result.data.billing.renewalDate, null);
    assert.equal(result.requests.length, 1);
    assert.match(result.headers['Cache-Control'], /no-store/);
  });
}

const connected = { subscription_tier: 'pro', paystack_subscription_code: 'SUB_fixture', subscription_expires_at: '2099-01-01T00:00:00Z' };
for (const options of [
  { profile: connected },
  { profile: connected, providerKey: true, subscription: null },
  { profile: connected, providerKey: true, subscription: {} }
]) {
  test('absent provider evidence remains unverified: ' + JSON.stringify(options), async () => {
    const result = await billingFixture(options);
    assert.equal(result.data.billing.status, 'unverified');
    assert.equal(result.data.billing.renewalDate, null);
  });
}

test('provider status and next payment date remain independent of profile access expiry', async () => {
  const result = await billingFixture({ profile: connected, providerKey: true, subscription: {
    status: 'non-renewing', next_payment_date: '2027-01-15T00:00:00Z',
    authorization: { last4: '0000' },
    invoices: [{ invoice_code: 'INV_fixture', status: 'success', amount: 500, currency: 'USD' }]
  } });
  assert.equal(result.data.billing.status, 'non-renewing');
  assert.equal(result.data.billing.renewalDate, '2027-01-15T00:00:00Z');
  assert.equal(result.data.billing.cardLast4, '0000');
  assert.equal(result.data.billing.invoices.length, 1);
  assert.ok(result.requests.every(row => row.method === 'GET'));
});

test('provider failure does not return profile-derived billing success', async () => {
  const result = await billingFixture({ profile: connected, providerKey: true, providerFailure: true });
  assert.equal(result.statusCode, 503);
  assert.equal(result.data.billing, undefined);
});

test('signed-out requests never read profile or provider data', async () => {
  const result = await billingFixture({ signedOut: true });
  assert.equal(result.statusCode, 401);
  assert.equal(result.requests.length, 0);
});

test('cancellation still requires manual review and never mutates provider data', async () => {
  const result = await billingFixture({ profile: connected, providerKey: true, method: 'POST', body: { action: 'cancel' } });
  assert.equal(result.statusCode, 202);
  assert.equal(result.data.manualReview, true);
  assert.equal(result.data.ok, false);
  assert.ok(result.requests.every(row => row.method === 'GET'));
});
