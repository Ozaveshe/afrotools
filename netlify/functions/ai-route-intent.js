const { corsHeaders, corsResponse } = require('./utils/cors');
const { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
const { safeAnthropicText } = require('./_shared/anthropic-request');
const aiProvider = require('./_shared/ai-provider');
const crypto = require('crypto');
const intentRouter = require('../../assets/js/ai/intent-router.js');
const manifestApi = require('../../assets/js/ai/tool-manifest.js');
const guardrails = require('../../assets/js/ai/guardrails.js');
const promptRegistry = require('../../assets/js/ai/prompt-registry.js');

const MAX_BODY_BYTES = Number(process.env.AFROTOOLS_AI_ROUTER_MAX_BODY_BYTES || 8192);
const MAX_QUERY_CHARS = Number(process.env.AFROTOOLS_AI_ROUTER_MAX_QUERY_CHARS || 1200);
const IP_RATE_LIMIT_PER_DAY = Number(process.env.AFROTOOLS_AI_ROUTER_IP_RATE_LIMIT || process.env.AFROTOOLS_AI_ROUTER_RATE_LIMIT || 90);
const SESSION_RATE_LIMIT_PER_DAY = Number(process.env.AFROTOOLS_AI_ROUTER_SESSION_RATE_LIMIT || 70);
const USER_RATE_LIMIT_PER_DAY = Number(process.env.AFROTOOLS_AI_ROUTER_USER_RATE_LIMIT || 180);
const MODEL_RATE_LIMIT_PER_DAY = Number(process.env.AFROTOOLS_AI_ROUTER_MODEL_RATE_LIMIT || 24);
const PROVIDER_TIMEOUT_MS = Number(process.env.AFROTOOLS_AI_ROUTER_PROVIDER_TIMEOUT_MS || 4500);
const CLASSIFICATION_MAX_TOKENS = Number(process.env.AFROTOOLS_AI_ROUTER_CLASSIFICATION_MAX_TOKENS || 450);
const OBVIOUS_CONFIDENCE = Number(process.env.AFROTOOLS_AI_ROUTER_OBVIOUS_CONFIDENCE || 0.78);
const DECISION_CACHE_TTL_MS = Number(process.env.AFROTOOLS_AI_ROUTER_CACHE_TTL_MS || 10 * 60 * 1000);
const DECISION_CACHE_MAX = Number(process.env.AFROTOOLS_AI_ROUTER_CACHE_MAX || 500);
const INPUT_COST_PER_MILLION = Number(process.env.AFROTOOLS_AI_ROUTER_INPUT_COST_PER_MILLION || 0);
const OUTPUT_COST_PER_MILLION = Number(process.env.AFROTOOLS_AI_ROUTER_OUTPUT_COST_PER_MILLION || 0);
const SAFE_EXTRACTED_KEYS = new Set([
  'country', 'countryCode', 'city', 'targetCountry', 'destinationCountry', 'originCountry',
  'currency', 'budget', 'budgetAmount', 'studyLevel', 'field', 'gradeBand', 'gpa',
  'ieltsScore', 'intakeTimeline', 'employeeCount', 'payPeriod', 'grossPay',
  'productCategory', 'productCategoryLabel', 'itemCategory', 'itemValue', 'purchasePrice',
  'shippingCost', 'insuranceCost', 'fxRate', 'port', 'make', 'model', 'year', 'vehicleType',
  'engineCc', 'monthlyBill', 'monthlyGeneratorSpend', 'generatorSizeKva',
  'generatorHoursPerDay', 'fuelType', 'loadSizeKw', 'outageHours', 'userType',
  'amount', 'invoiceAmount', 'vatTreatment', 'pdfAction', 'targetRole',
  'careerStage', 'sector', 'skills', 'education', 'experienceLevel', 'languagePreference',
  'householdSize', 'monthlyBudget', 'monthlyIncome'
]);
const BLOCKED_EXTRACTED_KEY = /(^|[_-])(raw|prompt|query|token|secret|password|diagnostic|debug|internal|session|cookie|authorization|auth|userid|projectid|traceid|runid|conversationid|cv|resume|pdf|document|doc|content|text|email|phone|address|name|client|customer|employer|certificate|degree|credential)([_-]|$)/i;
const WEAK_CANDIDATE_TERMS = new Set([
  'africa', 'african', 'cameroon', 'compare', 'create', 'generate', 'ghana', 'kenya', 'lagos', 'nairobi',
  'nigeria', 'open', 'plan', 'planner', 'rwanda', 'south', 'tanzania', 'tool', 'uganda',
]);
const PROMPT_CATALOG_CHUNK_LIMIT = Math.max(1, Math.min(Number(process.env.AFROTOOLS_AI_ROUTER_CATALOG_CHUNK_LIMIT || 1), 3));
const PROMPT_CATALOG_TOP_TOOL_LIMIT = Math.max(8, Math.min(Number(process.env.AFROTOOLS_AI_ROUTER_CATALOG_TOP_TOOLS || 24), 48));
let generatedToolCatalogPack;
const decisionCache = new Map();
const telemetry = {
  requests: 0,
  modelCalls: 0,
  modelFailures: 0,
  aiDisabledFallbacks: 0,
  providerFailureFallbacks: 0,
  rateLimitFallbacks: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalLatencyMs: 0,
  modelLatencyMs: 0,
  estimatedCostUsd: 0,
};

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

function headerValue(event, name) {
  const headers = event.headers || {};
  const lower = String(name || '').toLowerCase();
  return headers[name] || headers[lower] || '';
}

function sanitizeKeyPart(value) {
  return String(value || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 80);
}

function decodeUserId(event) {
  const auth = String(headerValue(event, 'authorization') || '');
  if (!auth.startsWith('Bearer ')) return '';
  try {
    const token = auth.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64url').toString('utf8'));
    return sanitizeKeyPart(payload.sub || payload.user_id || '');
  } catch (err) {
    return '';
  }
}

function parseSessionId(event, body) {
  const fromHeader = headerValue(event, 'x-afrotools-ai-session') || headerValue(event, 'x-afrotools-session-id');
  const fromBody = body && (body.sessionId || body.anonymousSessionId || body.localSessionKey);
  return sanitizeKeyPart(fromHeader || fromBody || '');
}

function rateLimitKeys(event, body) {
  const ip = sanitizeKeyPart(clientIp(event)) || 'unknown';
  const sessionId = parseSessionId(event, body);
  const userId = decodeUserId(event);
  return {
    ip: 'ai-route-intent:ip:' + ip,
    session: sessionId ? 'ai-route-intent:session:' + sessionId : '',
    user: userId ? 'ai-route-intent:user:' + userId : '',
    modelIp: 'ai-route-intent:model:ip:' + ip,
    modelSession: sessionId ? 'ai-route-intent:model:session:' + sessionId : '',
    modelUser: userId ? 'ai-route-intent:model:user:' + userId : '',
  };
}

function enforceRateLimits(keys, consentToModel, modelOnly) {
  const checks = modelOnly ? [] : [
    { key: keys.ip, limit: IP_RATE_LIMIT_PER_DAY, scope: 'ip' },
  ];
  if (!modelOnly && keys.session) checks.push({ key: keys.session, limit: SESSION_RATE_LIMIT_PER_DAY, scope: 'session' });
  if (!modelOnly && keys.user) checks.push({ key: keys.user, limit: USER_RATE_LIMIT_PER_DAY, scope: 'user' });
  if (consentToModel && modelOnly) {
    checks.push({ key: keys.modelIp, limit: MODEL_RATE_LIMIT_PER_DAY, scope: 'model_ip' });
    if (keys.modelSession) checks.push({ key: keys.modelSession, limit: MODEL_RATE_LIMIT_PER_DAY, scope: 'model_session' });
    if (keys.modelUser) checks.push({ key: keys.modelUser, limit: Math.max(MODEL_RATE_LIMIT_PER_DAY * 2, MODEL_RATE_LIMIT_PER_DAY), scope: 'model_user' });
  }
  for (const check of checks) {
    if (!check.key || !check.limit || check.limit < 1) continue;
    if (!checkRateLimit(check.key, check.limit)) {
      return {
        allowed: false,
        scope: check.scope,
        limit: check.limit,
        remaining: 0,
      };
    }
  }
  return {
    allowed: true,
    limit: IP_RATE_LIMIT_PER_DAY,
    remaining: getRemaining(keys.ip, IP_RATE_LIMIT_PER_DAY),
  };
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
    locale: body.locale || body.lang || body.uiLocale || '',
    mode: String(body.mode || body.intentMode || 'classification').toLowerCase(),
    sessionId: sanitizeKeyPart(body.sessionId || body.anonymousSessionId || body.localSessionKey || ''),
  };
}

