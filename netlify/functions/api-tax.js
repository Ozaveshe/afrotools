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
const { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
const { getApiPlanLimit, normalizeApiTier } = require('./_shared/api-plans');

const CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

function respond(status, body, extra = {}) {
  return { statusCode: status, headers: { ...CORS, ...extra }, body: JSON.stringify(body) };
}

function sandboxRateKey(apiKey, event) {
  const headers = event.headers || {};
  const ip = String(
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['x-forwarded-for'] ||
    'unknown'
  ).split(',')[0].trim() || 'unknown';
  return 'sandbox:' + apiKey + ':' + ip;
}

function sandboxTaxResponse(body) {
  const country = String((body && body.country) || 'NG').toUpperCase();
  const grossAnnual = Number((body && (body.grossAnnual || (body.grossMonthly ? body.grossMonthly * 12 : 0))) || 7200000);
  const taxAnnual = Math.round(grossAnnual * 0.1413);
  const pension = Math.round(grossAnnual * 0.08);
  const netAnnual = Math.max(0, grossAnnual - taxAnnual - pension);
  return {
    status: 'success',
    sandbox: true,
    input: { country, grossAnnual },
    deductions: {
      pension,
      totalDeductions: pension
    },
    tax: {
      taxableIncome: Math.max(0, grossAnnual - pension),
      netTax: taxAnnual,
      bands: [
        { label: 'Sandbox PAYE estimate', rate: 0.1413, amount: taxAnnual }
      ]
    },
    result: {
      netAnnual,
      netMonthly: Math.round(netAnnual / 12),
      effectiveRate: '14.13%'
    },
    _meta: {
      api: 'AfroTax',
      version: 'v1',
      timestamp: new Date().toISOString(),
      sandbox: true,
      dataPolicy: 'deterministic sandbox data',
      docs: 'https://afrotools.com/docs/api/tax'
    }
  };
}

async function validateApiKey(apiKey, event) {
  if (!apiKey) return { valid: false };

  // Sandbox keys use deterministic data and their own free-tier limits.
  if (apiKey.startsWith('afro_test_')) {
    const freeLimits = getApiPlanLimit('free');
    const key = sandboxRateKey(apiKey, event);
    if (!checkRateLimit(key, freeLimits.day)) {
      return { valid: true, tier: 'sandbox', sandbox: true, remaining: 0, limit: freeLimits.day, resetAt: 'midnight UTC' };
    }
    return { valid: true, tier: 'sandbox', sandbox: true, remaining: getRemaining(key, freeLimits.day), limit: freeLimits.day };
  }

  try {
    const store = getStore('apikeys');
    const data = await store.get(apiKey, { type: 'json' });
    if (!data) return { valid: false };

    const tier = normalizeApiTier(data.tier || 'free');
    const limits = getApiPlanLimit(tier);
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    // Initialise usage buckets
    if (!data.usage) data.usage = {};
    if (!data.usage[today]) data.usage[today] = 0;
    if (!data.usage[month]) data.usage[month] = 0;

    const dailyUsage = data.usage[today];
    const monthlyUsage = data.usage[month];

    // Check daily limit (-1 means custom contract limit)
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
    event.headers['X-Api-Key'] ||
    (event.queryStringParameters || {}).api_key;

  const auth = await validateApiKey(apiKey, event);

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

    if (auth.sandbox) {
      if (!country) {
        return respond(200, {
          status: 'success',
          sandbox: true,
          countries: [{ country: 'NG', name: 'Nigeria Sandbox', currency: 'NGN' }],
          total: 1,
          dataPolicy: 'deterministic sandbox data'
        });
      }
      return respond(200, {
        status: 'success',
        sandbox: true,
        country: 'NG',
        name: 'Nigeria Sandbox',
        currency: 'NGN',
        regimes: ['SANDBOX_2026'],
        options: { pension: true },
        lastUpdated: '2026-01-01',
        source: 'AfroTools sandbox data'
      });
    }

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

    if (auth.sandbox) {
      return respond(200, sandboxTaxResponse(body));
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
