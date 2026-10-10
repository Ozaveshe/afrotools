const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Isolate environment and network access: every account/provider value is synthetic.
async function billingFixture(options = {}) {
  const requests = [];
  const profile = options.profile === undefined ? {
    id: 'billing-fixture', subscription_tier: 'pro',
    subscription_expires_at: '2020-01-01T00:00:00Z'
  } : options.profile;
  const sandbox = {
    exports: {},
    process: { env: {
      SUPABASE_AUTH_URL: 'https://zpclagtgczsygrgztlts.supabase.co',
      SUPABASE_AUTH_SERVICE_KEY: 'synthetic-service-key',
      ...(options.providerKey ? { PAYSTACK_SECRET_KEY: 'synthetic-provider-key' } : {})
    } },
    console: { error() {} },
    require(name) {
      if (name === './utils/cors') return { getAllowedOrigin: () => 'https://afrotools.test' };
      if (name === './_shared/browser-session-auth') return {
        getUserFromEvent: async () => ({ user: options.signedOut ? null : { id: 'billing-fixture' } })
      };
      throw new Error('Unexpected dependency: ' + name);
    },
    async fetch(url, config) {
      requests.push({ url, method: config.method || 'GET' });
      if (url.startsWith('https://zpclagtgczsygrgztlts.supabase.co/rest/v1/profiles?id=eq.billing-fixture&')) {
        return { ok: true, json: async () => profile ? [profile] : [] };
      }
      if (url.startsWith('https://api.paystack.co/subscription/')) {
        return {
          ok: !options.providerFailure,
          status: options.providerFailure ? 503 : 200,
          json: async () => options.providerFailure ? { status: false, message: 'Synthetic provider outage' } :
            { status: true, data: options.subscription === undefined ? null : options.subscription }
        };
      }
      throw new Error('Unexpected network request: ' + url);
    }
  };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../netlify/functions/api-pro-billing.js'), 'utf8'), sandbox);
  const response = await sandbox.exports.handler({
    httpMethod: options.method || 'GET', headers: {},
    body: options.body === undefined ? '' : JSON.stringify(options.body)
  });
  return { ...response, data: JSON.parse(response.body || '{}'), requests };
}

module.exports = { billingFixture };
