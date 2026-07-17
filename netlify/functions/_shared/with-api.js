'use strict';

const { checkRateLimit, getRemaining } = require('./rate-limit');

const DEFAULT_DOCS = 'https://afrotools.com/docs/api';

function isRequest(value) {
  return !!value && typeof value.url === 'string' && value.headers && typeof value.headers.get === 'function';
}

function header(event, name) {
  if (!event || !event.headers) return '';
  if (typeof event.headers.get === 'function') return event.headers.get(name) || '';
  const expected = String(name).toLowerCase();
  const match = Object.keys(event.headers).find(function (key) {
    return key.toLowerCase() === expected;
  });
  return match ? event.headers[match] : '';
}

function response(event, statusCode, body, extraHeaders) {
  const headers = Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }, extraHeaders || {});

  if (isRequest(event)) {
    return new Response(JSON.stringify(body), { status: statusCode, headers: headers });
  }
  return { statusCode: statusCode, headers: headers, body: JSON.stringify(body) };
}

function envelope(error, code, docs) {
  return {
    error: error,
    code: code,
    docs: docs || DEFAULT_DOCS,
  };
}

function clientKey(event, name) {
  const ip = String(
    header(event, 'x-nf-client-connection-ip') ||
    header(event, 'client-ip') ||
    header(event, 'x-forwarded-for') ||
    'unknown'
  ).split(',')[0].trim() || 'unknown';
  return (name || 'api') + ':' + ip;
}

function normalizeRateLimit(rateLimit) {
  if (!rateLimit) return null;
  if (typeof rateLimit === 'number') return { limit: rateLimit };
  if (rateLimit === true) return { limit: 100 };
  return Object.assign({}, rateLimit);
}

async function authorize(auth, event, context) {
  if (!auth) return null;
  const validator = typeof auth === 'function' ? auth : auth.validate;
  if (typeof validator !== 'function') {
    throw new TypeError('withApi auth must be a function or { validate } object');
  }
  const result = await validator(event, context);
  if (result === true || (result && (result.valid || result.user))) return null;
  const denied = result || {};
  return {
    status: denied.status || denied.statusCode || 401,
    error: denied.error || 'Authentication required',
    code: denied.code || 'AUTH_REQUIRED',
    docs: denied.docs,
    headers: denied.headers,
  };
}

/**
 * Wrap a Netlify v1 handler or v2 Request handler without changing successful
 * or explicitly handled responses. Auth and rate limiting are opt-in so an
 * existing endpoint can migrate without silently changing its contract.
 */
function withApi(handler, options) {
  if (typeof handler !== 'function') throw new TypeError('withApi requires a handler function');
  const settings = options || {};
  const name = settings.name || handler.name || 'api';
  const docs = settings.docs || DEFAULT_DOCS;
  const rateLimit = normalizeRateLimit(settings.rateLimit);

  return async function hardenedApiHandler(event, context) {
    try {
      const denied = await authorize(settings.auth, event, context);
      if (denied) {
        return response(event, denied.status, envelope(denied.error, denied.code, denied.docs || docs), denied.headers);
      }

      if (rateLimit) {
        const limit = Number(rateLimit.limit || 100);
        const key = typeof rateLimit.key === 'function'
          ? rateLimit.key(event, context)
          : clientKey(event, name);
        if (!checkRateLimit(String(key), limit)) {
          return response(event, 429, envelope(
            rateLimit.error || 'Rate limit exceeded',
            rateLimit.code || 'RATE_LIMIT_EXCEEDED',
            rateLimit.docs || docs
          ), {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
          });
        }
        if (rateLimit.headers && context && typeof context === 'object') {
          context.apiRateLimit = { limit: limit, remaining: getRemaining(String(key), limit) };
        }
      }

      return await handler(event, context);
    } catch (error) {
      console.error('[' + name + '] unhandled ' + ((error && error.name) || 'Error'));
      return response(event, 500, envelope('Internal server error', 'INTERNAL_ERROR', docs));
    }
  };
}

module.exports = {
  DEFAULT_DOCS,
  withApi,
};
