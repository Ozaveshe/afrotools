/**
 * AfroTools optional external translation proxy.
 *
 * Local phrasebooks do not use this function. Arbitrary text reaches a
 * configured translation provider only after translation-specific consent.
 */

const { corsHeaders } = require('./utils/cors');

const CONSENT_HEADER = 'x-afrotools-external-translation-consent';
const FALLBACK_CONSENT_HEADER = 'x-afrotools-translation-fallback-consent';
const ACCEPTED = 'accepted';
const MAX_TEXT_CHARACTERS = 2000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_PROVIDER_RESPONSE_BYTES = 128 * 1024;
const PROVIDER_TIMEOUT_MS = 8000;
const RATE_LIMIT = 200;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;
const PRIMARY_PROVIDER_URL = 'https://api.mymemory.translated.net/get';

const LANGUAGE_CODES = new Set([
  'af', 'am', 'ar', 'bm', 'en', 'es', 'fr', 'ha', 'ig', 'lg', 'ln', 'mg',
  'ny', 'om', 'pcm', 'pt', 'rw', 'sn', 'so', 'st', 'sw', 'ti', 'tn', 'ts',
  'tw', 'wo', 'xh', 'yo', 'zu',
]);

const rateLimitMap = new Map();

class ProviderError extends Error {
  constructor(code, retryable) {
    super(code);
    this.name = 'ProviderError';
    this.code = code;
    this.retryable = Boolean(retryable);
  }
}

function getHeader(headers, name) {
  if (!headers) return '';
  const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
  if (direct) return String(direct);
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key]) : '';
}

function hasAcceptedHeader(event, name) {
  return getHeader(event && event.headers, name).toLowerCase() === ACCEPTED;
}

function responseHeaders(event) {
  return corsHeaders(event, {
    'Access-Control-Allow-Headers': [
      'Content-Type',
      'X-AfroTools-External-Translation-Consent',
      'X-AfroTools-Translation-Fallback-Consent',
      'X-AfroTools-AI-Consent',
      'X-AfroTools-AI-Content-Consent',
    ].join(', '),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache',
    'Vary': 'Origin',
  });
}

function json(event, statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign(responseHeaders(event), extraHeaders || {}),
    body: JSON.stringify(body),
  };
}

function clientIp(event) {
  const forwarded = getHeader(event && event.headers, 'x-forwarded-for');
  return (forwarded.split(',')[0] || getHeader(event && event.headers, 'client-ip') || 'unknown').trim();
}

function checkRateLimit(ip) {
  const now = Date.now();
  const current = rateLimitMap.get(ip);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { startedAt: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  current.count += 1;
  return {
    allowed: current.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - current.count),
  };
}

function unicodeLength(value) {
  return Array.from(value).length;
}

function parseRequest(event) {
  const raw = event.body || '';
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return { error: 'request_too_large', statusCode: 413 };
  }
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch (_) {
    return { error: 'invalid_json', statusCode: 400 };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'invalid_request', statusCode: 400 };
  }
  if (typeof body.text !== 'string') {
    return { error: 'invalid_text', statusCode: 400 };
  }

  const text = body.text.trim();
  if (!text) return { error: 'empty_text', statusCode: 400 };
  if (unicodeLength(text) > MAX_TEXT_CHARACTERS) {
    return { error: 'text_too_long', statusCode: 400 };
  }

  const source = String(body.source || 'en').toLowerCase();
  const target = String(body.target || '').toLowerCase();
  const sourceAllowed = source === 'auto' || LANGUAGE_CODES.has(source);
  const targetAllowed = LANGUAGE_CODES.has(target);
  if (!sourceAllowed || !targetAllowed || source === target) {
    return { error: 'unsupported_language_pair', statusCode: 400 };
  }

  return {
    body,
    text,
    source,
    target,
    allowFallback: body.allowFallback === true,
  };
}

