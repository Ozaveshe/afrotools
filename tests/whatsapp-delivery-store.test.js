'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createDeliveryStore, PROJECT_URL } = require('../netlify/functions/_shared/whatsapp-delivery-store');

test('delivery store uses only hashed message identity and fresh attempt tokens', async () => {
  const calls = [];
  const store = createDeliveryStore({ key: 'synthetic-key', fetchImpl: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), signal: options.signal });
    return { ok: true, json: async () => url.endsWith('/claim_whatsapp_delivery') ? 'claimed' : true };
  } });
  const a = store.receipt('wamid.SYNTHETIC_MESSAGE'), b = store.receipt('wamid.SYNTHETIC_MESSAGE');
  assert.equal(a.messageKey, b.messageKey);
  assert.notEqual(a.attemptToken, b.attemptToken);
  assert.match(a.messageKey, /^[a-f0-9]{64}$/);
  assert.equal(await store.claim(a), 'claimed');
  await store.transition(a, 'sending');
  await store.transition(a, 'sent');
  assert.equal(calls.length, 3);
  assert(calls.every(c => c.url.startsWith(PROJECT_URL + '/rest/v1/rpc/')));
  assert(calls.every(c => c.signal instanceof AbortSignal));
  assert(!JSON.stringify(calls.map(c => c.body)).includes('SYNTHETIC_MESSAGE'));
  assert.deepEqual(Object.keys(calls[0].body).sort(), ['p_attempt_token', 'p_message_key']);
});

test('missing configuration and another project fail before network access', async () => {
  for (const options of [{}, { url: 'https://other.supabase.co', key: 'synthetic' }]) {
    let calls = 0;
    const store = createDeliveryStore({ ...options, fetchImpl: async () => { calls++; } });
    assert.equal(store.configured, false);
    await assert.rejects(() => store.claim(store.receipt('synthetic')), /not configured/);
    assert.equal(calls, 0);
  }
});

test('unexpected responses and lost leases never imply delivery permission', async () => {
  const store = createDeliveryStore({ key: 'synthetic', fetchImpl: async () => ({ ok: true, json: async () => false }) });
  const item = store.receipt('synthetic');
  await assert.rejects(() => store.claim(item), /Invalid delivery claim/);
  await assert.rejects(() => store.transition(item, 'sending'), /lease or state changed/);
  await assert.rejects(() => store.transition(item, 'invented'), /Invalid delivery transition/);
  assert.throws(() => store.receipt(''), /message ID/);
});

test('completed or busy receipts cannot execute the reply callback', async () => {
  const { withDeliveryReceipt } = require('../netlify/functions/_shared/whatsapp-delivery-store');
  for (const state of ['done', 'busy', 'uncertain']) {
    let sends = 0;
    const store = { receipt: () => ({}), claim: async () => state };
    const work = async () => { sends++; };
    if (state === 'done') assert.equal(await withDeliveryReceipt(store, 'synthetic', work), 'duplicate');
    else await assert.rejects(() => withDeliveryReceipt(store, 'synthetic', work), /pending reconciliation/);
    assert.equal(sends, 0);
  }
});

test('only confirmed rejection permits retry after sending starts', async () => {
  const { withDeliveryReceipt } = require('../netlify/functions/_shared/whatsapp-delivery-store');
  for (const rejected of [false, true]) {
    const states = [];
    const store = { receipt: () => ({}), claim: async () => 'claimed', transition: async (_item, state) => states.push(state) };
    await assert.rejects(() => withDeliveryReceipt(store, 'synthetic', async beforeSend => {
      await beforeSend();
      const error = new Error('Synthetic failure');
      if (rejected) error.deliveryRejected = true;
      throw error;
    }), /Synthetic failure/);
    assert.deepEqual(states, ['sending', rejected ? 'retryable' : 'uncertain']);
  }
});

test('success is recorded only after the reply callback finishes', async () => {
  const { withDeliveryReceipt } = require('../netlify/functions/_shared/whatsapp-delivery-store');
  const order = [];
  const store = { receipt: () => ({}), claim: async () => 'claimed', transition: async (_item, state) => order.push(state) };
  assert.equal(await withDeliveryReceipt(store, 'synthetic', async beforeSend => {
    await beforeSend(); order.push('provider-completed');
  }), 'sent');
  assert.deepEqual(order, ['sending', 'provider-completed', 'sent']);
});
