'use strict';

// These entrypoints MUST remain scheduled-only in netlify.toml. Production
// Netlify blocks URL invocation; next_run and user-agent are not credentials.
// tests/scheduled-event-auth.test.js enforces the declaration/caller contract.
const SCHEDULED_ONLY_FUNCTIONS = Object.freeze([
  'afrostream-livecheck',
  'afrostream-news-monitor',
  'afrostream-sync',
  'scheduled-cleanup-scraper-runs',
  'scheduled-reconcile-scholarship-deadlines',
  'scheduled-refresh-market-data',
  'scheduled-send-jamb-daily',
  'scheduled-send-scholarship-reminders',
  'scheduled-source-health-watchdog',
  'send-activity-milestones',
  'send-lead-followups',
  'send-monthly-digest',
  'send-onboarding-nudges',
  'send-signin-reminders',
  'send-weekly-newsletter',
]);

function isScheduledEvent(event, scheduledFunctionName) {
  if (!event || typeof event !== 'object') return false;
  const markers = [];
  let manualHeaders = false;
  for (const headers of [event.headers, event.multiValueHeaders]) {
    if (headers == null) continue;
    if (typeof headers !== 'object' || Array.isArray(headers)) return false;
    for (const key of Object.keys(headers)) {
      const name = key.toLowerCase();
      if (name === 'x-nf-event') {
        const values = Array.isArray(headers[key]) ? headers[key] : [headers[key]];
        if (!values.length) return false;
        markers.push(...values);
      }
      if (/^(origin|referer|authorization|proxy-authorization|cookie|x-admin-key)$/.test(name) || name.startsWith('sec-fetch-')) {
        manualHeaders = true;
      }
    }
  }

  // Keep legacy platform-header support, but fail closed on conflicting markers.
  if (markers.length) return markers.every(value => typeof value === 'string' && value.toLowerCase() === 'schedule');

  // Only code-owned, declared scheduled entrypoints may use Netlify's documented
  // body contract. Never pass a request-derived name or use this for an HTTP API.
  if (!SCHEDULED_ONLY_FUNCTIONS.includes(scheduledFunctionName) || manualHeaders) return false;
  if (event.httpMethod != null && event.httpMethod !== 'POST') return false;
  if (event.isBase64Encoded != null && event.isBase64Encoded !== false) return false;
  for (const query of [event.queryStringParameters, event.multiValueQueryStringParameters]) {
    if (query != null && (typeof query !== 'object' || Array.isArray(query) || Object.keys(query).length)) return false;
  }
  if (event.rawQuery != null && event.rawQuery !== '') return false;
  if ([event.rawUrl, event.path].some(value => typeof value === 'string' && value.includes('?'))) return false;
  if (typeof event.body !== 'string' || event.body.length > 128) return false;

  try {
    const payload = JSON.parse(event.body);
    if (!payload || Array.isArray(payload) || Object.keys(payload).length !== 1 || typeof payload.next_run !== 'string') return false;
    // Also reject duplicate keys/escaped property names hidden by JSON.parse.
    if (!/^\s*\{\s*"next_run"\s*:\s*"[^"\\]*"\s*\}\s*$/.test(event.body)) return false;
    const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(payload.next_run);
    if (!match) return false;
    const parsed = new Date(payload.next_run);
    const canonical = match[1] + '.' + (match[2] || '').padEnd(3, '0') + 'Z';
    return Number.isFinite(parsed.getTime()) && parsed.toISOString() === canonical;
  } catch {
    return false;
  }
}

module.exports = {
  isScheduledEvent,
  SCHEDULED_ONLY_FUNCTIONS,
};