async function fetchWithBounds(url, options, timeoutMs) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const requestOptions = Object.assign({}, options || {});
  if (controller) requestOptions.signal = controller.signal;

  try {
    const response = await fetch(url, requestOptions);
    if (response.status === 429 || response.status >= 500) {
      throw new ProviderError(`upstream_${response.status}`, true);
    }
    if (!response.ok) throw new ProviderError(`upstream_${response.status}`, false);

    const responseText = await response.text();
    if (Buffer.byteLength(responseText, 'utf8') > MAX_PROVIDER_RESPONSE_BYTES) {
      throw new ProviderError('upstream_response_too_large', false);
    }
    try {
      return JSON.parse(responseText);
    } catch (_) {
      throw new ProviderError('upstream_invalid_json', false);
    }
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error && error.name === 'AbortError') {
      throw new ProviderError('upstream_timeout', true);
    }
    throw new ProviderError('upstream_network_error', true);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function translateMyMemory(text, source, target) {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
    de: 'hello@afrotools.com',
  });
  const data = await fetchWithBounds(`${PRIMARY_PROVIDER_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { 'User-Agent': 'AfroTools/1.0' },
    cache: 'no-store',
  }, PROVIDER_TIMEOUT_MS);

  const translatedText = data && data.responseData && data.responseData.translatedText;
  const warning = typeof translatedText === 'string' && (
    translatedText.toUpperCase().includes('MYMEMORY WARNING') ||
    translatedText.toUpperCase().includes('PLEASE DEFINE')
  );
  if (data && data.responseStatus === 200 && typeof translatedText === 'string' && translatedText.trim() && !warning) {
    return { translatedText: translatedText.trim(), provider: 'mymemory' };
  }
  throw new ProviderError('upstream_empty_translation', true);
}

function configuredFallbackUrl() {
  const candidate = String(process.env.TRANSLATE_FALLBACK_URL || '').trim();
  if (!candidate) return '';
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'https:' ? parsed.origin : '';
  } catch (_) {
    return '';
  }
}

async function translateFallback(baseUrl, text, source, target) {
  const data = await fetchWithBounds(`${baseUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text',
    }),
    cache: 'no-store',
  }, PROVIDER_TIMEOUT_MS);
  if (data && typeof data.translatedText === 'string' && data.translatedText.trim()) {
    return { translatedText: data.translatedText.trim(), provider: 'configured-fallback' };
  }
  throw new ProviderError('fallback_empty_translation', false);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: responseHeaders(event), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(event, 405, { error: 'method_not_allowed' });
  }

  const contentType = getHeader(event.headers, 'content-type').toLowerCase();
  if (!contentType.startsWith('application/json')) {
    return json(event, 415, { error: 'json_content_type_required' });
  }
  if (!hasAcceptedHeader(event, CONSENT_HEADER)) {
    return json(event, 428, {
      error: 'external_translation_consent_required',
      message: 'Cloud translation was not contacted. Review the external translation notice and opt in first.',
    });
  }

  const parsed = parseRequest(event);
  if (parsed.error) return json(event, parsed.statusCode, { error: parsed.error });

  const rate = checkRateLimit(clientIp(event));
  if (!rate.allowed) {
    return json(event, 429, { error: 'rate_limit_exceeded' }, {
      'Retry-After': '3600',
      'X-RateLimit-Remaining': '0',
    });
  }

  let result;
  let fallbackUsed = false;
  try {
    result = await translateMyMemory(parsed.text, parsed.source, parsed.target);
  } catch (error) {
    console.warn('[Translate] primary provider failed:', error instanceof ProviderError ? error.code : 'unknown_error');
    const fallbackUrl = configuredFallbackUrl();
    const fallbackConsented = hasAcceptedHeader(event, FALLBACK_CONSENT_HEADER);
    if (!(error instanceof ProviderError && error.retryable && parsed.allowFallback && fallbackConsented && fallbackUrl)) {
      return json(event, 502, {
        error: 'translation_service_unavailable',
        localFallbackAvailable: true,
      }, { 'X-RateLimit-Remaining': String(rate.remaining) });
    }
    try {
      result = await translateFallback(fallbackUrl, parsed.text, parsed.source, parsed.target);
      fallbackUsed = true;
    } catch (fallbackError) {
      console.warn('[Translate] fallback provider failed:', fallbackError instanceof ProviderError ? fallbackError.code : 'unknown_error');
      return json(event, 502, {
        error: 'translation_service_unavailable',
        localFallbackAvailable: true,
      }, { 'X-RateLimit-Remaining': String(rate.remaining) });
    }
  }

  return json(event, 200, {
    translatedText: result.translatedText,
    source: parsed.source,
    target: parsed.target,
    provider: result.provider,
    characters: unicodeLength(parsed.text),
    unchanged: result.translatedText === parsed.text,
    fallbackUsed,
  }, { 'X-RateLimit-Remaining': String(rate.remaining) });
};

exports._test = {
  CONSENT_HEADER,
  FALLBACK_CONSENT_HEADER,
  LANGUAGE_CODES,
  ProviderError,
  parseRequest,
  responseHeaders,
  fetchWithBounds,
  translateMyMemory,
  translateFallback,
  unicodeLength,
  resetRateLimits() {
    rateLimitMap.clear();
  },
};