function normalizeForFingerprint(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' [url] ')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, ' [email] ')
    .replace(/\+?\d[\d\s().-]{6,}\d/g, ' [number] ')
    .replace(/[$\u00a3\u20ac\u20a6]?\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|usd|gbp|eur|ngn|kes|ghs|zar|xaf|xof|cad)?/gi, ' [amount] ')
    .replace(/\b(?:cv|resume|cover letter|pdf|document|transcript|certificate|passport|email|phone|address)\b/gi, ' [sensitive-type] ')
    .replace(/[^\w\s[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function cacheFingerprint(query, deterministic) {
  const inputs = deterministic && deterministic.extractedInputs || {};
  const country = inputs.country || inputs.destinationCountry || inputs.originCountry || inputs.targetCountry || 'none';
  const category = deterministic && (deterministic.intentCategory || deterministic.safetyDomain || deterministic.selectedToolId) || 'unknown';
  const normalized = normalizeForFingerprint(query);
  return {
    key: ['v1', category, country, hash(normalized).slice(0, 24)].join(':'),
    category,
    country,
  };
}

function isSensitiveCacheQuery(query, decision) {
  const text = String(query || '').toLowerCase();
  if (/\b(cv|resume|curriculum vitae|cover letter|pdf|document|transcript|passport|certificate|client|customer|employer|phone|email|address)\b/.test(text)) return true;
  if (String(query || '').length > 420) return true;
  const domain = decision && decision.safetyDomain;
  return domain === 'health' || domain === 'legal';
}

function sanitizeExtractedInputs(inputs) {
  const clean = {};
  Object.keys(inputs || {}).forEach((key) => {
    if (!SAFE_EXTRACTED_KEYS.has(key) || BLOCKED_EXTRACTED_KEY.test(key)) return;
    const value = inputs[key];
    if (value === undefined || value === null) return;
    if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
      return;
    }
    if (Array.isArray(value)) {
      clean[key] = value
        .filter((item) => typeof item === 'string' || typeof item === 'number')
        .map((item) => String(item).slice(0, 80))
        .slice(0, 8);
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length > 160) return;
      if (/@|https?:\/\/|\b\d{6,}\b/.test(trimmed)) return;
      clean[key] = trimmed;
    }
  });
  return clean;
}

function sanitizeDecision(decision) {
  if (!decision || typeof decision !== 'object') return decision;
  const copy = Object.assign({}, decision);
  copy.extractedInputs = sanitizeExtractedInputs(copy.extractedInputs || {});
  if (copy._meta && typeof copy._meta === 'object') {
    copy._meta = Object.assign({}, copy._meta);
    delete copy._meta.rawPrompt;
    delete copy._meta.prompt;
    delete copy._meta.query;
    delete copy._meta.providerRaw;
  }
  return copy;
}

function cacheableDecision(decision) {
  const clean = sanitizeDecision(decision);
  return Object.assign({}, clean, {
    extractedInputs: {},
    _meta: Object.assign({}, clean && clean._meta || {}, {
      cachedStructureOnly: true,
    }),
  });
}

function getCachedDecision(cacheKey) {
  if (!cacheKey) return null;
  const entry = decisionCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > DECISION_CACHE_TTL_MS) {
    decisionCache.delete(cacheKey);
    return null;
  }
  telemetry.cacheHits += 1;
  return JSON.parse(JSON.stringify(entry.decision));
}

