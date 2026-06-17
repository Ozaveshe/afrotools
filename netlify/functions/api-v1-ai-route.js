const { corsHeaders, corsResponse } = require('./utils/cors');
const { validateApiKey, rateLimitHeaders } = require('./utils/api-auth');
const { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
const intentRouter = require('../../assets/js/ai/intent-router.js');
const toolManifestApi = require('../../assets/js/ai/tool-manifest.js');

const MAX_BODY_BYTES = Number(process.env.AFROTOOLS_API_AI_ROUTE_MAX_BODY_BYTES || 8192);
const MAX_QUERY_CHARS = Number(process.env.AFROTOOLS_API_AI_ROUTE_MAX_CHARS || 1200);
const ROUTE_LIMIT_PER_DAY = Number(process.env.AFROTOOLS_API_AI_ROUTE_LIMIT || 0);
const SUPPORTED_LOCALES = new Set(['en', 'fr', 'pt', 'ar', 'sw', 'ki', 'ha', 'yo']);
const SENSITIVE_CONTEXT_KEY = /(password|secret|token|api.?key|email|phone|cv|resume|document|passport|national.?id|nin|ssn|salary|bank|card)/i;

const CATEGORY_ALIASES = {
  career: ['career', 'career-documents', 'cv-jobs', 'employment'],
  education: ['education', 'scholarships', 'study-abroad', 'immigration'],
  business: ['business', 'business-tax', 'salary-tax', 'tax', 'finance', 'invoices'],
  tax: ['tax', 'business-tax', 'salary-tax'],
  trade: ['trade', 'import-duty', 'customs-duty', 'finance'],
  import: ['trade', 'import-duty', 'customs-duty', 'finance'],
  energy: ['energy', 'solar-energy', 'fuel-energy', 'solar-roi', 'fuel-prices'],
  documents: ['documents', 'pdf-tools'],
  pdf: ['documents', 'pdf-tools'],
  agriculture: ['agriculture'],
  construction: ['construction', 'floor-planning'],
  'local-life': ['local-life', 'cost-of-living', 'rent-affordability', 'rent-vs-buy'],
  relocation: ['local-life', 'cost-of-living', 'immigration'],
  'country-intelligence': ['country-intelligence', 'afroatlas'],
  country: ['country-intelligence', 'afroatlas'],
};
const WEAK_CANDIDATE_TERMS = new Set([
  'africa', 'african', 'compare', 'create', 'generate', 'ghana', 'kenya', 'lagos',
  'nigeria', 'open', 'plan', 'planner', 'tool', 'workflow',
]);

function json(event, statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign(
      {},
      corsHeaders(event, {
        'Cache-Control': 'no-store',
      }),
      extraHeaders || {}
    ),
    body: JSON.stringify(body),
  };
}

function parseBody(raw) {
  if (!raw) return {};
  if (Buffer.byteLength(String(raw), 'utf8') > MAX_BODY_BYTES) {
    const error = new Error('Request body exceeds the maximum routing payload size.');
    error.statusCode = 413;
    error.code = 'request_body_too_large';
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    error.code = 'invalid_json';
    throw error;
  }
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength || 200);
}

function normalizeLocale(value) {
  const locale = cleanText(value || 'en', 16).toLowerCase().split(/[-_]/)[0] || 'en';
  return SUPPORTED_LOCALES.has(locale) ? locale : 'en';
}

function normalizeCategory(value) {
  return cleanText(value, 60).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeAllowedCategories(value) {
  const raw = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',') : []);
  const categories = raw.map(normalizeCategory).filter(Boolean).slice(0, 20);
  if (!categories.length) return null;

  const expanded = new Set();
  categories.forEach(function addCategory(category) {
    expanded.add(category);
    (CATEGORY_ALIASES[category] || []).forEach(function addAlias(alias) {
      expanded.add(alias);
    });
  });
  return expanded;
}

