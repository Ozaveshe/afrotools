'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const consent = require('../assets/js/lib/external-translation-consent.js');

const removed = [];
const storage = {
  getItem() {
    throw new Error('legacy raw values must never be read');
  },
  removeItem(key) {
    removed.push(key);
  },
};

assert.strictEqual(consent.cleanupLegacyCaches(storage), true);
assert.deepStrictEqual(removed, consent.LEGACY_CACHE_KEYS);
assert.strictEqual(new Set(removed).size, 7);

const liveClient = fs.readFileSync(path.join(root, 'assets/js/lib/live-translate.js'), 'utf8');
assert.ok(liveClient.includes('ExternalTranslationConsent'));
assert.ok(liveClient.includes("cache: 'no-store'"));
assert.ok(liveClient.includes("credentials: 'same-origin'"));
assert.ok(liveClient.includes('consent.requireConsent'));
assert.ok(liveClient.includes('memoryCache = new Map()'));
assert.ok(!/localStorage|sessionStorage|indexedDB/i.test(liveClient), 'shared client must not persist raw text');
assert.ok(!/location\.(?:hash|search)|URLSearchParams/.test(liveClient), 'shared client must not put raw text in the URL');
assert.ok(!/analytics|gtag\s*\(/i.test(liveClient), 'shared client must not send raw text to analytics');

const routes = [
  'swahili-translator',
  'yoruba-translator',
  'hausa-translator',
  'igbo-translator',
  'amharic-translator',
  'zulu-translator',
  'french-african',
];

for (const slug of routes) {
  const html = fs.readFileSync(path.join(root, 'tools', slug, 'index.html'), 'utf8');
  const consentIndex = html.indexOf('/assets/js/lib/external-translation-consent.js');
  const sharedClientIndex = html.indexOf('/assets/js/lib/live-translate.js');
  const routeClientIndex = html.indexOf(`/tools/${slug}/translator-vip.js`);
  const clientIndex = sharedClientIndex > -1 ? sharedClientIndex : routeClientIndex;
  assert.ok(consentIndex > -1, `${slug} must load the external translation consent helper`);
  assert.ok(clientIndex > consentIndex, `${slug} must load consent before its shared or route-owned live translation client`);
  assert.ok(html.includes(`toolId:"${slug}"`), `${slug} must use a route-specific consent id`);
}

const pidgin = fs.readFileSync(path.join(root, 'tools/pidgin-translator/index.html'), 'utf8');
assert.ok(pidgin.includes('/assets/js/lib/external-translation-consent.js'));
assert.ok(pidgin.includes("consent.requireConsent('pidgin-translator'"));
assert.ok(pidgin.includes("'X-AfroTools-External-Translation-Consent'") || pidgin.includes("consent.headers('pidgin-translator')"));
assert.ok(pidgin.includes("cache: 'no-store'"));
assert.ok(!pidgin.includes('afro_translate_cache_'));

const pdf = fs.readFileSync(path.join(root, 'tools/pdf-translate/index.html'), 'utf8');
assert.ok(pdf.includes("'X-AfroTools-External-Translation-Consent': 'accepted'"));
assert.ok(pdf.includes("cache: 'no-store'"));
assert.ok(pdf.includes("mode !== 'local'"), 'PDF local glossary mode contract must remain present');

console.log('external-translation-consent.test.js passed');