function putCachedDecision(cacheKey, decision) {
  if (!cacheKey || !decision) return;
  if (decisionCache.size >= DECISION_CACHE_MAX) {
    const firstKey = decisionCache.keys().next().value;
    if (firstKey) decisionCache.delete(firstKey);
  }
  decisionCache.set(cacheKey, {
    createdAt: Date.now(),
    decision: cacheableDecision(decision),
  });
}

function isObviousDecision(decision) {
  return Boolean(
    decision &&
    decision.selectedToolId &&
    decision.selectedToolId !== 'tool-search' &&
    Number(decision.confidence || 0) >= OBVIOUS_CONFIDENCE &&
    decision._meta &&
    decision._meta.router !== 'guardrail'
  );
}

function estimateCost(usage) {
  if (!usage) return null;
  const inputTokens = Number(usage.input_tokens || usage.inputTokens || 0);
  const outputTokens = Number(usage.output_tokens || usage.outputTokens || 0);
  if (!inputTokens && !outputTokens) return null;
  if (!INPUT_COST_PER_MILLION && !OUTPUT_COST_PER_MILLION) return null;
  return Math.round(((inputTokens / 1000000) * INPUT_COST_PER_MILLION + (outputTokens / 1000000) * OUTPUT_COST_PER_MILLION) * 1000000) / 1000000;
}

function recordAiFallback(reason, meta) {
  const cleanReason = String(reason || 'unknown').replace(/[^a-z0-9_-]/gi, '_').slice(0, 80) || 'unknown';
  if (cleanReason === 'provider_disabled' || cleanReason === 'provider_key_not_configured' || cleanReason === 'provider_unsupported') {
    telemetry.aiDisabledFallbacks += 1;
  } else if (cleanReason === 'model_rate_limited') {
    telemetry.rateLimitFallbacks += 1;
  } else if (cleanReason.indexOf('provider_') === 0 || cleanReason.indexOf('model_') === 0) {
    telemetry.providerFailureFallbacks += 1;
  }
  if (process.env.AFROTOOLS_AI_FALLBACK_LOGGING !== 'off') {
    const details = meta || {};
    const parts = ['[ai-route-intent]', 'fallback=' + cleanReason];
    if (details.source) parts.push('source=' + String(details.source).slice(0, 40));
    if (details.toolId) parts.push('tool=' + String(details.toolId).replace(/[^a-z0-9_-]/gi, '').slice(0, 80));
    if (details.cacheHit !== undefined) parts.push('cacheHit=' + Boolean(details.cacheHit));
    console.warn(parts.join(' '));
  }
}

