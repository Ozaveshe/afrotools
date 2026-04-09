/**
 * AfroTax API — Tax Calculation Endpoint
 * POST: Calculate income tax (gross-to-net or net-to-gross)
 * GET:  Country info or list all supported countries
 * Auth: x-api-key header or api_key query param
 */
const engines = require('./_engines/index');
const { getStore } = require('@netlify/blobs');
const { getAllowedOrigin } = require('./utils/cors');
const { normalizeTaxOptions, resolveAnnualSalaryInputs } = require('./_shared/tax-request');

const CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

const LIMITS = {
  free: { day: 100, month: 3000 },
  starter: { day: 10000, month: 300000 },
  pro: { day: 100000, month: 3000000 },
  enterprise: { day: -1, month: -1 }
};

function respond(status, body, extra = {}) {
  return { statusCode: status, headers: { ...CORS, ...extra }, body: JSON.stringify(body) };
}

async function validateApiKey(apiKey) {
  if (!apiKey) return { valid: false };

  // Sandbox / test keys always pass
  if (apiKey.startsWith('afro_test_')) {
    return { valid: true, tier: 'free', sandbox: true, remaining: 999, limit: 1000 };
  }

  try {
    const store = getStore('apikeys');
    const data = await store.get(apiKey, { type: 'json' });
    if (!data) return { valid: false };

    const tier = data.tier || 'free';
    const limits = LIMITS[tier];
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    // Initialise usage buckets
    if (!data.usage) data.usage = {};
    if (!data.usage[today]) data.usage[today] = 0;
    if (!data.usage[month]) data.usage[month] = 0;

    const dailyUsage = data.usage[today];
    const monthlyUsage = data.usage[month];

    // Check daily limit (-1 means unlimited)
    if (limits.day !== -1 && dailyUsage >= limits.day) {
      return { valid: true, tier, remaining: 0, limit: limits.day, resetAt: 'midnight UTC' };
    }
    // Check monthly limit
    if (limits.month !== -1 && monthlyUsage >= limits.month) {
      return { valid: true, tier, remaining: 0, limit: limits.month, resetAt: 'end of month' };
    }

    // Increment counters and persist
    data.usage[today] = dailyUsage + 1;
    data.usage[month] = monthlyUsage + 1;
    data.lastUsed = new Date().toISOString();
    await store.setJSON(apiKey, data);

    return {
      valid: true,
      tier,
      remaining: limits.day === -1 ? 999999 : limits.day - dailyUsage - 1,
      limit: limits.day
    };
  } catch (err) {
    console.error('Key validation error:', err.message);
    return { valid: false };
  }
}

exports.handler = async (event) => {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  /* ---- CORS preflight ---- */
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };

  /* ---- Authenticate ---- */
  const apiKey =
    event.headers['x-api-key'] ||
    (event.queryStringParameters || {}).api_key;

  const auth = await validateApiKey(apiKey);

  if (!auth.valid) {
    return respond(401, {
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY',
      docs: 'https://afrotools.com/docs/api/authentication'
    });
  }

  if (auth.remaining <= 0) {
    return respond(
      429,
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: auth.limit,
        resetAt: auth.resetAt
      },
      { 'Retry-After': '3600' }
    );
  }

  /* ---- GET: country info / list ---- */
  if (event.httpMethod === 'GET') {
    const country = (event.queryStringParameters || {}).country;

    if (!country) {
      return respond(200, {
        status: 'success',
        countries: engines.listCountries(),
        total: engines.count()
      });
    }

    const engine = engines.get(country);
    if (!engine) {
      return respond(404, {
        error: `Country '${country}' not supported`,
        code: 'INVALID_COUNTRY',
        supported: engines.listCountryCodes()
      });
    }

    return respond(200, {
      status: 'success',
      country: engine.country,
      name: engine.countryName,
      currency: engine.currency,
      regimes: engine.regimes,
      options: engine.getOptions(),
      lastUpdated: engine.lastUpdated,
      source: engine.source
    });
  }

  /* ---- POST: calculate tax ---- */
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return respond(400, { error: 'Invalid JSON body', code: 'INVALID_JSON' });
    }

    const {
      country,
      grossAnnual,
      grossMonthly,
      netAnnual,
      netMonthly,
      ...rawOptions
    } = body;

    if (!country) {
      return respond(400, {
        error: 'Missing required field: country',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    const engine = engines.get(country);
    if (!engine) {
      return respond(404, {
        error: `Country '${country}' not supported`,
        code: 'INVALID_COUNTRY',
        supported: engines.listCountryCodes()
      });
    }

    try {
      const salaryInput = resolveAnnualSalaryInputs(body);
      if (!salaryInput) {
        return respond(400, {
          error: 'Provide exactly one of grossAnnual, grossMonthly, netAnnual, or netMonthly',
          code: 'MISSING_REQUIRED_FIELD'
        });
      }

      const options = normalizeTaxOptions(country, rawOptions);
      const startTime = Date.now();
      const result = salaryInput.mode === 'gross'
        ? engine.calculate({ grossAnnual: salaryInput.annualAmount, ...options })
        : engine.reverseCalculate({ netAnnual: salaryInput.annualAmount, ...options });

      return respond(200, {
        status: 'success',
        ...result,
        _meta: {
          api: 'AfroTax',
          version: '1.0',
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - startTime}ms`,
          sandbox: auth.sandbox || false,
          docs: 'https://afrotools.com/docs/api/tax'
        }
      });
    } catch (err) {
      const code = err.message && err.message.includes('Provide exactly one')
        ? 'INVALID_SALARY_INPUT'
        : 'ENGINE_ERROR';
      return respond(400, { error: err.message, code });
    }
  }

  /* ---- Anything else ---- */
  return respond(405, {
    error: 'Method not allowed. Use GET or POST.',
    code: 'METHOD_NOT_ALLOWED'
  });
};
