const { corsHeaders, corsResponse } = require('./utils/cors');
const { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
const { safeAnthropicText } = require('./_shared/anthropic-request');
const intentRouter = require('../../assets/js/ai/intent-router.js');
const manifestApi = require('../../assets/js/ai/tool-manifest.js');

const MAX_BODY_BYTES = Number(process.env.AFROTOOLS_AI_ROUTER_MAX_BODY_BYTES || 8192);
const MAX_QUERY_CHARS = Number(process.env.AFROTOOLS_AI_ROUTER_MAX_QUERY_CHARS || 1200);
const RATE_LIMIT_PER_DAY = Number(process.env.AFROTOOLS_AI_ROUTER_RATE_LIMIT || 60);
const PROVIDER = String(process.env.AFROTOOLS_AI_ROUTER_PROVIDER || 'anthropic').toLowerCase();
const ANTHROPIC_API_KEY = process.env.AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.AFROTOOLS_AI_ROUTER_MODEL || 'claude-sonnet-4-6';

function json(statusCode, headers, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

function clientIp(event) {
  return String(
    (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'])) ||
    'unknown'
  ).split(',')[0].trim();
}

function parseBody(event) {
  const raw = event.body || '';
  const byteLength = Buffer.byteLength(raw, event.isBase64Encoded ? 'base64' : 'utf8');
  if (byteLength > MAX_BODY_BYTES) {
    const err = new Error('Request body is too large.');
    err.statusCode = 413;
    throw err;
  }

  let body = {};
  try {
    body = raw ? JSON.parse(event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw) : {};
  } catch (err) {
    const parseErr = new Error('Invalid JSON body.');
    parseErr.statusCode = 400;
    throw parseErr;
  }

  const query = String(body.query || body.q || '').trim();
  if (!query) {
    const err = new Error('Missing query.');
    err.statusCode = 400;
    throw err;
  }
  if (query.length > MAX_QUERY_CHARS) {
    const err = new Error('Query is too long.');
    err.statusCode = 413;
    throw err;
  }
  return {
    query,
    consentToModel: body.consentToModel === true || body.allowModel === true,
  };
}

function buildModelPrompt(query, manifest) {
  const compactTools = manifest.slice(0, 60).map((tool) => ({
    id: tool.id,
    route: tool.route,
    title: tool.title,
    category: tool.category,
    subcategory: tool.subcategory,
    intents: tool.userIntents,
    requiredInputs: tool.requiredInputs,
    privacyMode: tool.privacyMode,
    highStakesDomain: tool.highStakesDomain,
  }));

  return [
    'You are the Ask AfroTools AI intent router.',
    'Return only one JSON object. Do not include markdown.',
    'Pick the best existing AfroTools tool. Never invent routes.',
    'If unsure, choose tool-search with /search/.',
    'Required fields: intentCategory, selectedToolId, selectedRoute, confidence, reasonShort, extractedInputs, missingInputs, clarificationQuestion, safetyDomain, highStakesNotice, privacyMode, canPrefill, suggestedNextActions.',
    'Use confidence from 0 to 1.',
    'Available tools:',
    JSON.stringify(compactTools),
    'User query:',
    safeAnthropicText(query, 'Ask AfroTools AI router query', 2000),
  ].join('\n');
}

async function callAnthropicRouter(query, manifest) {
  if (PROVIDER !== 'anthropic' || !ANTHROPIC_API_KEY || typeof fetch !== 'function') return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 900,
        system: 'Return strict JSON for AfroTools routing only. Do not store or repeat sensitive user content beyond extracted workflow fields.',
        messages: [{ role: 'user', content: buildModelPrompt(query, manifest) }],
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[ai-route-intent] provider_error status=' + response.status);
      return null;
    }

    const payload = await response.json();
    const text = payload && payload.content && payload.content[0] && payload.content[0].text;
    if (!text) return null;
    const jsonText = String(text).trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(jsonText);
  } catch (err) {
    clearTimeout(timeout);
    console.warn('[ai-route-intent] provider_unavailable name=' + (err && err.name) + ' message=' + (err && err.message));
    return null;
  }
}

function responsePayload(query, decision, source, fallbackReason) {
  return {
    ok: true,
    source,
    schema: intentRouter.OUTPUT_SCHEMA,
    queryLength: query.length,
    fallbackReason: fallbackReason || '',
    decision,
  };
}

exports.handler = async function handler(event) {
  const headers = corsHeaders(event, {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  });

  if (event.httpMethod === 'OPTIONS') return corsResponse(event);
  if (event.httpMethod !== 'POST') {
    return json(405, headers, { ok: false, error: 'Method not allowed. Use POST.' });
  }

  const limitKey = 'ai-route-intent:' + clientIp(event);
  if (!checkRateLimit(limitKey, RATE_LIMIT_PER_DAY)) {
    return json(429, headers, {
      ok: false,
      error: 'Rate limit exceeded.',
      remaining: 0,
      limit: RATE_LIMIT_PER_DAY,
    });
  }

  let body;
  try {
    body = parseBody(event);
  } catch (err) {
    return json(err.statusCode || 400, headers, {
      ok: false,
      error: err.message,
      decision: intentRouter.fallbackDecision(''),
    });
  }

  const query = body.query;
  const consentToModel = body.consentToModel;
  const manifest = manifestApi.getToolManifestForRouter();
  const deterministic = intentRouter.routeDeterministically(query, { manifest });
  let decision = deterministic;
  let source = ANTHROPIC_API_KEY ? 'deterministic_model_consent_required' : 'deterministic';
  let fallbackReason = ANTHROPIC_API_KEY ? 'model_consent_not_provided' : 'provider_key_not_configured';

  if (ANTHROPIC_API_KEY && consentToModel) {
    source = 'deterministic_with_provider_fallback';
    fallbackReason = 'provider_not_used_or_unavailable';
    const modelDecision = await callAnthropicRouter(query, manifest);
    if (modelDecision) {
      const normalized = intentRouter.normalizeDecision(
        Object.assign({}, modelDecision, { _meta: { router: 'model', providerUsed: true } }),
        query,
        { manifest }
      );
      const validation = intentRouter.validateRouterOutput(normalized);
      if (validation.valid) {
        decision = normalized;
        source = 'model_validated';
        fallbackReason = '';
      } else {
        console.warn('[ai-route-intent] model_validation_failed fields=' + validation.errors.join('|'));
        fallbackReason = 'model_validation_failed';
      }
    }
  }

  const validation = intentRouter.validateRouterOutput(decision);
  if (!validation.valid) {
    console.warn('[ai-route-intent] deterministic_validation_failed fields=' + validation.errors.join('|'));
    decision = intentRouter.fallbackDecision(query);
    source = 'safe_fallback';
    fallbackReason = 'router_validation_failed';
  }

  headers['X-RateLimit-Limit'] = String(RATE_LIMIT_PER_DAY);
  headers['X-RateLimit-Remaining'] = String(getRemaining(limitKey, RATE_LIMIT_PER_DAY));

  return json(200, headers, responsePayload(query, decision, source, fallbackReason));
};
