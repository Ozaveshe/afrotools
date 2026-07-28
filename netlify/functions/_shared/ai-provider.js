const { safeAnthropicText } = require('./anthropic-request');
const guardrails = require('../../../assets/js/ai/guardrails.js');
const workflowSchemas = require('../../../assets/js/ai/workflow-schemas.js');

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 1;
const DEFAULT_MAX_TOKENS = 700;
const PROVIDER_METHODS = [
  'classifyIntent',
  'generateWorkflowBrief',
  'generateDocumentDraft',
  'improveCVText',
  'explainResult',
];
// Models that accept adaptive thinking and the effort parameter (Opus 4.6+,
// Sonnet 4.6/5, Fable 5). Haiku and older models must not receive these fields.
const ADAPTIVE_THINKING_MODELS = /opus-4-[678]|sonnet-4-6|sonnet-5|fable-5/;
const EFFORT_LEVELS = /^(low|medium|high|xhigh|max)$/;

function text(value) {
  return value === null || value === undefined ? '' : String(value);
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defined(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function methodTokenEnv(method) {
  return 'AFROTOOLS_AI_' + String(method || '').replace(/[A-Z]/g, function (letter) {
    return '_' + letter;
  }).toUpperCase() + '_MAX_TOKENS';
}

function providerNameFromEnv(env) {
  return text(env.AFROTOOLS_AI_PROVIDER || env.AFROTOOLS_MODEL_PROVIDER || env.AFROTOOLS_AI_ROUTER_PROVIDER || 'anthropic').toLowerCase();
}

function providerDisabledByEnv(env) {
  return /^(disabled|fallback|none|off|false)$/i.test(providerNameFromEnv(env));
}

function getAnthropicKey(env, purpose) {
  if (purpose === 'routing') return env.AFROTOOLS_AI_ROUTER_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY || '';
  return env.AFROTOOLS_AI_ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY || '';
}

function getOpenAIKey(env, purpose) {
  if (purpose === 'routing') return env.AFROTOOLS_AI_ROUTER_OPENAI_API_KEY || env.OPENAI_API_KEY || '';
  return env.AFROTOOLS_AI_OPENAI_API_KEY || env.OPENAI_API_KEY || '';
}

/*
 * OpenAI models are configured, never guessed from the Anthropic model name.
 * A wrong model id is a 400, which would make the failover fail exactly when it
 * is needed, so the defaults are deliberately long-lived ids rather than the
 * newest thing.
 */
function getOpenAIModelForMethod(env, method, purpose) {
  if (purpose === 'routing' || method === 'classifyIntent') {
    return env.AFROTOOLS_AI_OPENAI_ROUTER_MODEL || env.AFROTOOLS_AI_OPENAI_MODEL || 'gpt-4o-mini';
  }
  return env.AFROTOOLS_AI_OPENAI_GENERATION_MODEL || env.AFROTOOLS_AI_OPENAI_MODEL || 'gpt-4o';
}

/*
 * Which failures are worth a second provider.
 *
 * Only infrastructure problems: the far end is down, slow, rate-limiting us, or
 * refusing the key (which is what a lapsed card looks like). A malformed or
 * schema-invalid answer is NOT here — the request itself is the problem, so
 * asking a second model would just spend twice to fail twice.
 */
const FAILOVER_REASONS = /^(provider_error_(5\d\d|429|401|403)|provider_timeout|provider_unavailable|fetch_unavailable)$/;

function shouldFailover(result) {
  // The envelope field is `errorReason`; reading `.reason` silently matched
  // nothing and would have left the failover permanently dead.
  return Boolean(result && !result.ok && FAILOVER_REASONS.test(text(result.errorReason)));
}

function supportsAdaptiveThinking(model) {
  return ADAPTIVE_THINKING_MODELS.test(text(model));
}

function getSmartGenerationModel(env) {
  return text((env || process.env).AFROTOOLS_AI_SMART_MODEL || 'claude-opus-4-8');
}

function getModelForMethod(env, method, purpose) {
  const upperMethod = String(method || '').replace(/[A-Z]/g, function (letter) {
    return '_' + letter;
  }).toUpperCase();
  if (purpose === 'routing' || method === 'classifyIntent') {
    return env.AFROTOOLS_AI_ROUTER_CLASSIFICATION_MODEL ||
      env.AFROTOOLS_AI_ROUTER_MODEL ||
      env.AFROTOOLS_AI_CLASSIFY_INTENT_MODEL ||
      env.AFROTOOLS_AI_MODEL ||
      'claude-haiku-4-5-20251001';
  }
  return env['AFROTOOLS_AI_' + upperMethod + '_MODEL'] ||
    env.AFROTOOLS_AI_GENERATION_MODEL ||
    env.AFROTOOLS_AI_MODEL ||
    'claude-haiku-4-5-20251001';
}

function getProviderInfo(options) {
  const opts = options || {};
  const env = opts.env || process.env;
  const provider = providerNameFromEnv(env);
  const purpose = opts.purpose || '';
  const key = provider === 'anthropic' ? getAnthropicKey(env, purpose) : '';
  const disabled = providerDisabledByEnv(env);
  const openaiKey = disabled ? '' : getOpenAIKey(env, purpose);
  return {
    provider,
    purpose,
    enabled: !disabled && provider === 'anthropic' && Boolean(key),
    disabled,
    configured: Boolean(key),
    // Whether a backup exists. `enabled` still describes Anthropic only, so
    // existing callers reading it keep their current meaning.
    openaiConfigured: Boolean(openaiKey),
    failoverAvailable: Boolean(openaiKey),
    model: getModelForMethod(env, opts.method || 'classifyIntent', purpose),
    reason: disabled ? 'provider_disabled' : provider !== 'anthropic' ? 'provider_unsupported' : key ? '' : 'provider_key_not_configured',
  };
}

function sanitizeMessages(messages, limit) {
  const budget = number(limit, 120000);
  return (Array.isArray(messages) ? messages : []).slice(-10).map(function (message) {
    const role = message && message.role === 'assistant' ? 'assistant' : 'user';
    return {
      role,
      content: safeAnthropicText(text(message && message.content), 'AI provider message', budget),
    };
  }).filter(function (message) {
    return message.content.trim();
  });
}

function jsonTextFromMarkdown(value) {
  return text(value).trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function safeLog(method, reason, meta) {
  const details = meta || {};
  const parts = [
    '[ai-provider]',
    'method=' + method,
    'reason=' + reason,
  ];
  if (details.provider) parts.push('provider=' + details.provider);
  if (details.status) parts.push('status=' + details.status);
  if (details.latencyMs !== undefined) parts.push('latencyMs=' + details.latencyMs);
  if (details.attempt !== undefined) parts.push('attempt=' + details.attempt);
  if (details.name) parts.push('name=' + details.name);
  console.warn(parts.join(' '));
}

/* Config fields that must never ride along in a result envelope. `extra` is
 * usually the provider config, and Object.assign was copying the live API key
 * into every failure object. Nothing serialises that envelope to a client
 * today, but it is one `JSON.stringify(result)` in a log or an error report
 * away from publishing the key. */
const NEVER_IN_ENVELOPE = ['apiKey', 'fetch'];

function failure(method, reason, extra) {
  const envelope = Object.assign({
    ok: false,
    method,
    provider: extra && extra.provider || '',
    model: extra && extra.model || '',
    data: null,
    text: '',
    usage: null,
    latencyMs: extra && extra.latencyMs || 0,
    errorReason: reason,
    validationErrors: extra && extra.validationErrors || [],
  }, extra || {});
  NEVER_IN_ENVELOPE.forEach(function (key) { delete envelope[key]; });
  // Object.assign(extra) can overwrite errorReason when a config carries one.
  envelope.errorReason = reason;
  return envelope;
}

function success(method, payload) {
  return Object.assign({
    ok: true,
    method,
    errorReason: '',
    validationErrors: [],
  }, payload || {});
}

function validateMessagesRequest(method, request) {
  const errors = [];
  const req = request || {};
  if (!req.system && method !== 'classifyIntent') errors.push('system is required');
  if (!req.prompt && !Array.isArray(req.messages)) errors.push('prompt or messages is required');
  if (req.prompt && text(req.prompt).length > 180000) errors.push('prompt is too large');
  if (req.system && text(req.system).length > 180000) errors.push('system is too large');
  if (Array.isArray(req.messages) && req.messages.length > 20) errors.push('too many messages');
  return errors;
}

function validateRequest(method, request) {
  const req = request || {};
  const errors = [];
  if (PROVIDER_METHODS.indexOf(method) === -1) errors.push('unsupported provider method');
  if (method === 'classifyIntent') {
    if (!text(req.query).trim()) errors.push('query is required');
    if (!text(req.prompt).trim()) errors.push('prompt is required');
    if (text(req.query).length > 4000) errors.push('query is too large');
    if (text(req.prompt).length > 220000) errors.push('prompt is too large');
  } else {
    errors.push.apply(errors, validateMessagesRequest(method, req));
  }
  return errors;
}

function buildAnthropicPayload(config, method, request) {
  const req = request || {};
  const maxTokens = clamp(number(req.maxTokens, config.maxTokens || DEFAULT_MAX_TOKENS), 1, 4096);
  const system = method === 'classifyIntent'
    ? text(req.system || 'Return strict JSON for AfroTools routing only. Do not repeat sensitive user content beyond extracted workflow fields.')
    : text(req.system);
  const messages = Array.isArray(req.messages)
    ? sanitizeMessages(req.messages, config.inputCharLimit || 120000)
    : [{ role: 'user', content: safeAnthropicText(text(req.prompt), 'AI provider prompt', config.inputCharLimit || 120000) }];
  const payload = {
    model: config.model,
    max_tokens: maxTokens,
    system: safeAnthropicText(system, 'AI provider system prompt', config.systemCharLimit || 180000),
    messages,
  };
  // Adaptive thinking + effort only on models that accept them; sending either
  // to Haiku or pre-4.6 models returns a 400 from the API.
  if (req.thinking && supportsAdaptiveThinking(config.model)) {
    payload.thinking = { type: 'adaptive' };
    if (EFFORT_LEVELS.test(text(req.effort))) {
      payload.output_config = { effort: text(req.effort) };
    }
  }
  return payload;
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, Math.max(1, timeoutMs));
  try {
    return await fetchImpl(url, Object.assign({}, init, { signal: controller.signal }));
  } finally {
    clearTimeout(timeout);
  }
}

function extractAnthropicText(payload) {
  if (!payload || !Array.isArray(payload.content)) return '';
  // Skip thinking blocks (no `text` field) and join every text block —
  // adaptive-thinking responses can interleave more than one.
  return payload.content
    .filter(function (item) {
      return item && item.type !== 'thinking' && typeof item.text === 'string';
    })
    .map(function (item) {
      return item.text;
    })
    .join('\n');
}

/*
 * OpenAI's chat-completions shape, which differs from Anthropic's in three ways
 * that each cause a hard failure if you get them wrong:
 *  - the system prompt is a message with role "system", not a top-level field;
 *  - the token cap is `max_completion_tokens` on current models and
 *    `max_tokens` on older ones, and sending the wrong one is a 400;
 *  - `thinking` / `output_config` do not exist and must never be forwarded.
 */
function buildOpenAIPayload(config, method, request, tokenField) {
  const req = request || {};
  const maxTokens = clamp(number(req.maxTokens, config.maxTokens || DEFAULT_MAX_TOKENS), 1, 4096);
  const system = method === 'classifyIntent'
    ? text(req.system || 'Return strict JSON for AfroTools routing only. Do not repeat sensitive user content beyond extracted workflow fields.')
    : text(req.system);
  const conversation = Array.isArray(req.messages)
    ? sanitizeMessages(req.messages, config.inputCharLimit || 120000)
    : [{ role: 'user', content: safeAnthropicText(text(req.prompt), 'AI provider prompt', config.inputCharLimit || 120000) }];

  const messages = [];
  const safeSystem = safeAnthropicText(system, 'AI provider system prompt', config.systemCharLimit || 180000);
  if (safeSystem.trim()) messages.push({ role: 'system', content: safeSystem });
  messages.push.apply(messages, conversation);

  const payload = { model: config.model, messages };
  payload[tokenField || 'max_completion_tokens'] = maxTokens;
  return payload;
}

function extractOpenAIText(payload) {
  const choice = payload && Array.isArray(payload.choices) ? payload.choices[0] : null;
  const content = choice && choice.message && choice.message.content;
  return typeof content === 'string' ? content : '';
}

/** A 400 naming the token field means this model wants the other one. */
function isTokenFieldRejection(detail) {
  return /max_completion_tokens|max_tokens/i.test(text(detail));
}

async function callOpenAI(method, request, config) {
  const fetchImpl = config.fetch || global.fetch;
  if (typeof fetchImpl !== 'function') return failure(method, 'fetch_unavailable', config);

  const attempts = Math.max(1, number(config.retries, DEFAULT_RETRIES) + 1);
  const startedAt = Date.now();
  let tokenField = 'max_completion_tokens';
  let lastReason = '';

  for (let attempt = 1; attempt <= attempts + 1; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchImpl, 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + config.apiKey,
        },
        body: JSON.stringify(buildOpenAIPayload(config, method, request, tokenField)),
      }, config.timeoutMs);

      if (!response.ok) {
        lastReason = 'provider_error_' + response.status;
        // One free retry with the other token field before giving up on a 400.
        if (response.status === 400 && tokenField === 'max_completion_tokens') {
          const detail = await response.text().catch(function () { return ''; });
          if (isTokenFieldRejection(detail)) {
            tokenField = 'max_tokens';
            safeLog(method, 'openai_token_field_switch', { provider: config.provider, attempt });
            continue;
          }
        }
        safeLog(method, lastReason, { provider: config.provider, status: response.status, attempt });
        if (response.status >= 500 && attempt < attempts) continue;
        return failure(method, lastReason, Object.assign({}, config, { latencyMs: Date.now() - startedAt }));
      }

      const payload = await response.json();
      const rawText = extractOpenAIText(payload);
      if (!rawText) return failure(method, 'provider_empty_response', Object.assign({}, config, { latencyMs: Date.now() - startedAt, usage: payload && payload.usage || null }));

      return success(method, {
        provider: config.provider,
        model: config.model,
        text: rawText,
        data: null,
        usage: payload && payload.usage || null,
        latencyMs: Date.now() - startedAt,
      });
    } catch (err) {
      lastReason = err && err.name === 'AbortError' ? 'provider_timeout' : 'provider_unavailable';
      safeLog(method, lastReason, { provider: config.provider, latencyMs: Date.now() - startedAt, attempt, name: err && err.name });
      if (lastReason !== 'provider_timeout' && attempt < attempts) continue;
      return failure(method, lastReason, Object.assign({}, config, { latencyMs: Date.now() - startedAt }));
    }
  }

  return failure(method, lastReason || 'provider_unavailable', Object.assign({}, config, { latencyMs: Date.now() - startedAt }));
}