function telemetrySnapshot(extra) {
  const requests = telemetry.requests || 1;
  const cacheLookups = telemetry.cacheHits + telemetry.cacheMisses;
  const providerInfo = aiProvider.getProviderInfo({ purpose: 'routing', method: 'classifyIntent' });
  return Object.assign({
    modelMode: 'classification',
    modelProvider: providerInfo.provider,
    modelName: providerInfo.enabled ? providerInfo.model : '',
    modelCalls: telemetry.modelCalls,
    modelFailures: telemetry.modelFailures,
    aiDisabledFallbacks: telemetry.aiDisabledFallbacks,
    providerFailureFallbacks: telemetry.providerFailureFallbacks,
    rateLimitFallbacks: telemetry.rateLimitFallbacks,
    averageLatencyMs: Math.round(telemetry.totalLatencyMs / requests),
    averageModelLatencyMs: telemetry.modelCalls ? Math.round(telemetry.modelLatencyMs / telemetry.modelCalls) : 0,
    cacheHitRate: cacheLookups ? Math.round((telemetry.cacheHits / cacheLookups) * 1000) / 1000 : 0,
    estimatedCostUsd: Math.round(telemetry.estimatedCostUsd * 1000000) / 1000000,
  }, extra || {});
}

function tokenizeForToolSelection(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length > 2)
    .slice(0, 80);
}

function toolSelectionHaystack(tool) {
  return [
    tool && tool.id,
    tool && tool.slug,
    tool && tool.title,
    tool && tool.shortDescription,
    tool && tool.category,
    tool && tool.subcategory,
    ...(tool && tool.userIntents || []),
    ...(tool && tool.exampleQueries || []),
  ].join(' ').toLowerCase();
}

function selectPromptTools(query, manifest, deterministic, limit) {
  const tools = Array.isArray(manifest) ? manifest : [];
  const maxTools = Math.max(20, Math.min(Number(limit || 90), 120));
  const deterministicId = deterministic && deterministic.selectedToolId;

  if (typeof manifestApi.rankToolCandidates === 'function') {
    const ranked = manifestApi.rankToolCandidates(query, tools, {
      limit: maxTools,
      minScore: 6,
      selectedToolId: deterministicId,
    });
    if (ranked && ranked.candidates && ranked.candidates.length >= Math.min(maxTools, 12)) {
      return ranked.candidates.map((candidate) => candidate.tool);
    }
  }

  const tokens = tokenizeForToolSelection(query);
  const selected = new Map();

  tools.forEach((tool) => {
    if (!tool || !tool.id) return;
    let score = tool.id === deterministicId ? 1000 : 0;
    const haystack = toolSelectionHaystack(tool);
    tokens.forEach((token) => {
      if (haystack.indexOf(token) !== -1) score += token.length > 4 ? 3 : 2;
    });
    if (deterministic && deterministic.intentCategory) {
      const category = String(deterministic.intentCategory).toLowerCase();
      if (String(tool.category || '').toLowerCase().indexOf(category) !== -1) score += 5;
      if (String(tool.subcategory || '').toLowerCase().indexOf(category) !== -1) score += 8;
    }
    if ((tool.aiCapabilities || []).indexOf('prefill') !== -1) score += 1;
    if (score > 0) selected.set(tool.id, { score, tool });
  });

  if (selected.size < Math.min(maxTools, 25)) {
    tools.slice(0, maxTools).forEach((tool, index) => {
      if (tool && tool.id && !selected.has(tool.id)) selected.set(tool.id, { score: 1 - index / 10000, tool });
    });
  }

  return Array.from(selected.values())
    .sort((left, right) => (right.score - left.score) || String(left.tool.id).localeCompare(String(right.tool.id)))
    .slice(0, maxTools)
    .map((item) => item.tool);
}

function loadGeneratedToolCatalogPack() {
  if (generatedToolCatalogPack !== undefined) return generatedToolCatalogPack;
  try {
    generatedToolCatalogPack = require('../../data/ai/tool-catalog-pack.json');
  } catch (err) {
    generatedToolCatalogPack = null;
  }
  return generatedToolCatalogPack;
}

function compactToolFromCatalogEntry(tool) {
  if (tool && tool.toolCall && tool.toolCall.type === 'existing_tool_call') {
    return {
      toolId: tool.toolCall.toolId || tool.id,
      route: tool.toolCall.route || tool.route,
      title: tool.title,
      category: tool.toolCall.category || tool.category,
      subcategory: tool.toolCall.subcategory || tool.subcategory,
      action: tool.toolCall.action,
      inputSchema: {
        required: (tool.requiredInputs || []).map((input) => input && input.name).filter(Boolean),
        optional: (tool.optionalInputs || []).map((input) => input && input.name).filter(Boolean).slice(0, 8),
      },
      privacyMode: tool.toolCall.privacyMode || tool.privacyMode,
      sourcePolicy: tool.toolCall.sourcePolicy || tool.sourcePolicy,
      safetyDomain: tool.toolCall.safetyDomain || tool.safetyDomain,
      capabilities: tool.toolCall.canPrefill ? ['prefill'] : ['route_only'],
      hints: (tool.hints || []).slice(0, 8),
    };
  }
  return compactToolForPrompt(tool);
}

