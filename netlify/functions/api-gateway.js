const { getStore } = require('@netlify/blobs');
const { getAllowedOrigin } = require('./utils/cors');
const { normalizeTaxOptions, resolveAnnualSalaryInputs } = require('./_shared/tax-request');

const CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

const AVAILABLE_TOOLS = {
  tax: { name: 'tax', aka: ['paye'], description: 'Income tax / PAYE calculation for 50+ African countries', methods: ['POST'], docs: 'https://afrotools.com/docs/api/tax' },
  forex: { name: 'forex', description: 'Live and historical forex rates for African currencies', methods: ['POST'], docs: 'https://afrotools.com/docs/api/forex' },
  countries: { name: 'countries', description: 'List all supported countries and their details', methods: ['POST'], docs: 'https://afrotools.com/docs/api/countries' }
};

function respond(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function makeMeta(tool, auth, startTime) {
  return {
    api: 'AfroTools Gateway',
    version: '1.0',
    tool,
    timestamp: new Date().toISOString(),
    responseTime: `${Date.now() - startTime}ms`,
    usage: { current: auth.usageCurrent, limit: auth.limit, tier: auth.tier }
  };
}

exports.handler = async function (event) {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };

  // --- GET: return API info and available tools ---
  if (event.httpMethod === 'GET') {
    return respond(200, {
      api: 'AfroTools API Gateway',
      version: '1.0',
      status: 'operational',
      docs: 'https://afrotools.com/docs/api',
      tools: Object.values(AVAILABLE_TOOLS).map(t => ({
        tool: t.name,
        description: t.description,
        docs: t.docs
      })),
      authentication: {
        method: 'x-api-key header',
        getKey: 'https://afrotools.com/developers'
      },
      usage: 'POST with JSON body: { "tool": "tax", "inputs": { ... } }'
    });
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed. Use GET for info or POST for calculations.' });
  }

  // --- Authenticate ---
  const apiKey = event.headers['x-api-key'];
  if (!apiKey) {
    return respond(401, { error: 'Missing x-api-key header. Get your key at afrotools.com/developers' });
  }

  let keyData;
  try {
    const store = getStore('apikeys');
    keyData = await store.get(apiKey, { type: 'json' });
  } catch {}

  if (!keyData) {
    return respond(403, { error: 'Invalid API key. Get your key at afrotools.com/developers' });
  }

  // --- Rate limiting ---
  const month = new Date().toISOString().slice(0, 7);
  const usage = keyData.monthlyUsage?.[month] || 0;
  const limits = { free: 100, pro: 10000, enterprise: 999999 };
  const limit = limits[keyData.tier] || 100;

  if (usage >= limit) {
    return respond(429, { error: 'Monthly rate limit exceeded', usage, limit, tier: keyData.tier });
  }

  // --- Parse request ---
  let body;
  try { body = JSON.parse(event.body); } catch { return respond(400, { error: 'Invalid JSON body' }); }

  const { tool, inputs } = body;
  if (!tool) return respond(400, { error: 'Missing "tool" field. Available tools: ' + Object.keys(AVAILABLE_TOOLS).join(', ') });

  // --- Increment usage ---
  try {
    const store = getStore('apikeys');
    if (!keyData.monthlyUsage) keyData.monthlyUsage = {};
    keyData.monthlyUsage[month] = usage + 1;
    await store.setJSON(apiKey, keyData);
  } catch {}

  const authInfo = { usageCurrent: usage + 1, limit, tier: keyData.tier };
  const startTime = Date.now();
  const toolLower = tool.toLowerCase();

  // =================================================================
  //  ROUTE: tax / paye
  // =================================================================
  if (toolLower === 'tax' || toolLower === 'paye') {
    const engines = require('./_engines/index');
    const params = inputs || {};
    const {
      country,
      grossAnnual,
      grossMonthly,
      netAnnual,
      netMonthly,
      ...rawOptions
    } = params;

    if (!country) {
      return respond(400, {
        error: 'Missing required field: inputs.country',
        supported: engines.listCountryCodes(),
        example: { tool: 'tax', inputs: { country: 'NG', grossAnnual: 5000000 } }
      });
    }

    const engine = engines.get(country);
    if (!engine) {
      return respond(404, {
        error: `Country '${country}' not supported`,
        supported: engines.listCountryCodes()
      });
    }

    let salaryInput;
    try {
      salaryInput = resolveAnnualSalaryInputs(params);
    } catch (err) {
      return respond(400, {
        error: err.message,
        code: err.message.includes('Provide exactly one') ? 'INVALID_SALARY_INPUT' : 'INVALID_INPUT'
      });
    }

    if (!salaryInput) {
      return respond(200, {
        status: 'success',
        country: engine.country,
        name: engine.countryName,
        currency: engine.currency,
        regimes: engine.regimes,
        options: engine.getOptions(),
        lastUpdated: engine.lastUpdated,
        hint: 'Provide exactly one of grossAnnual, grossMonthly, netAnnual, or netMonthly in inputs to calculate.',
        _meta: makeMeta('tax', authInfo, startTime)
      });
    }

    try {
      const options = normalizeTaxOptions(country, rawOptions);
      const result = salaryInput.mode === 'gross'
        ? engine.calculate({ grossAnnual: salaryInput.annualAmount, ...options })
        : engine.reverseCalculate({ netAnnual: salaryInput.annualAmount, ...options });

      return respond(200, {
        status: 'success',
        ...result,
        _meta: makeMeta('tax', authInfo, startTime)
      });
    } catch (err) {
      return respond(400, { error: err.message, code: 'ENGINE_ERROR' });
    }
  }

  // =================================================================
  //  ROUTE: countries
  // =================================================================
  if (toolLower === 'countries') {
    const engines = require('./_engines/index');
    const params = inputs || {};

    // If a specific country code is requested, return its details
    if (params.country) {
      const engine = engines.get(params.country);
      if (!engine) {
        return respond(404, {
          error: `Country '${params.country}' not supported`,
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
        _meta: makeMeta('countries', authInfo, startTime)
      });
    }

    return respond(200, {
      status: 'success',
      countries: engines.listCountries(),
      total: engines.count(),
      _meta: makeMeta('countries', authInfo, startTime)
    });
  }

  // =================================================================
  //  ROUTE: forex
  // =================================================================
  if (toolLower === 'forex') {
    const { getData } = require('./_shared/data-store');
    const params = inputs || {};

    // Fetch latest forex rates
    const forexData = await getData('forex-latest');
    if (!forexData) {
      return respond(503, { error: 'Forex data temporarily unavailable. Try again later.' });
    }

    // If a specific pair is requested, look for history
    if (params.pair) {
      const pair = params.pair.toLowerCase().replace('/', '-');
      const historyKey = `forex-history-${pair}-30d`;
      const history = await getData(historyKey);

      // Find the specific rate in latest data
      const pairUpper = params.pair.toUpperCase().replace('-', '/');
      let rate = null;
      if (forexData.rates) {
        // Try to find the rate — structure may vary
        const [base, quote] = pair.split('-');
        rate = forexData.rates[quote.toUpperCase()] || forexData.rates[pair] || null;
      }

      return respond(200, {
        status: 'success',
        pair: pairUpper,
        rate,
        history: history || null,
        source: forexData.source || null,
        lastUpdated: forexData.timestamp || forexData.lastUpdated || null,
        _meta: makeMeta('forex', authInfo, startTime)
      });
    }

    // Return all latest rates
    return respond(200, {
      status: 'success',
      ...forexData,
      _meta: makeMeta('forex', authInfo, startTime)
    });
  }

  // =================================================================
  //  ROUTE: unknown tool — helpful error
  // =================================================================
  return respond(400, {
    error: `Unknown tool: "${tool}"`,
    available_tools: Object.keys(AVAILABLE_TOOLS),
    details: Object.values(AVAILABLE_TOOLS).map(t => ({
      tool: t.name,
      description: t.description,
      docs: t.docs
    })),
    hint: 'Use one of the available tools listed above.'
  });
};