async function callAnthropic(method, request, config) {
  const fetchImpl = config.fetch || global.fetch;
  if (typeof fetchImpl !== 'function') return failure(method, 'fetch_unavailable', config);

  const body = buildAnthropicPayload(config, method, request);
  const attempts = Math.max(1, number(config.retries, DEFAULT_RETRIES) + 1);
  const startedAt = Date.now();
  let lastReason = '';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchImpl, 'https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      }, config.timeoutMs);

      if (!response.ok) {
        lastReason = 'provider_error_' + response.status;
        safeLog(method, lastReason, { provider: config.provider, status: response.status, attempt });
        if (response.status >= 500 && attempt < attempts) continue;
        return failure(method, lastReason, Object.assign({}, config, { latencyMs: Date.now() - startedAt }));
      }

      const payload = await response.json();
      const rawText = extractAnthropicText(payload);
      if (!rawText) return failure(method, 'provider_empty_response', Object.assign({}, config, { latencyMs: Date.now() - startedAt, usage: payload && payload.usage || null }));

      return success(method, {
        provider: config.provider,
        model: config.model,
        text: rawText,
        data: null,
        usage: payload && payload.usage || null,
        latencyMs: Date.now() - startedAt,
      });
    } catch (err) {
      lastReason = err && err.name === 'AbortError' ? 'provider_timeout' : 'provider_unavailable';
      safeLog(method, lastReason, { provider: config.provider, latencyMs: Date.now() - startedAt, attempt, name: err && err.name });
      if (lastReason !== 'provider_timeout' && attempt < attempts) continue;
      return failure(method, lastReason, Object.assign({}, config, { latencyMs: Date.now() - startedAt }));
    }
  }

  return failure(method, lastReason || 'provider_unavailable', Object.assign({}, config, { latencyMs: Date.now() - startedAt }));
}

