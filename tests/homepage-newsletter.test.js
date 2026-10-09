const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const start = html.indexOf("document.getElementById('nl-form')?.addEventListener");
const end = html.indexOf('  // ── LOAD SOURCE-AND-TIMESTAMPED', start);
assert.ok(start >= 0 && end > start);
const script = html.slice(start, end);

async function check(ok, networkFailure) {
  let submit, request;
  const button = { textContent: 'Notify Me →', disabled: false };
  const input = { value: 'synthetic@example.test', checkValidity: () => true };
  const form = { querySelector: selector => selector === 'button' ? button : input };
  const values = { 'form-name': 'newsletter', email: input.value, source: 'homepage', consent_version: 'weekly-2026-10-09', 'bot-field': '' };
  const context = {
    document: { getElementById: () => ({ addEventListener: (_name, fn) => { submit = fn; } }) },
    URLSearchParams,
    FormData: class {
      constructor(target) { assert.equal(target, form); }
      *[Symbol.iterator]() { yield* Object.entries(values); }
    },
    fetch: async (_url, options) => {
      request = options;
      if (networkFailure) throw new Error('Network unavailable');
      return { ok };
    },
  };
  vm.runInNewContext(script, context);
  await submit.call(form, { preventDefault() {} });
  const sent = new URLSearchParams(request.body);
  assert.equal(sent.get('source'), 'homepage');
  assert.equal(sent.get('consent_version'), 'weekly-2026-10-09');
  assert.equal(sent.get('bot-field'), '');
  assert.equal(input.value, ok && !networkFailure ? '' : 'synthetic@example.test');
  assert.equal(button.textContent, ok && !networkFailure ? "✓ You're on the list!" : 'Try again →');
  assert.equal(button.disabled, false);
}

(async () => {
  await check(true, false);
  await check(false, false);
  await check(false, true);
  console.log('homepage-newsletter: success, rejection and network failure passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
