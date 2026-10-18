const assert = require('node:assert/strict');
const { test } = require('node:test');
const { normalizeSignupEmailConsent } = require('../netlify/functions/_shared/signup-email-consent');

const fields = ['email_digest_enabled', 'email_weekly_enabled'];
const preferences = (digest, weekly) => ({ email_digest_enabled: digest, email_weekly_enabled: weekly });
const accepted = (input, expected, options) => {
  assert.deepEqual(normalizeSignupEmailConsent(input, options), { ok: true, preferences: expected });
};

test('missing JSON preferences do not enroll a new account', () => {
  accepted(undefined, preferences(false, false));
  accepted({}, preferences(false, false));
  accepted({ name: 'Synthetic member', tier: 'pro' }, preferences(false, false));
});

test('each actual JSON boolean is honored independently', () => {
  for (const digest of [false, true]) for (const weekly of [false, true]) {
    accepted(preferences(digest, weekly), preferences(digest, weekly));
  }
  accepted({ email_digest_enabled: true }, preferences(true, false));
  accepted({ email_weekly_enabled: true }, preferences(false, true));
});

test('provided JSON non-booleans are rejected, never coerced to opt in', () => {
  for (const field of fields) for (const value of ['true', 'false', '', 'on', 0, 1, null, undefined, [], {}, NaN]) {
    const result = normalizeSignupEmailConsent({ [field]: value });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'invalid_email_preferences');
    assert.deepEqual(result.invalidFields, [field]);
    assert.equal(Object.hasOwn(result, 'preferences'), false);
  }
});

test('invalid JSON containers fail without reading unrelated sensitive values', () => {
  for (const input of [null, false, true, 0, '', [], new URLSearchParams()]) {
    assert.equal(normalizeSignupEmailConsent(input).ok, false);
  }
  accepted({ get password() { throw new Error('must not read password'); } }, preferences(false, false));
});

test('inherited consent and prototype keys cannot enroll or leak into the result', () => {
  accepted(Object.create({ email_digest_enabled: true, email_weekly_enabled: true }), preferences(false, false));
  accepted(JSON.parse('{"__proto__":{"email_digest_enabled":true},"constructor":true}'), preferences(false, false));
});

test('a failed consent field invalidates the whole preference result', () => {
  const result = normalizeSignupEmailConsent({ email_digest_enabled: true, email_weekly_enabled: 'true' });
  assert.deepEqual(result, { ok: false, error: 'invalid_email_preferences', invalidFields: ['email_weekly_enabled'] });
});

test('frozen caller input is unchanged and only two consent fields are returned', () => {
  const input = Object.freeze({ email_digest_enabled: false, email_weekly_enabled: true, role: 'admin', email: 'synthetic@example.invalid' });
  accepted(input, preferences(false, true));
  assert.equal(input.role, 'admin');
  assert.equal(input.email_digest_enabled, false);
});

test('unchecked form fields default off; exact checked value true is accepted', () => {
  accepted('', preferences(false, false), { format: 'form' });
  accepted('name=Synthetic&email_digest_enabled=true', preferences(true, false), { format: 'form' });
  accepted(new URLSearchParams('email_weekly_enabled=true'), preferences(false, true), { format: 'form' });
  accepted('email_digest_enabled=true&email_weekly_enabled=true', preferences(true, true), { format: 'form' });
});

test('duplicate raw form consent fields fail before last-value-wins parsing', () => {
  for (const field of fields) {
    for (const tail of ['true', 'false', '']) {
      const result = normalizeSignupEmailConsent(`${field}=true&${field}=${tail}`, { format: 'form' });
      assert.equal(result.ok, false);
      assert.deepEqual(result.invalidFields, [field]);
    }
  }
  assert.equal(normalizeSignupEmailConsent('email_digest_enabled=true&email%5Fdigest%5Fenabled=true', { format: 'form' }).ok, false);
});

test('noncanonical form consent values and pre-collapsed objects fail', () => {
  for (const value of ['false', '', 'on', '1', 'TRUE', 'true+', '%20true', 'null']) {
    assert.equal(normalizeSignupEmailConsent(`email_digest_enabled=${value}`, { format: 'form' }).ok, false);
  }
  assert.equal(normalizeSignupEmailConsent({ email_digest_enabled: 'true' }, { format: 'form' }).ok, false);
});

test('errors expose field names only, not submitted email/password/value', () => {
  const result = normalizeSignupEmailConsent({ email_digest_enabled: 'synthetic-private-value', email: 'member@example.invalid', password: 'synthetic-password' });
  assert.equal(JSON.stringify(result).includes('synthetic'), false);
  assert.equal(JSON.stringify(result).includes('@'), false);
});

test('unknown transport formats fail closed', () => {
  assert.equal(normalizeSignupEmailConsent({}, { format: 'other' }).ok, false);
});