function createDisabledProvider(info) {
  function disabled(method) {
    return async function () {
      return failure(method, info.reason || 'provider_disabled', {
        provider: info.provider,
        model: info.model,
      });
    };
  }
  return {
    provider: info.provider,
    model: info.model,
    enabled: false,
    classifyIntent: disabled('classifyIntent'),
    generateWorkflowBrief: disabled('generateWorkflowBrief'),
    generateDocumentDraft: disabled('generateDocumentDraft'),
    improveCVText: disabled('improveCVText'),
    explainResult: disabled('explainResult'),
  };
}

function responseForTextMethod(raw, request) {
  const method = raw && raw.method || 'textGeneration';
  if (!raw.ok) return raw;
  if (request && request.schemaName) {
    const parsed = workflowSchemas.parseStructuredOutput(request.schemaName, raw.text || '', {
      allowedSourceUrls: request.allowedSourceUrls || [],
    });
    if (!parsed.ok) {
      return failure(method, 'response_schema_validation_failed', {
        provider: raw.provider,
        model: raw.model,
        latencyMs: raw.latencyMs,
        usage: raw.usage,
        validationErrors: parsed.errors,
      });
    }
    return success(method, {
      provider: raw.provider,
      model: raw.model,
      text: '',
      data: parsed.value,
      usage: raw.usage,
      latencyMs: raw.latencyMs,
      schemaName: parsed.schemaName,
    });
  }
  const guard = guardrails.sanitizeModelOutput(raw.text || '', {
    domain: request && request.domain || 'none',
    allowedSourceUrls: request && request.allowedSourceUrls || [],
  });
  if (!guard.text.trim()) {
    return failure(method, 'provider_empty_response', {
      provider: raw.provider,
      model: raw.model,
      latencyMs: raw.latencyMs,
      usage: raw.usage,
    });
  }
  return success(method, {
    provider: raw.provider,
    model: raw.model,
    text: guard.text,
    data: { text: guard.text },
    usage: raw.usage,
    latencyMs: raw.latencyMs,
    guardrails: { sourceUrlsRemoved: guard.sourceUrlsRemoved },
  });
}

