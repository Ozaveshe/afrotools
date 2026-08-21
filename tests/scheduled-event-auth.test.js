const assert = require('assert');

const { isScheduledEvent } = require('../netlify/functions/_shared/scheduled-event');

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

console.log('scheduled-event-auth: ok');
