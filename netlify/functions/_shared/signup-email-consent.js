'use strict';

const FIELDS = Object.freeze(['email_digest_enabled', 'email_weekly_enabled']);

function invalid(invalidFields) {
  return { ok: false, error: 'invalid_email_preferences', invalidFields };
}

// Prospective signup input only. This does not update existing profile settings.
// Form callers must pass the raw form body, before duplicate keys are collapsed.
function normalizeSignupEmailConsent(input, { format = 'json' } = {}) {
  const preferences = { email_digest_enabled: false, email_weekly_enabled: false };
  const invalidFields = [];

  if (format === 'json') {
    if (input === undefined) input = {};
    if (input === null || typeof input !== 'object' || Array.isArray(input) ||
        Object.prototype.toString.call(input) !== '[object Object]') return invalid([...FIELDS]);

    for (const field of FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor) continue;
      if (!Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'boolean') {
        invalidFields.push(field);
      } else {
        preferences[field] = descriptor.value;
      }
    }
  } else if (format === 'form') {
    if (typeof input !== 'string' && !(input instanceof URLSearchParams)) return invalid([...FIELDS]);
    const params = typeof input === 'string' ? new URLSearchParams(input) : input;
    for (const field of FIELDS) {
      const values = params.getAll(field);
      if (values.length === 0) continue;
      if (values.length !== 1 || values[0] !== 'true') invalidFields.push(field);
      else preferences[field] = true;
    }
  } else {
    return invalid([...FIELDS]);
  }

  return invalidFields.length ? invalid(invalidFields) : { ok: true, preferences };
}

module.exports = { normalizeSignupEmailConsent };