/*
 * One provider shape, two transports.
 *
 * Everything after the HTTP call — JSON parsing, schema validation, guardrail
 * sanitising, the success/failure envelope — is provider-agnostic and must stay
 * identical, or an OpenAI answer would reach users under weaker checks than an
 * Anthropic one. Only `call` differs.
 */
function createTextProvider(config, call) {
  async function run(method, request, postProcess) {
    const validationErrors = validateRequest(method, request);
    if (validationErrors.length) {
      return failure(method, 'request_validation_failed', Object.assign({}, config, { validationErrors }));
    }
    const raw = await call(method, request, Object.assign({}, config, {
      model: request && request.model || config.model,
      maxTokens: request && request.maxTokens || config.maxTokens,
    }));
    return postProcess ? postProcess(raw, request) : raw;
  }

  return {
    provider: config.provider,
    model: config.model,
    enabled: true,
    classifyIntent: function classifyIntent(request) {
      return run('classifyIntent', request, function (raw) {
        if (!raw.ok) return raw;
        let data;
        try {
          data = JSON.parse(jsonTextFromMarkdown(raw.text));
        } catch (err) {
          return failure('classifyIntent', 'provider_invalid_json', {
            provider: raw.provider,
            model: raw.model,
            usage: raw.usage,
            latencyMs: raw.latencyMs,
          });
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          return failure('classifyIntent', 'response_validation_failed', {
            provider: raw.provider,
            model: raw.model,
            usage: raw.usage,
            latencyMs: raw.latencyMs,
            validationErrors: ['response must be an object'],
          });
        }
        if (request && request.schemaName) {
          const parsed = workflowSchemas.parseStructuredOutput(request.schemaName, data, {
            allowedSourceUrls: request.allowedSourceUrls || [],
          });
          if (!parsed.ok) {
            return failure('classifyIntent', 'response_schema_validation_failed', {
              provider: raw.provider,
              model: raw.model,
              usage: raw.usage,
              latencyMs: raw.latencyMs,
              validationErrors: parsed.errors,
            });
          }
          data = parsed.value;
        }
        return success('classifyIntent', {
          provider: raw.provider,
          model: raw.model,
          data,
          text: '',
          usage: raw.usage,
          latencyMs: raw.latencyMs,
        });
      });
    },
    generateWorkflowBrief: function generateWorkflowBrief(request) {
      return run('generateWorkflowBrief', request, responseForTextMethod);
    },
    generateDocumentDraft: function generateDocumentDraft(request) {
      return run('generateDocumentDraft', request, responseForTextMethod);
    },
    improveCVText: function improveCVText(request) {
      return run('improveCVText', request, responseForTextMethod);
    },
    explainResult: function explainResult(request) {
      return run('explainResult', request, responseForTextMethod);
    },
  };
}

