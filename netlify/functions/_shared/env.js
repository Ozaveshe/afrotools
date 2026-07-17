'use strict';

class EnvValidationError extends Error {
  constructor(names) {
    const missing = Array.from(new Set(names)).sort();
    super('Missing required environment variables: ' + missing.join(', '));
    this.name = 'EnvValidationError';
    this.code = 'MISSING_ENVIRONMENT_VARIABLES';
    this.missing = missing;
  }
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function getEnv(name, options) {
  const settings = options || {};
  const source = settings.source || process.env;
  const raw = source[name];

  if (!hasValue(raw)) {
    if (Object.prototype.hasOwnProperty.call(settings, 'defaultValue')) {
      return settings.defaultValue;
    }
    if (settings.required) throw new EnvValidationError([name]);
    return undefined;
  }

  return settings.transform ? settings.transform(raw, name) : raw;
}

/**
 * Read and validate an environment schema. Call this at module scope so
 * required variables fail during a function cold start, before a request runs.
 *
 * @example
 * const ENV = loadEnv({
 *   API_TOKEN: { required: true },
 *   TIMEOUT_MS: { defaultValue: 5000, transform: Number },
 * });
 */
function loadEnv(schema, options) {
  const source = (options && options.source) || process.env;
  const result = {};
  const missing = [];

  Object.keys(schema || {}).forEach(function (name) {
    const descriptor = schema[name] || {};
    const raw = source[name];
    if (!hasValue(raw) && descriptor.required && !Object.prototype.hasOwnProperty.call(descriptor, 'defaultValue')) {
      missing.push(name);
      return;
    }
    result[name] = getEnv(name, Object.assign({}, descriptor, { source: source }));
  });

  if (missing.length) throw new EnvValidationError(missing);
  return Object.freeze(result);
}

module.exports = {
  EnvValidationError,
  getEnv,
  loadEnv,
};
