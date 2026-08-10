'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const previousAnthropicKey = process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
delete require.cache[require.resolve('../netlify/functions/ai-advisor.js')];
const advisor = require('../netlify/functions/ai-advisor.js');

const root = path.resolve(__dirname, '..');

function event(body, headers) {
  return {
    httpMethod: 'POST',
    headers: Object.assign({
      origin: 'https://afrotools.com',
      'x-forwarded-for': '203.0.113.77',
    }, headers || {}),
    body: JSON.stringify(body),
  };
}

async function expectError(body, headers, expected) {
  const response = await advisor.handler(event(body, headers));
  assert.equal(response.statusCode, 428);
  assert.equal(JSON.parse(response.body).error, expected);
}

async function run() {
  const payeContext = {
    toolId: 'tn-paye', locale: 'sw', gross: 100000, tax: 32000,
    contribution: 9180, net: 58820, currency: 'TND', sourceReviewed: '2026-08-09',
  };
  const payeMessages = [{ role: 'user', content: 'Eleza makadirio haya kwa Kiswahili.' }];
  const businessMessages = [{ role: 'user', content: 'Jibu kwa Kiswahili. Muktadha: {"countryCode":"KE"}' }];

  await expectError({ consent: true, context: payeContext, messages: payeMessages }, {}, 'ai_consent_required');
  await expectError({ toolId: 'business-planner', messages: businessMessages }, {}, 'ai_consent_required');

  // A synthetic sensitive key deliberately stops the real handler at its second
  // consent gate. Reaching this error proves the general AI consent contract was
  // accepted without allowing this test to contact any model provider.
  await expectError({
    aiConsent: 'accepted',
    context: payeContext,
    messages: payeMessages,
    financialData: { synthetic: true },
  }, { 'x-afrotools-ai-consent': 'accepted' }, 'ai_content_consent_required');
  await expectError({
    aiConsent: 'accepted',
    toolId: 'business-planner',
    messages: businessMessages,
    financialData: { synthetic: true },
  }, { 'x-afrotools-ai-consent': 'accepted' }, 'ai_content_consent_required');

  const payeController = fs.readFileSync(path.join(root, 'assets/js/pages/sw-final-paye.js'), 'utf8');
  const businessController = fs.readFileSync(path.join(root, 'assets/js/pages/financial/business-planner-sw-controller.js'), 'utf8');
  for (const source of [payeController, businessController]) {
    assert.match(source, /'X-AfroTools-AI-Consent':'accepted'/);
    assert.match(source, /aiConsent:'accepted'/);
  }
  assert.match(payeController, /consent\.checked[\s\S]*fetch\('\/.netlify\/functions\/ai-advisor'/);
  assert.match(businessController, /advisor-consent[\s\S]*\.checked[\s\S]*fetch\('\/.netlify\/functions\/ai-advisor'/);
}

run()
  .then(() => {
    if (previousAnthropicKey) process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    console.log('sw-ai-advisor-consent-contract.test.js passed');
  })
  .catch((error) => {
    if (previousAnthropicKey) process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    console.error(error);
    process.exitCode = 1;
  });
