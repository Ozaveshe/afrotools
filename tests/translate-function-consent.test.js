'use strict';

const assert = require('assert');

const translate = require('../netlify/functions/translate.js');

const CONSENT = 'x-afrotools-external-translation-consent';
const FALLBACK_CONSENT = 'x-afrotools-translation-fallback-consent';
const syntheticText = 'Synthetic private fixture 9e4d6b';
const originalFetch = global.fetch;
const originalFallbackUrl = process.env.TRANSLATE_FALLBACK_URL;
const originalWarn = console.warn;

function event(body, headers, method) {
  return {
    httpMethod: method || 'POST',
    headers: Object.assign({
      origin: 'https://afrotools.com',
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.' + Math.floor(Math.random() * 200 + 1),
    }, headers || {}),
    body: typeof body === 'string' ? body : JSON.stringify(body || {}),
  };
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return typeof data === 'string' ? data : JSON.stringify(data);
    },
  };
}

function myMemoryResult(translatedText) {
  return {
    responseStatus: 200,
    responseData: { translatedText },
  };
}

function assertNoStore(result) {
  assert.match(result.headers['Cache-Control'], /private/);
  assert.match(result.headers['Cache-Control'], /no-store/);
  assert.strictEqual(result.headers.Pragma, 'no-cache');
}

async function run() {
  translate._test.resetRateLimits();

  let providerCalls = 0;
  global.fetch = async function () {
    providerCalls += 1;
    return response(200, myMemoryResult('Habari'));
  };

  const options = await translate.handler(event(null, {}, 'OPTIONS'));
  assert.strictEqual(options.statusCode, 204);
  assert.match(options.headers['Access-Control-Allow-Headers'], /X-AfroTools-External-Translation-Consent/);
  assertNoStore(options);

  const methodNotAllowed = await translate.handler(event({}, {}, 'GET'));
  assert.strictEqual(methodNotAllowed.statusCode, 405);
  assertNoStore(methodNotAllowed);

  const invalidJson = await translate.handler(event('{broken', { [CONSENT]: 'accepted' }));
  assert.strictEqual(invalidJson.statusCode, 400);
  assert.strictEqual(JSON.parse(invalidJson.body).error, 'invalid_json');
  assert.strictEqual(providerCalls, 0);

  const missingConsent = await translate.handler(event({ text: syntheticText, source: 'en', target: 'sw' }));
  assert.strictEqual(missingConsent.statusCode, 428);
  assert.strictEqual(JSON.parse(missingConsent.body).error, 'external_translation_consent_required');
  assert.strictEqual(providerCalls, 0);
  assertNoStore(missingConsent);

  const wrongContentType = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw' },
    { [CONSENT]: 'accepted', 'content-type': 'text/plain' }
  ));
  assert.strictEqual(wrongContentType.statusCode, 415);
  assert.strictEqual(providerCalls, 0);

  const unknownPair = await translate.handler(event(
    { text: syntheticText, source: 'xx', target: 'sw' },
    { [CONSENT]: 'accepted' }
  ));
  assert.strictEqual(unknownPair.statusCode, 400);
  assert.strictEqual(JSON.parse(unknownPair.body).error, 'unsupported_language_pair');
  assert.strictEqual(providerCalls, 0);

  const emptyText = await translate.handler(event(
    { text: '  ', source: 'en', target: 'sw' },
    { [CONSENT]: 'accepted' }
  ));
  assert.strictEqual(emptyText.statusCode, 400);
  assert.strictEqual(providerCalls, 0);

  const longText = await translate.handler(event(
    { text: 'a'.repeat(2001), source: 'en', target: 'sw' },
    { [CONSENT]: 'accepted' }
  ));
  assert.strictEqual(longText.statusCode, 400);
  assert.strictEqual(JSON.parse(longText.body).error, 'text_too_long');
  assert.strictEqual(providerCalls, 0);

  const success = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw', allowFallback: false },
    { [CONSENT]: 'accepted' }
  ));
  assert.strictEqual(success.statusCode, 200);
  const successBody = JSON.parse(success.body);
  assert.strictEqual(successBody.translatedText, 'Habari');
  assert.strictEqual(successBody.unchanged, false);
  assert.strictEqual(successBody.fallbackUsed, false);
  assert.strictEqual(providerCalls, 1);
  assert.ok(!success.body.includes(syntheticText));
  assertNoStore(success);

  providerCalls = 0;
  global.fetch = async function () {
    providerCalls += 1;
    return response(200, myMemoryResult(syntheticText));
  };
  const unchanged = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw', allowFallback: true },
    { [CONSENT]: 'accepted', [FALLBACK_CONSENT]: 'accepted' }
  ));
  assert.strictEqual(unchanged.statusCode, 200);
  assert.strictEqual(JSON.parse(unchanged.body).unchanged, true);
  assert.strictEqual(JSON.parse(unchanged.body).fallbackUsed, false);
  assert.strictEqual(providerCalls, 1, 'unchanged output must not trigger fallback');

  const warnings = [];
  console.warn = function () {
    warnings.push(Array.from(arguments).join(' '));
  };
  providerCalls = 0;
  global.fetch = async function () {
    providerCalls += 1;
    return response(503, {});
  };
  const noSpray = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw', allowFallback: true },
    { [CONSENT]: 'accepted' }
  ));
  assert.strictEqual(noSpray.statusCode, 502);
  assert.strictEqual(providerCalls, 1, 'fallback must not run without explicit fallback consent');
  assert.ok(warnings.every((entry) => !entry.includes(syntheticText)), 'logs must not include source text');
  assertNoStore(noSpray);

  process.env.TRANSLATE_FALLBACK_URL = 'https://fallback.example';
  providerCalls = 0;
  global.fetch = async function (url) {
    providerCalls += 1;
    if (String(url).startsWith('https://api.mymemory.')) return response(503, {});
    assert.strictEqual(url, 'https://fallback.example/translate');
    return response(200, { translatedText: 'Fallback result' });
  };
  const withFallback = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw', allowFallback: true },
    { [CONSENT]: 'accepted', [FALLBACK_CONSENT]: 'accepted' }
  ));
  assert.strictEqual(withFallback.statusCode, 200);
  assert.strictEqual(JSON.parse(withFallback.body).fallbackUsed, true);
  assert.strictEqual(JSON.parse(withFallback.body).provider, 'configured-fallback');
  assert.strictEqual(providerCalls, 2, 'only one configured fallback may run');

  const firstOrigin = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw' },
    { origin: 'http://localhost:4173' }
  ));
  const secondOrigin = await translate.handler(event(
    { text: syntheticText, source: 'en', target: 'sw' },
    { origin: 'https://afrotools.com' }
  ));
  assert.strictEqual(firstOrigin.headers['Access-Control-Allow-Origin'], 'http://localhost:4173');
  assert.strictEqual(secondOrigin.headers['Access-Control-Allow-Origin'], 'https://afrotools.com');

  global.fetch = function (url, options) {
    return new Promise(function (_, reject) {
      options.signal.addEventListener('abort', function () {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  };
  await assert.rejects(
    translate._test.fetchWithBounds('https://provider.example', {}, 5),
    function (error) {
      return error && error.code === 'upstream_timeout' && error.retryable === true;
    }
  );

  console.log('translate-function-consent.test.js passed');
}

run().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
}).finally(function () {
  global.fetch = originalFetch;
  console.warn = originalWarn;
  if (originalFallbackUrl === undefined) delete process.env.TRANSLATE_FALLBACK_URL;
  else process.env.TRANSLATE_FALLBACK_URL = originalFallbackUrl;
});