function validatePartnerContext(value) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    const error = new Error('partnerContext must be a small non-sensitive object.');
    error.statusCode = 400;
    error.code = 'invalid_partner_context';
    throw error;
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 1000) {
    const error = new Error('partnerContext is too large for the routing API.');
    error.statusCode = 413;
    error.code = 'partner_context_too_large';
    throw error;
  }
  const keys = [];
  (function collectKeys(input) {
    if (!input || typeof input !== 'object') return;
    Object.keys(input).forEach(function eachKey(key) {
      keys.push(key);
      collectKeys(input[key]);
    });
  })(value);
  if (keys.some(function hasSensitiveKey(key) { return SENSITIVE_CONTEXT_KEY.test(key); })) {
    const error = new Error('partnerContext must not include personal, document, credential, or payment fields.');
    error.statusCode = 400;
    error.code = 'sensitive_partner_context';
    throw error;
  }
}

function clientIp(event) {
  const headers = event.headers || {};
  return String(headers['x-nf-client-connection-ip'] || headers['client-ip'] || headers['x-forwarded-for'] || 'unknown')
    .split(',')[0]
    .trim() || 'unknown';
}

function apiKeyFingerprint(event) {
  const headers = event.headers || {};
  const key = String(headers['x-api-key'] || headers['X-Api-Key'] || (event.queryStringParameters || {}).api_key || 'missing');
  return key.slice(0, 32);
}

function routeLimitHeaders(key) {
  if (!ROUTE_LIMIT_PER_DAY) return {};
  return {
    'X-AI-RouteLimit-Limit': String(ROUTE_LIMIT_PER_DAY),
    'X-AI-RouteLimit-Remaining': String(getRemaining(key, ROUTE_LIMIT_PER_DAY)),
  };
}

function loadManifest() {
  return toolManifestApi.getToolManifestForRouter(toolManifestApi.loadDefaultToolManifest());
}

function findTool(manifest, id) {
  return manifest.find(function find(entry) {
    return entry && (entry.id === id || entry.slug === id || (entry.aliases || []).indexOf(id) !== -1);
  }) || null;
}

function categoryAllowed(decision, tool, allowed) {
  if (!allowed) return true;
  const candidates = [
    decision.intentCategory,
    decision.safetyDomain,
    tool && tool.category,
    tool && tool.subcategory,
  ].map(normalizeCategory).filter(Boolean);
  return candidates.some(function matches(candidate) {
    return allowed.has(candidate);
  });
}

