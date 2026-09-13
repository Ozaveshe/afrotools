const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { isScheduledEvent, SCHEDULED_ONLY_FUNCTIONS } = require('../netlify/functions/_shared/scheduled-event');

assert.strictEqual(
  isScheduledEvent({
    headers: { 'X-NF-Event': 'schedule' },
    body: JSON.stringify({ next_run: '2026-07-01T00:00:00.000Z' }),
  }),
  true,
  'Netlify scheduled events with the schedule header should be accepted'
);

assert.strictEqual(
  isScheduledEvent({
    headers: { 'x-nf-event': 'SCHEDULE' },
    body: JSON.stringify({ next_run: '2026-07-01T00:00:00.000Z' }),
  }),
  true,
  'Scheduled event header matching should be case-insensitive'
);

assert.strictEqual(
  isScheduledEvent({
    headers: {},
    body: JSON.stringify({ next_run: '2026-07-01T00:00:00.000Z' }),
  }),
  false,
  'A client-shaped next_run body without the Netlify schedule header must be rejected'
);

assert.strictEqual(
  isScheduledEvent({
    headers: { 'x-nf-event': 'manual' },
    body: JSON.stringify({ next_run: '2026-07-01T00:00:00.000Z' }),
  }),
  false,
  'A non-schedule event header must not be overridden by a client-shaped next_run body'
);

assert.strictEqual(
  isScheduledEvent({ headers: {}, body: JSON.stringify({ next_run: 'not-a-date' }) }),
  false,
  'Malformed next_run payloads must not be accepted'
);

const workerName = 'scheduled-refresh-market-data';
const body = JSON.stringify({ next_run: '2026-09-13T06:39:00.000Z' });
const naturalEvent = {
  httpMethod: 'POST',
  path: '/.netlify/functions/' + workerName,
  rawUrl: 'https://example.invalid/.netlify/functions/' + workerName,
  headers: { 'content-type': 'application/json', 'user-agent': 'synthetic-fixture-not-a-credential' },
  multiValueHeaders: {},
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  rawQuery: '',
  isBase64Encoded: false,
  body,
};

for (const name of SCHEDULED_ONLY_FUNCTIONS) {
  assert.strictEqual(isScheduledEvent(naturalEvent, name), true, name + ': declared worker accepts documented natural payload');
}
for (const name of [undefined, '', 'ordinary-http-api', 'Scheduled-refresh-market-data']) {
  assert.strictEqual(isScheduledEvent(naturalEvent, name), false, 'generic or unknown callers must not body-authenticate');
}
for (const timestamp of ['2026-09-13T06:39:00Z', '2026-09-13T06:39:00.1Z', '2026-09-13T06:39:00.123Z']) {
  assert.strictEqual(isScheduledEvent({ body: JSON.stringify({ next_run: timestamp }) }, workerName), true);
}