function buildPromptCatalogContext(query, manifest, deterministic) {
  const tools = Array.isArray(manifest) ? manifest : [];
  const rankedTools = selectPromptTools(query, tools, deterministic, PROMPT_CATALOG_TOP_TOOL_LIMIT);
  const context = {
    schema: 'afrotools_router_catalog_context_v1',
    source: 'manifest_ranked_fallback',
    manifestCount: tools.length,
    catalogToolCount: tools.length,
    manifestHash: '',
    selectedChunkIds: [],
    selectedChunkCount: 0,
    selectedToolCount: rankedTools.length,
    selectedTools: rankedTools.map(compactToolForPrompt),
    selectedChunks: [],
  };

  const pack = loadGeneratedToolCatalogPack();
  if (!pack || !pack.gate || pack.gate.passed !== true || Number(pack.toolCount) !== tools.length || !Array.isArray(pack.chunks)) {
    return context;
  }

  const rankedIds = rankedTools.map((tool) => tool && tool.id).filter(Boolean);
  const selectedId = deterministic && deterministic.selectedToolId;
  if (selectedId && rankedIds.indexOf(selectedId) === -1) rankedIds.unshift(selectedId);
  const rankWeight = new Map();
  rankedIds.forEach((id, index) => {
    rankWeight.set(id, Math.max(1, PROMPT_CATALOG_TOP_TOOL_LIMIT - index));
  });

  const chunkScores = pack.chunks.map((chunk) => {
    const ids = Array.isArray(chunk.toolIds) ? chunk.toolIds : [];
    const score = ids.reduce((total, id) => total + (rankWeight.get(id) || 0), 0);
    const selectedHit = selectedId && ids.indexOf(selectedId) !== -1 ? 1000 : 0;
    return { chunk, score: score + selectedHit };
  }).filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || String(left.chunk.id).localeCompare(String(right.chunk.id)))
    .slice(0, PROMPT_CATALOG_CHUNK_LIMIT);

  const selectedChunks = chunkScores.map((item) => ({
    id: item.chunk.id,
    category: item.chunk.category,
    toolCount: item.chunk.toolCount,
    toolIds: (item.chunk.toolIds || []).slice(),
    tools: (item.chunk.tools || []).map(compactToolFromCatalogEntry),
  }));
  const chunkTools = selectedChunks.flatMap((chunk) => chunk.tools || []);
  const topTools = rankedTools.map(compactToolForPrompt);
  const seen = new Set();
  const selectedTools = topTools.concat(chunkTools).filter((tool) => {
    if (!tool || !tool.toolId || seen.has(tool.toolId)) return false;
    seen.add(tool.toolId);
    return true;
  });

  return {
    schema: 'afrotools_router_catalog_context_v1',
    source: 'generated_full_catalog_pack',
    manifestCount: tools.length,
    catalogToolCount: pack.toolCount,
    manifestHash: pack.manifestHash,
    selectedChunkIds: selectedChunks.map((chunk) => chunk.id),
    selectedChunkCount: selectedChunks.length,
    selectedToolCount: selectedTools.length,
    selectedTools,
    selectedChunks,
  };
}

