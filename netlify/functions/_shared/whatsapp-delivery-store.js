'use strict';
const crypto = require('node:crypto');
const PROJECT_URL = 'https://zpclagtgczsygrgztlts.supabase.co';

function createDeliveryStore({ url = PROJECT_URL, key, fetchImpl = fetch } = {}) {
  const configured = url === PROJECT_URL && typeof key === 'string' && key.length > 0;
  async function rpc(name, body) {
    if (!configured) throw new Error('WhatsApp delivery store is not configured');
    const response = await fetchImpl(PROJECT_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) throw new Error('WhatsApp delivery store request failed');
    return response.json();
  }
  function receipt(messageId) {
    if (typeof messageId !== 'string' || !messageId.trim() || messageId.length > 512) {
      throw new Error('Missing or invalid provider message ID');
    }
    return {
      messageKey: crypto.createHash('sha256').update(messageId).digest('hex'),
      attemptToken: crypto.randomUUID()
    };
  }
  async function claim(item) {
    const result = await rpc('claim_whatsapp_delivery', {
      p_message_key: item.messageKey, p_attempt_token: item.attemptToken
    });
    if (!['claimed', 'done', 'busy', 'uncertain'].includes(result)) {
      throw new Error('Invalid delivery claim response');
    }
    return result;
  }
  async function transition(item, state) {
    if (!['sending', 'sent', 'retryable', 'uncertain'].includes(state)) {
      throw new Error('Invalid delivery transition');
    }
    const result = await rpc('transition_whatsapp_delivery', {
      p_message_key: item.messageKey, p_attempt_token: item.attemptToken, p_state: state
    });
    if (result !== true) throw new Error('Delivery lease or state changed');
  }
  return { configured, receipt, claim, transition };
}
async function withDeliveryReceipt(store, messageId, work) {
  const item = store.receipt(messageId);
  const claim = await store.claim(item);
  if (claim === 'done') return 'duplicate';
  if (claim !== 'claimed') throw new Error('Delivery is pending reconciliation or another worker');
  let sendStarted = false;
  let sendRequested = false;
  try {
    await work(async () => {
      if (sendRequested) throw new Error('Only one reply may be sent per receipt');
      sendRequested = true;
      await store.transition(item, 'sending');
      sendStarted = true;
    });
    if (!sendStarted) throw new Error('Delivery completed without a send operation');
    await store.transition(item, 'sent');
    return 'sent';
  } catch (error) {
    // Only an explicit provider rejection permits replay after a send was attempted.
    const next = sendStarted && (!error || error.deliveryRejected !== true) ? 'uncertain' : 'retryable';
    try { await store.transition(item, next); } catch (_) {
      // A lost receipt write must never turn into permission to send again.
      // The persisted sending lease becomes uncertain when the next worker checks it.
    }
    throw error;
  }
}
module.exports = { createDeliveryStore, withDeliveryReceipt, PROJECT_URL };