/*
 * Wrap a primary provider so infrastructure failures fall through to a backup.
 *
 * Deliberately NOT a provider switch. Anthropic stays primary and owns the
 * prompt, the model tiering and the adaptive-thinking path; OpenAI exists to
 * answer on the day Anthropic cannot — a 5xx, a timeout, a 429, or the 401/403
 * that a lapsed card produces. Before this, any of those left the Direct answer
 * panel showing "the AI service is briefly unavailable" and the user with
 * nothing.
 *
 * A schema or JSON failure is not failed over: the request is the problem, so a
 * second model would spend twice to fail twice.
 */
function withFailover(primary, backup) {
  function wrap(name) {
    return async function (request) {
      const first = await primary[name](request);
      if (!shouldFailover(first)) return first;
      safeLog(name, 'provider_failover', { provider: primary.provider, to: backup.provider, from_reason: first.errorReason });
      const second = await backup[name](request);
      if (!second || !second.ok) return first; // Backup did no better — report the original cause.
      return Object.assign({}, second, { failoverFrom: primary.provider, failoverReason: first.errorReason });
    };
  }
  const wrapped = {
    provider: primary.provider,
    model: primary.model,
    enabled: true,
    failoverProvider: backup.provider,
  };
  PROVIDER_METHODS.forEach(function (name) { wrapped[name] = wrap(name); });
  return wrapped;
}

