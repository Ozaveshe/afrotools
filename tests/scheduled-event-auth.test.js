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
  'A caller-controlled next_run body must not bypass manual authorization'
);

assert.strictEqual(
  isScheduledEvent({
    headers: { 'x-nf-event': 'manual' },
    body: JSON.stringify({ next_run: '2026-07-01T00:00:00.000Z' }),
  }),
  false,
  'Only the Netlify schedule event header should mark a run as scheduled'
);

console.log('scheduled-event-auth: ok');