function safeRoute(route, options) {
  let clean = String(route || '/search/').replace(/[\r\n]/g, '');
  if (!clean.startsWith('/')) clean = '/search/';
  if (/^\/\//.test(clean) || /^\/?https?:/i.test(clean)) clean = '/search/';
  clean = clean.replace(/source=ask/g, 'source=api_ai_route');
  if (!/[?&]source=/.test(clean)) {
    clean += clean.indexOf('?') === -1 ? '?source=api_ai_route' : '&source=api_ai_route';
  }

  const params = [];
  const country = cleanText(options && options.country, 80);
  const locale = normalizeLocale(options && options.locale);
  if (country && !/[?&]country=/.test(clean)) params.push('country=' + encodeURIComponent(country));
  if (locale !== 'en' && !/[?&]locale=/.test(clean)) params.push('locale=' + encodeURIComponent(locale));
  if (params.length) clean += (clean.indexOf('?') === -1 ? '?' : '&') + params.join('&');
  return clean;
}

function selectedToolPayload(tool) {
  if (!tool) {
    return {
      id: 'tool-search',
      name: 'Search AfroTools',
      href: '/search/',
    };
  }
  return {
    id: tool.id,
    name: tool.title,
    href: tool.route,
  };
}

function publicToolCallPayload(decision, tool) {
  const selected = tool || {
    id: 'tool-search',
    route: '/search/',
    title: 'Search AfroTools',
    category: 'search',
    subcategory: 'search',
    requiredInputs: [],
    optionalInputs: [],
    privacyMode: 'browser_local',
    sourcePolicy: 'reviewed',
    highStakesDomain: 'none',
    aiCapabilities: ['route_only'],
    outputTypes: ['report'],
  };
  return toolManifestApi.buildToolInvocation(selected, {
    missingInputNames: Array.isArray(decision && decision.missingInputs) ? decision.missingInputs : [],
  });
}

function buildToolCandidates(query, decision, manifest, allowed) {
  if (!toolManifestApi || typeof toolManifestApi.rankToolCandidates !== 'function') return [];
  const selectedToolId = decision && decision.selectedToolId;
  const selectedTool = findTool(manifest, selectedToolId);
  const ranked = toolManifestApi.rankToolCandidates(query, manifest, {
    limit: 8,
    minScore: 8,
    selectedToolId,
  });
  return (ranked.candidates || []).filter(function keep(candidate) {
    if (!candidate || !candidate.tool || !candidate.tool.id || candidate.tool.id === selectedToolId) return false;
    const strongTerms = (candidate.matchedTerms || []).filter(function keepTerm(term) {
      return !WEAK_CANDIDATE_TERMS.has(String(term || '').toLowerCase());
    });
    if (!strongTerms.length) return false;
    const candidateDecision = {
      intentCategory: candidate.tool.subcategory || candidate.tool.category || 'tools',
      safetyDomain: candidate.tool.highStakesDomain || 'none',
    };
    if (!sameSurface(selectedTool, candidate.tool)) return false;
    return categoryAllowed(candidateDecision, candidate.tool, allowed);
  }).slice(0, 5).map(function mapCandidate(candidate) {
    const call = toolManifestApi.buildToolInvocation(candidate.tool);
    return {
      type: 'existing_tool_candidate',
      toolId: call.toolId,
      title: call.title,
      route: call.route,
      category: call.category,
      subcategory: call.subcategory,
      action: call.action,
      canPrefill: call.canPrefill,
      privacyMode: call.privacyMode,
      sourcePolicy: call.sourcePolicy,
      safetyDomain: call.safetyDomain,
      outputTypes: call.outputTypes,
      score: Math.round(Number(candidate.score || 0) * 100) / 100,
    };
  });
}

function sameSurface(selectedTool, candidateTool) {
  if (!selectedTool || !candidateTool) return true;
  const selectedDomain = cleanText(selectedTool.highStakesDomain || 'none', 40);
  const candidateDomain = cleanText(candidateTool.highStakesDomain || 'none', 40);
  if (selectedDomain !== 'none' && candidateDomain !== 'none' && selectedDomain !== candidateDomain) return false;
  if (selectedTool.subcategory && candidateTool.subcategory && selectedTool.subcategory === candidateTool.subcategory) return true;
  if (selectedTool.category && candidateTool.category && selectedTool.category === candidateTool.category) return true;
  if (selectedDomain !== 'none' && candidateDomain !== 'none' && selectedDomain === candidateDomain) return true;
  return selectedDomain === 'none' || candidateDomain === 'none';
}

function buildOrchestrationSummary(decision, tool, toolCall, toolCandidates, options) {
  const opts = options || {};
  const selectedToolId = tool ? tool.id : 'tool-search';
  return {
    schemaVersion: 1,
    type: 'afrotools_ai_orchestration_summary',
    source: 'deterministic_full_catalog_api',
    rawQueryIncluded: false,
    queryLength: cleanText(opts.query, MAX_QUERY_CHARS).length,
    status: tool ? 'success' : 'no_match',
    selectedToolId,
    selectedRoute: tool ? tool.route : '/search/',
    toolCallType: toolCall && toolCall.type || 'existing_tool_call',
    candidateCount: Array.isArray(toolCandidates) ? toolCandidates.length : 0,
    routerSafeToolCount: Array.isArray(opts.manifest) ? opts.manifest.length : 0,
    privacyMode: cleanText(decision && decision.privacyMode || tool && tool.privacyMode || 'browser_local', 40),
    sourcePolicy: cleanText(toolCall && toolCall.sourcePolicy || tool && tool.sourcePolicy || 'reviewed', 40),
    safetyDomain: cleanText(decision && decision.safetyDomain || tool && tool.highStakesDomain || 'none', 40),
  };
}

function publicResponse(decision, tool, options) {
  const opts = options || {};
  const noMatch = !tool || decision.selectedToolId === 'tool-search' || Number(decision.confidence) <= 0;
  const category = noMatch ? 'search' : cleanText(decision.intentCategory || tool.subcategory || tool.category, 80);
  const toolCandidates = opts.query && Array.isArray(opts.manifest)
    ? buildToolCandidates(opts.query, decision, opts.manifest, opts.allowedCategories)
    : [];
  const toolCall = publicToolCallPayload(decision, noMatch ? null : tool);
  return {
    status: noMatch ? 'no_match' : 'success',
    selectedTool: selectedToolPayload(tool),
    toolCall,
    selectedRoute: safeRoute(tool ? decision.selectedRoute : '/search/', opts),
    category,
    confidence: Number(Number(decision.confidence || 0).toFixed(2)),
    missingInputs: Array.isArray(decision.missingInputs) ? decision.missingInputs.map(function mapInput(input) {
      return cleanText(input, 80);
    }).filter(Boolean) : [],
    suggestedDisplayText: noMatch
      ? 'Open AfroTools search and choose the closest workflow.'
      : 'Open ' + cleanText(tool.title, 120) + ' for this AfroTools workflow.',
    privacyMode: cleanText(decision.privacyMode || (tool && tool.privacyMode) || 'browser_local', 40),
    safetyDomain: cleanText(decision.safetyDomain || (tool && tool.highStakesDomain) || 'none', 40),
    toolCandidates,
    toolCatalog: {
      routerSafeToolCount: Array.isArray(opts.manifest) ? opts.manifest.length : 0,
      candidateCount: toolCandidates.length,
    },
    orchestration: buildOrchestrationSummary(decision, noMatch ? null : tool, toolCall, toolCandidates, opts),
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return corsResponse(event);
  if (event.httpMethod !== 'POST') {
    return json(event, 405, {
      status: 'error',
      error: { code: 'method_not_allowed', message: 'Use POST /api/v1/ai/route.' },
    }, { Allow: 'POST, OPTIONS' });
  }

  const auth = await validateApiKey(event);
  if (!auth.valid) {
    return json(event, auth.status || 401, {
      status: 'error',
      error: { code: auth.status === 429 ? 'rate_limited' : 'auth_failed', message: auth.error },
    }, rateLimitHeaders(auth));
  }

  const endpointKey = 'api-ai-route:' + apiKeyFingerprint(event) + ':' + clientIp(event);
  if (ROUTE_LIMIT_PER_DAY && !checkRateLimit(endpointKey, ROUTE_LIMIT_PER_DAY)) {
    return json(event, 429, {
      status: 'error',
      error: { code: 'rate_limited', message: 'AI routing API daily rate limit exceeded.' },
    }, Object.assign({}, rateLimitHeaders(auth), routeLimitHeaders(endpointKey)));
  }

  let body;
  try {
    body = parseBody(event.body);
  } catch (err) {
    return json(event, err.statusCode || 400, {
      status: 'error',
      error: { code: err.code || 'bad_request', message: err.message },
    }, rateLimitHeaders(auth));
  }

  const query = cleanText(body.query, MAX_QUERY_CHARS + 1);
  if (!query) {
    return json(event, 400, {
      status: 'error',
      error: { code: 'missing_query', message: 'query is required.' },
    }, rateLimitHeaders(auth));
  }
  if (query.length > MAX_QUERY_CHARS) {
    return json(event, 413, {
      status: 'error',
      error: { code: 'query_too_large', message: 'query exceeds the maximum routing length.' },
    }, rateLimitHeaders(auth));
  }

  try {
    validatePartnerContext(body.partnerContext);
  } catch (err) {
    return json(event, err.statusCode || 400, {
      status: 'error',
      error: { code: err.code || 'invalid_partner_context', message: err.message },
    }, rateLimitHeaders(auth));
  }

  const locale = normalizeLocale(body.locale);
  const country = cleanText(body.country, 80);
  const allowedCategories = normalizeAllowedCategories(body.allowedCategories);
  const manifest = loadManifest();
  const decision = intentRouter.routeDeterministically(query, { locale, manifest });
  const validation = intentRouter.validateRouterOutput(decision);
  const tool = validation.valid ? findTool(manifest, decision.selectedToolId) : null;

  if (!validation.valid || !categoryAllowed(decision, tool, allowedCategories)) {
    return json(event, 200, publicResponse({
      selectedToolId: 'tool-search',
      selectedRoute: '/search/',
      confidence: 0,
      intentCategory: 'search',
      missingInputs: [],
      privacyMode: 'browser_local',
      safetyDomain: 'none',
    }, null, { country, locale, query, manifest, allowedCategories }), Object.assign({}, rateLimitHeaders(auth), routeLimitHeaders(endpointKey)));
  }

  return json(event, 200, publicResponse(decision, tool, { country, locale, query, manifest, allowedCategories }), Object.assign({}, rateLimitHeaders(auth), routeLimitHeaders(endpointKey)));
};

exports.__test = {
  buildOrchestrationSummary,
  buildToolCandidates,
  safeRoute,
};