function buildToolCall(decision, manifest) {
  const tools = Array.isArray(manifest) ? manifest : [];
  const selectedToolId = decision && decision.selectedToolId;
  const tool = tools.find((entry) => entry && (entry.id === selectedToolId || entry.slug === selectedToolId || (entry.aliases || []).indexOf(selectedToolId) !== -1));
  const fallbackTool = tool || {
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
  return manifestApi.buildToolInvocation(fallbackTool, {
    providedInputNames: Object.keys(decision && decision.extractedInputs || {}),
    missingInputNames: decision && decision.missingInputs || [],
  });
}

function buildToolCandidates(query, decision, manifest, limit) {
  const tools = manifestApi.getToolManifestForRouter(manifest);
  if (typeof manifestApi.rankToolCandidates !== 'function') return [];
  const outputLimit = Math.max(0, Math.min(Number(limit || 5), 6));
  const ranked = manifestApi.rankToolCandidates(query, tools, {
    limit: Math.max(1, Math.min(outputLimit + 2, 8)),
    minScore: 8,
    selectedToolId: decision && decision.selectedToolId,
  });
  const selectedToolId = decision && decision.selectedToolId;
  return (ranked.candidates || []).filter((candidate) => {
    if (!candidate || !candidate.tool || !candidate.tool.id || candidate.tool.id === selectedToolId) return false;
    const strongTerms = (candidate.matchedTerms || []).filter((term) => !WEAK_CANDIDATE_TERMS.has(String(term || '').toLowerCase()));
    return strongTerms.length > 0;
  }).slice(0, outputLimit).map((candidate) => {
    const call = manifestApi.buildToolInvocation(candidate.tool);
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

function compactToolForPrompt(tool) {
  const invocation = manifestApi.buildToolInvocation(tool);
  return {
    toolId: invocation.toolId,
    route: invocation.route,
    title: invocation.title,
    category: invocation.category,
    subcategory: invocation.subcategory,
    action: invocation.action,
    inputSchema: invocation.inputSchema,
    privacyMode: invocation.privacyMode,
    sourcePolicy: invocation.sourcePolicy,
    safetyDomain: invocation.safetyDomain,
    capabilities: invocation.capabilities,
  };
}

function routerPromptMeta() {
  const prompt = promptRegistry.getProductionPrompt('router.classify-intent');
  return {
    promptId: prompt && prompt.promptId || 'router.classify-intent',
    promptVersion: prompt && prompt.version || 'unknown',
    evalDataset: prompt && prompt.evalDataset || '',
    minEvalPassRate: prompt && prompt.minEvalPassRate || 0,
  };
}

function buildModelPrompt(query, manifest, deterministic) {
  const catalogContext = buildPromptCatalogContext(query, manifest, deterministic);
  return promptRegistry.buildRouterClassifierPrompt({
    toolCatalogCount: catalogContext.selectedToolCount,
    manifestCount: manifest.length,
    toolCatalogJson: JSON.stringify(catalogContext),
    userQuery: safeAnthropicText(query, 'Ask AfroTools AI router query', 2000),
  });
}

function providerAvailableForRouting() {
  return aiProvider.getProviderInfo({ purpose: 'routing', method: 'classifyIntent' }).enabled;
}

function routingProviderFallbackReason() {
  return aiProvider.getProviderInfo({ purpose: 'routing', method: 'classifyIntent' }).reason || 'provider_key_not_configured';
}

async function callModelRouter(query, manifest, deterministic) {
  const provider = aiProvider.createModelProvider({
    purpose: 'routing',
    method: 'classifyIntent',
    timeoutMs: PROVIDER_TIMEOUT_MS,
    maxTokens: CLASSIFICATION_MAX_TOKENS,
  });
  const result = await provider.classifyIntent({
    query,
    prompt: buildModelPrompt(query, manifest, deterministic),
    maxTokens: CLASSIFICATION_MAX_TOKENS,
  });
  return {
    decision: result.ok ? result.data : null,
    errorReason: result.errorReason || '',
    latencyMs: result.latencyMs || 0,
    usage: result.usage || null,
    prompt: routerPromptMeta(),
  };
}

function routerStatusForFallback(fallbackReason) {
  const reason = String(fallbackReason || '');
  if (!reason || reason === 'model_consent_not_provided' || reason === 'model_skipped_obvious_intent') return 'ok';
  return 'degraded';
}

function responsePayload(query, decision, source, fallbackReason, locale, requestTelemetry, manifest) {
  const routerManifest = manifestApi.getToolManifestForRouter(manifest);
  const fallbackUsed = Boolean(fallbackReason);
  const routerStatus = routerStatusForFallback(fallbackReason);
  return {
    ok: true,
    routerStatus,
    routerUnavailable: false,
    fallbackUsed,
    source,
    schema: intentRouter.OUTPUT_SCHEMA,
    queryLength: query.length,
    locale: decision.locale || locale || 'en',
    fallbackReason: fallbackReason || '',
    decision,
    toolCall: buildToolCall(decision, routerManifest),
    toolCandidates: buildToolCandidates(query, decision, routerManifest, 5),
    telemetry: telemetrySnapshot(requestTelemetry),
  };
}

function safeQueryFromEvent(event) {
  try {
    const raw = event && event.body || '';
    const parsed = raw ? JSON.parse(event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw) : {};
    return String(parsed.query || parsed.q || '').trim().slice(0, MAX_QUERY_CHARS);
  } catch (err) {
    return '';
  }
}

function emergencyRouterFallback(event, err) {
  const startedAt = Date.now();
  const headers = corsHeaders(event || {}, {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  });
  const query = safeQueryFromEvent(event);
  const fallbackReason = 'router_runtime_fallback';
  let decision;
  try {
    const manifest = manifestApi.getToolManifestForRouter();
    decision = sanitizeDecision(intentRouter.routeDeterministically(query, { manifest, locale: 'en' }));
  } catch (fallbackErr) {
    decision = sanitizeDecision(intentRouter.fallbackDecision(query, { locale: 'en' }));
  }
  recordAiFallback(fallbackReason, {
    source: 'safe_runtime_fallback',
    toolId: decision && decision.selectedToolId,
    cacheHit: false,
  });
  telemetry.modelFailures += 1;
  const elapsed = Date.now() - startedAt;
  telemetry.totalLatencyMs += elapsed;
  headers['X-AI-Fallback'] = fallbackReason;
  headers['X-AI-Runtime-Fallback'] = 'true';
  headers['X-AI-Router-Status'] = 'degraded';
  return json(200, headers, responsePayload(query, decision, 'safe_runtime_fallback', fallbackReason, 'en', {
    modelMode: 'classification',
    modelCalled: false,
    providerUsed: false,
    providerLatencyMs: 0,
    providerFailureReason: fallbackReason,
    cacheHit: false,
    totalLatencyMs: elapsed,
    runtimeErrorName: err && err.name || 'Error',
  }, manifestApi.getToolManifestForRouter()));
}

async function routeIntent(event) {
  const requestStartedAt = Date.now();
  telemetry.requests += 1;
  const headers = corsHeaders(event, {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  });

  if (event.httpMethod === 'OPTIONS') return corsResponse(event);
  if (event.httpMethod !== 'POST') {
    return json(405, headers, { ok: false, error: 'Method not allowed. Use POST.' });
  }

  let body;
  try {
    body = parseBody(event);
  } catch (err) {
    telemetry.totalLatencyMs += Date.now() - requestStartedAt;
    return json(err.statusCode || 400, headers, {
      ok: false,
      error: err.message,
      decision: intentRouter.fallbackDecision(''),
      telemetry: telemetrySnapshot({
        totalLatencyMs: Date.now() - requestStartedAt,
        modelCalled: false,
        cacheHit: false,
      }),
    });
  }

  const query = body.query;
  const consentToModel = body.consentToModel;
  const locale = body.locale;
  const mode = body.mode === 'generation' || body.mode === 'explanation' ? 'classification' : 'classification';
  const keys = rateLimitKeys(event, body);
  const rate = enforceRateLimits(keys, consentToModel, false);
  if (!rate.allowed) {
    telemetry.totalLatencyMs += Date.now() - requestStartedAt;
    headers['X-RateLimit-Limit'] = String(rate.limit);
    headers['X-RateLimit-Remaining'] = '0';
    headers['X-AI-RateLimit-Scope'] = rate.scope || 'ip';
    return json(429, headers, {
      ok: false,
      error: 'Rate limit exceeded.',
      scope: rate.scope || 'ip',
      remaining: 0,
      limit: rate.limit,
      decision: intentRouter.fallbackDecision(query, { locale }),
      telemetry: telemetrySnapshot({
        totalLatencyMs: Date.now() - requestStartedAt,
        modelCalled: false,
        cacheHit: false,
        rateLimited: true,
      }),
    });
  }

  const manifest = manifestApi.getToolManifestForRouter();
  const deterministic = sanitizeDecision(intentRouter.routeDeterministically(query, { manifest, locale }));
  const fingerprint = cacheFingerprint(query, deterministic);
  const promptMeta = routerPromptMeta();
  let decision = deterministic;
  const providerAvailable = providerAvailableForRouting();
  let source = providerAvailable ? 'deterministic_model_consent_required' : 'deterministic';
  let fallbackReason = providerAvailable ? 'model_consent_not_provided' : routingProviderFallbackReason();
  let requestTelemetry = {
    modelMode: mode,
    modelCalled: false,
    providerUsed: false,
    providerLatencyMs: 0,
    providerFailureReason: '',
    cacheHit: false,
    cacheKey: fingerprint.key.split(':').slice(0, 3).join(':') + ':' + fingerprint.key.split(':').pop(),
    cacheCategory: fingerprint.category,
    cacheCountry: fingerprint.country,
    totalLatencyMs: 0,
    estimatedCostUsd: null,
    promptId: promptMeta.promptId,
    promptVersion: promptMeta.promptVersion,
    promptEvalDataset: promptMeta.evalDataset,
    promptMinEvalPassRate: promptMeta.minEvalPassRate,
  };

  if (!providerAvailable) {
    recordAiFallback(fallbackReason, {
      source,
      toolId: deterministic && deterministic.selectedToolId,
      cacheHit: false,
    });
    requestTelemetry.providerFailureReason = fallbackReason;
  }

  if (isObviousDecision(deterministic)) {
    source = 'deterministic_obvious';
    fallbackReason = providerAvailable && consentToModel ? 'model_skipped_obvious_intent' : fallbackReason;
  } else if (providerAvailable && consentToModel) {
    source = 'deterministic_with_provider_fallback';
    fallbackReason = 'provider_not_used_or_unavailable';
    if (!isSensitiveCacheQuery(query, deterministic)) {
      const cached = getCachedDecision(fingerprint.key);
      if (cached) {
        const cachedWithCurrentInputs = Object.assign({}, cached, {
          extractedInputs: deterministic.extractedInputs || {},
          missingInputs: cached.missingInputs && cached.missingInputs.length ? cached.missingInputs : deterministic.missingInputs,
          _meta: Object.assign({}, cached._meta || {}, { router: 'cache', providerUsed: false }),
        });
        decision = sanitizeDecision(intentRouter.normalizeDecision(cachedWithCurrentInputs, query, { manifest, locale }));
        source = 'cache_validated';
        fallbackReason = '';
        requestTelemetry.cacheHit = true;
      } else {
        telemetry.cacheMisses += 1;
      }
    }

    if (!requestTelemetry.cacheHit) {
      const modelRate = enforceRateLimits(keys, consentToModel, true);
      if (!modelRate.allowed) {
        source = 'deterministic_model_rate_limited';
        fallbackReason = 'model_rate_limited';
        requestTelemetry.providerFailureReason = fallbackReason;
        requestTelemetry.rateLimited = true;
        recordAiFallback(fallbackReason, {
          source,
          toolId: deterministic && deterministic.selectedToolId,
          cacheHit: false,
        });
        telemetry.totalLatencyMs += Date.now() - requestStartedAt;
        requestTelemetry.totalLatencyMs = Date.now() - requestStartedAt;
        headers['X-RateLimit-Limit'] = String(modelRate.limit);
        headers['X-RateLimit-Remaining'] = '0';
        headers['X-AI-RateLimit-Scope'] = modelRate.scope || 'model_ip';
        headers['X-AI-Fallback'] = fallbackReason;
        headers['X-AI-Router-Status'] = 'degraded';
        return json(200, headers, responsePayload(query, deterministic, source, fallbackReason, locale, requestTelemetry, manifest));
      }
      telemetry.modelCalls += 1;
      requestTelemetry.modelCalled = true;
      const providerResult = await callModelRouter(query, manifest, deterministic);
      if (providerResult.prompt) {
        requestTelemetry.promptId = providerResult.prompt.promptId;
        requestTelemetry.promptVersion = providerResult.prompt.promptVersion;
        requestTelemetry.promptEvalDataset = providerResult.prompt.evalDataset;
        requestTelemetry.promptMinEvalPassRate = providerResult.prompt.minEvalPassRate;
      }
      requestTelemetry.providerLatencyMs = providerResult.latencyMs || 0;
      requestTelemetry.providerFailureReason = providerResult.errorReason || '';
      telemetry.modelLatencyMs += providerResult.latencyMs || 0;
      const estimated = estimateCost(providerResult.usage);
      if (estimated !== null) {
        requestTelemetry.estimatedCostUsd = estimated;
        telemetry.estimatedCostUsd += estimated;
      }
      if (providerResult.errorReason) {
        telemetry.modelFailures += 1;
        recordAiFallback(providerResult.errorReason, {
          source,
          toolId: deterministic && deterministic.selectedToolId,
          cacheHit: false,
        });
      }

      const modelDecision = providerResult.decision;
      if (modelDecision) {
      const normalized = intentRouter.normalizeDecision(
        Object.assign({}, modelDecision, { extractedInputs: sanitizeExtractedInputs(modelDecision.extractedInputs || {}), _meta: { router: 'model', providerUsed: true } }),
        query,
        { manifest, locale }
      );
      const sanitized = sanitizeDecision(normalized);
      const validation = intentRouter.validateRouterOutput(sanitized);
      const safetyValidation = guardrails.validateRouterDecisionSafety(sanitized, manifest);
      if (validation.valid && safetyValidation.valid) {
        decision = sanitized;
        source = 'model_validated';
        fallbackReason = '';
        requestTelemetry.providerUsed = true;
        if (!isSensitiveCacheQuery(query, decision)) putCachedDecision(fingerprint.key, decision);
      } else {
        console.warn('[ai-route-intent] model_validation_failed fields=' + validation.errors.concat(safetyValidation.errors).join('|'));
        fallbackReason = validation.valid ? 'model_safety_validation_failed' : 'model_validation_failed';
      }
      } else {
        fallbackReason = providerResult.errorReason || fallbackReason;
      }
    }
  }

  decision = sanitizeDecision(decision);
  const validation = intentRouter.validateRouterOutput(decision);
  const safetyValidation = guardrails.validateRouterDecisionSafety(decision, manifest);
  if (!validation.valid || !safetyValidation.valid) {
    console.warn('[ai-route-intent] deterministic_validation_failed fields=' + validation.errors.concat(safetyValidation.errors).join('|'));
    decision = sanitizeDecision(intentRouter.fallbackDecision(query, { locale }));
    source = 'safe_fallback';
    fallbackReason = 'router_validation_failed';
  }

  requestTelemetry.totalLatencyMs = Date.now() - requestStartedAt;
  telemetry.totalLatencyMs += requestTelemetry.totalLatencyMs;
  headers['X-RateLimit-Limit'] = String(rate.limit || IP_RATE_LIMIT_PER_DAY);
  headers['X-RateLimit-Remaining'] = String(getRemaining(keys.ip, IP_RATE_LIMIT_PER_DAY));
  headers['X-AI-Cache'] = requestTelemetry.cacheHit ? 'hit' : 'miss';
  headers['X-AI-Model-Mode'] = 'classification';
  if (fallbackReason) headers['X-AI-Fallback'] = fallbackReason;
  headers['X-AI-Router-Status'] = routerStatusForFallback(fallbackReason);
  if (requestTelemetry.providerLatencyMs) headers['X-AI-Provider-Latency-Ms'] = String(requestTelemetry.providerLatencyMs);

  return json(200, headers, responsePayload(query, decision, source, fallbackReason, locale, requestTelemetry, manifest));
}

exports.handler = async function handler(event) {
  try {
    return await routeIntent(event);
  } catch (err) {
    console.warn('[ai-route-intent] runtime_fallback name=' + (err && err.name || 'Error'));
    return emergencyRouterFallback(event, err);
  }
};

exports.__getTelemetry = function getTelemetryForTests() {
  return telemetrySnapshot({ cacheSize: decisionCache.size });
};

exports.__getDecisionCacheSnapshot = function getDecisionCacheSnapshotForTests() {
  return Array.from(decisionCache.entries()).map(([key, value]) => ({
    key,
    value: JSON.parse(JSON.stringify(value)),
  }));
};

exports.__resetForTests = function resetForTests() {
  decisionCache.clear();
  Object.keys(telemetry).forEach((key) => {
    telemetry[key] = 0;
  });
};

exports.__test = {
  buildPromptCatalogContext,
  buildModelPrompt,
  buildToolCall,
  buildToolCandidates,
  routerPromptMeta,
  selectPromptTools,
};
