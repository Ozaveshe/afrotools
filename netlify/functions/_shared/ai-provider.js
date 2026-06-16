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
  return {
    provider,
    purpose,
    enabled: !disabled && provider === 'anthropic' && Boolean(key),
    disabled,
    configured: Boolean(key),
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

function failure(method, reason, extra) {
  return Object.assign({
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
  return {
    model: config.model,
    max_tokens: maxTokens,
    system: safeAnthropicText(system, 'AI provider system prompt', config.systemCharLimit || 180000),
    messages,
  };
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
  const first = payload.content.find(function (item) {
    return item && typeof item.text === 'string';
  });
  return first ? first.text : '';
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

function createAnthropicProvider(config) {
  async function run(method, request, postProcess) {
    const validationErrors = validateRequest(method, request);
    if (validationErrors.length) {
      return failure(method, 'request_validation_failed', Object.assign({}, config, { validationErrors }));
    }
    const raw = await callAnthropic(method, request, Object.assign({}, config, {
      model: request && request.model || config.model,
      maxTokens: request && request.maxTokens || config.maxTokens,
    }));
    return postProcess ? postProcess(raw, request) : raw;
  }

  return {
    provider: 'anthropic',
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

function createModelProvider(options) {
  const opts = options || {};
  const env = opts.env || process.env;
  const method = opts.method || 'classifyIntent';
  const purpose = opts.purpose || (method === 'classifyIntent' ? 'routing' : 'generation');
  const info = getProviderInfo(Object.assign({}, opts, { env, method, purpose }));
  if (!info.enabled) return createDisabledProvider(info);

  return createAnthropicProvider({
    provider: info.provider,
    apiKey: getAnthropicKey(env, purpose),
    model: opts.model || getModelForMethod(env, method, purpose),
    timeoutMs: number(defined(opts.timeoutMs, env.AFROTOOLS_AI_PROVIDER_TIMEOUT_MS), DEFAULT_TIMEOUT_MS),
    retries: number(defined(opts.retries, env.AFROTOOLS_AI_PROVIDER_RETRIES), DEFAULT_RETRIES),
    maxTokens: number(defined(opts.maxTokens, env[methodTokenEnv(method)]), DEFAULT_MAX_TOKENS),
    inputCharLimit: number(defined(opts.inputCharLimit, env.ANTHROPIC_INPUT_CHAR_LIMIT), 120000),
    systemCharLimit: number(defined(opts.systemCharLimit, env.ANTHROPIC_INPUT_CHAR_LIMIT), 180000),
    fetch: opts.fetch,
  });
}

module.exports = {
  PROVIDER_METHODS,
  createModelProvider,
  getProviderInfo,
  validateRequest,
  jsonTextFromMarkdown,
};