const rejected = [
  { headers: { 'x-nf-event': 'manual' } },
  { headers: { 'x-nf-event': '' } },
  { headers: { 'x-nf-event': 'schedule', 'X-NF-Event': 'manual' } },
  { headers: { 'x-nf-event': 'schedule' }, multiValueHeaders: { 'X-NF-Event': ['manual'] } },
  { multiValueHeaders: { 'X-NF-Event': [] } },
  { headers: { Origin: 'https://example.invalid' } },
  { multiValueHeaders: { Authorization: ['Bearer synthetic'] } },
  { headers: { 'x-admin-key': 'wrong-key' } },
  { headers: { Cookie: 'synthetic=true' } },
  { headers: { Referer: 'https://example.invalid' } },
  { headers: { 'Sec-Fetch-Site': 'same-origin' } },
  { headers: [] },
  { httpMethod: 'GET' },
  { httpMethod: 'OPTIONS' },
  { isBase64Encoded: true },
  { isBase64Encoded: 'false' },
  { queryStringParameters: { dataset: 'fx' } },
  { multiValueQueryStringParameters: { anything: [''] } },
  { queryStringParameters: 'dataset=fx' },
  { rawQuery: 'dataset=fx' },
  { rawUrl: naturalEvent.rawUrl + '?dataset=fx' },
  { path: naturalEvent.path + '?dataset=fx' },
  { body: JSON.stringify({ next_run: '2026-09-13T06:39:00Z', dataset: 'fx' }) },
  { body: '{"next_run":"2026-09-13T06:39:00Z","next_run":"2026-09-14T06:39:00Z"}' },
  { body: '{"next_run": "2026-09-13T06:39:00Z"' },
  { body: 'null' },
  { body: '[]' },
  { body: '{}' },
  { body: JSON.stringify({ next_run: null }) },
  { body: body + ' '.repeat(128) },
];
for (const timestamp of ['not-a-date', '2026-09-13', '2026-02-30T06:39:00Z', '2026-09-13T24:39:00Z', '2026-09-13T06:39:00+00:00', '2026-09-13T06:39:00.1234Z']) {
  rejected.push({ body: JSON.stringify({ next_run: timestamp }) });
}
rejected.forEach((overrides, index) => {
  assert.strictEqual(isScheduledEvent({ ...naturalEvent, ...overrides }, workerName), false, 'reject unsafe body fallback fixture ' + index);
});
assert.strictEqual(isScheduledEvent({ headers: { 'X-NF-Event': 'schedule' }, multiValueHeaders: { 'x-nf-event': ['schedule'] } }), true);
assert.strictEqual(isScheduledEvent({ headers: { 'x-nf-event': 'schedule' } }), true, 'legacy header-only event remains supported');

// This is a security contract, not just a fixture allowlist: losing a deployed
// schedule or introducing a generic/request-derived caller must fail CI.
const root = path.resolve(__dirname, '..');
const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const declaredSchedules = new Set();
let currentFunction = null;
for (const line of config.split(/\r?\n/)) {
  if (/^\s*\[/.test(line)) {
    const section = /^\[functions\."([^"]+)"\]\s*$/.exec(line);
    currentFunction = section ? section[1] : null;
  }
  if (currentFunction && /^\s*schedule\s*=\s*"[^"\r\n]+"/.test(line)) declaredSchedules.add(currentFunction);
}
const callers = new Set();
for (const file of fs.readdirSync(path.join(root, 'netlify/functions')).filter(name => name.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(root, 'netlify/functions', file), 'utf8');
  const name = file.slice(0, -3);
  if (!source.includes("require('./_shared/scheduled-event')") && !source.includes("require('./_shared/scheduled-proof')")) continue;
  callers.add(name);
  assert.ok(SCHEDULED_ONLY_FUNCTIONS.includes(name), name + ' must explicitly opt in');
  if (source.includes("require('./_shared/scheduled-event')")) {
    const calls = [...source.matchAll(/isScheduledEvent\(([^)]*)\)/g)];
    assert.ok(calls.length > 0, name + ' must call the scheduled detector');
    calls.forEach(call => assert.strictEqual(call[1], "event, '" + name + "'", name + ' must use its own literal name, never request data'));
  }
  if (source.includes("require('./_shared/scheduled-proof')")) {
    const wrappers = [...source.matchAll(/withScheduledProof\(([^,]*),/g)];
    assert.ok(wrappers.length > 0, name + ' must call the scheduled proof wrapper');
    wrappers.forEach(wrapper => assert.strictEqual(wrapper[1], "'" + name + "'", name + ' proof wrapper must use its own literal name'));
  }
}
for (const name of SCHEDULED_ONLY_FUNCTIONS) {
  assert.ok(declaredSchedules.has(name), name + ' MUST have a netlify.toml schedule for the platform URL boundary');
  assert.ok(callers.has(name), name + ' must have an explicit caller, not a speculative allowlist entry');
}
console.log('scheduled-event-auth: ok (' + SCHEDULED_ONLY_FUNCTIONS.length + ' schedule/caller contracts)');