function createModelProvider(options) {
  const opts = options || {};
  const env = opts.env || process.env;
  const method = opts.method || 'classifyIntent';
  const purpose = opts.purpose || (method === 'classifyIntent' ? 'routing' : 'generation');
  const info = getProviderInfo(Object.assign({}, opts, { env, method, purpose }));

  const shared = {
    timeoutMs: number(defined(opts.timeoutMs, env.AFROTOOLS_AI_PROVIDER_TIMEOUT_MS), DEFAULT_TIMEOUT_MS),
    retries: number(defined(opts.retries, env.AFROTOOLS_AI_PROVIDER_RETRIES), DEFAULT_RETRIES),
    maxTokens: number(defined(opts.maxTokens, env[methodTokenEnv(method)]), DEFAULT_MAX_TOKENS),
    inputCharLimit: number(defined(opts.inputCharLimit, env.ANTHROPIC_INPUT_CHAR_LIMIT), 120000),
    systemCharLimit: number(defined(opts.systemCharLimit, env.ANTHROPIC_INPUT_CHAR_LIMIT), 180000),
    fetch: opts.fetch,
  };

  function openAIProvider() {
    const key = getOpenAIKey(env, purpose);
    if (!key) return null;
    return createTextProvider(Object.assign({}, shared, {
      provider: 'openai',
      apiKey: key,
      model: opts.openaiModel || getOpenAIModelForMethod(env, method, purpose),
    }), callOpenAI);
  }

  if (!info.enabled) {
    /* Anthropic is off. If it is off because the key is missing or the API is
     * unusable — rather than because someone deliberately disabled the model
     * layer — OpenAI can carry the whole load rather than the page degrading. */
    const backup = info.disabled ? null : openAIProvider();
    if (!backup) return createDisabledProvider(info);
    safeLog(method, 'provider_primary_unavailable_using_openai', { reason: info.reason });
    return backup;
  }

  const anthropic = createTextProvider(Object.assign({}, shared, {
    provider: info.provider,
    apiKey: getAnthropicKey(env, purpose),
    model: opts.model || getModelForMethod(env, method, purpose),
  }), callAnthropic);

  const backup = openAIProvider();
  return backup ? withFailover(anthropic, backup) : anthropic;
}

module.exports = {
  PROVIDER_METHODS,
  createModelProvider,
  getProviderInfo,
  validateRequest,
  jsonTextFromMarkdown,
  supportsAdaptiveThinking,
  getSmartGenerationModel,
  // Failover surface, exported so the behaviour can be tested without a network.
  shouldFailover,
  getOpenAIKey,
  getOpenAIModelForMethod,
  buildOpenAIPayload,
  extractOpenAIText,
};
