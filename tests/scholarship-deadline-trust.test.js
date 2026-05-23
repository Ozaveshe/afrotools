const assert = require('assert');
const fs = require('fs');
const path = require('path');

const trust = require(path.join(__dirname, '..', 'tools/scholarship-finder/scholarship-deadline-trust.js'));

const now = new Date('2026-05-21T00:00:00Z');

const urgent = trust.normalizeDeadline({
  name: 'Urgent verified scholarship',
  deadline_date: '2026-05-30',
  source_url: 'https://example.edu/scholarship',
  last_verified_at: '2026-05-20T10:00:00Z'
}, now);

assert.strictEqual(urgent.deadlineStatus, 'urgent', 'future date within 14 days should be urgent');
assert.strictEqual(urgent.deadlineConfidence, 'verified', 'dated deadline with source URL and last checked should be verified');
assert.strictEqual(urgent.daysLeft, 9, 'days-left calculation should use exact sourced dates only');

const closingSoon = trust.normalizeDeadline({
  name: 'Closing soon scholarship',
  deadlineDate: '2026-06-15',
  officialLink: 'https://example.edu/closing',
  lastChecked: '2026-05-21'
}, now);

assert.strictEqual(closingSoon.deadlineStatus, 'closing_soon', 'future date 15-30 days away should be closing soon');
assert.strictEqual(closingSoon.daysLeft, 25, 'closing soon scholarship should calculate days left');

const rolling = trust.normalizeDeadline({
  name: 'Rolling scholarship',
  deadline_text: 'Rolling admission while funds remain',
  source_url: 'https://example.edu/rolling',
  last_seen_at: '2026-05-20'
}, now);

assert.strictEqual(rolling.deadlineStatus, 'rolling', 'rolling text should normalize to rolling');
assert.strictEqual(rolling.deadlineConfidence, 'inferred', 'rolling language is inferred, not an exact verified date');
assert.strictEqual(rolling.daysLeft, null, 'rolling deadlines must not calculate days left');

const monthOnly = trust.normalizeDeadline({
  name: 'Month-only scholarship',
  deadline_text: 'Nov (annual)',
  source_url: 'https://example.edu/month',
  last_verified_at: '2026-05-20'
}, now);

assert.strictEqual(monthOnly.deadlineStatus, 'upcoming', 'month-only or annual cycle should be upcoming');
assert.strictEqual(monthOnly.displayLabel, 'Annual cycle expected', 'annual month-only text should explain the cycle');
assert.strictEqual(monthOnly.daysLeft, null, 'month-only deadlines must not calculate exact days left');
assert.notStrictEqual(monthOnly.deadlineStatus, 'urgent', 'month-only deadlines must never become urgent');

const unclear = trust.normalizeDeadline({
  name: 'Unclear scholarship',
  deadline_text: 'Check official page',
  source_url: 'https://example.edu/unclear'
}, now);

assert.strictEqual(unclear.deadlineStatus, 'unclear', 'unclear text should stay unclear');
assert.strictEqual(unclear.deadlineConfidence, 'unclear', 'unclear deadlines must not be upgraded without source and date');
assert.strictEqual(unclear.daysLeft, null, 'unclear deadlines must not calculate days left');
assert.strictEqual(unclear.displayLabel, 'Research queue', 'unclear rows should use research queue product language');
assert.strictEqual(unclear.displayText, 'Provider page varies', 'generic provider checks should use research queue wording');

const variable = trust.normalizeDeadline({
  name: 'Variable scholarship',
  deadline_text: 'No single public deadline; deadlines vary by partner institution.',
  deadline_confidence: 'no_single_public_deadline',
  deadline_source_url: 'https://example.edu/variable',
  deadline_notes: 'Official source says each partner sets its own deadline.',
  last_verified_at: '2026-05-20T10:00:00Z'
}, now);

assert.strictEqual(variable.deadlineStatus, 'variable', 'verified no-single-deadline rows should not remain in research queue');
assert.strictEqual(variable.deadlineConfidence, 'no_single_public_deadline', 'variable rows should preserve official-source confidence');
assert.strictEqual(variable.displayLabel, 'No single public deadline', 'variable rows should have a clear product label');
assert.strictEqual(variable.daysLeft, null, 'variable deadlines must not calculate days left');

const closed = trust.normalizeDeadline({
  name: 'Past scholarship',
  deadline_date: '2025-12-31',
  official_url: 'https://example.edu/past',
  last_verified_at: '2026-05-20'
}, now);

assert.strictEqual(closed.deadlineStatus, 'closed', 'past exact dates should be marked closed');
assert.strictEqual(closed.deadlineConfidence, 'verified', 'past dates can be source-backed while still closed');
assert(closed.detail.includes('passed'), 'closed deadlines should explain that the listed date has passed');

const html = trust.buildTrustRowHtml({
  name: 'Unclear scholarship',
  provider: 'Provider',
  deadline_text: 'Check official provider',
  source_url: 'https://example.edu/unclear'
}, unclear);

assert(html.includes('Research queue'), 'trust row should show research queue label');
assert(html.includes('Provider page varies'), 'trust row should avoid vague deadline wording');
assert(html.includes('Report deadline'), 'unclear trust row should expose report action');
assert(html.includes('Submit official deadline source'), 'unclear trust row should expose source submission action');
assert(!/Urgent/.test(html), 'unclear trust row must not present urgency');

const variableHtml = trust.buildTrustRowHtml({
  name: 'Variable scholarship',
  provider: 'Provider',
  deadline_text: variable.deadlineText,
  deadline_confidence: 'no_single_public_deadline',
  deadline_source_url: 'https://example.edu/variable'
}, variable);

assert(variableHtml.includes('No single public deadline'), 'trust row should show verified variable status');
assert(variableHtml.includes('Official source checked'), 'trust row should show official-source checked confidence');
assert(!variableHtml.includes('Report deadline'), 'verified no-single-public-deadline rows should not invite deadline reports');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'tools/scholarship-finder/index.html'), 'utf8');
assert(indexHtml.includes('scholarship-deadline-trust.css'), 'Scholarship Finder should load deadline-trust CSS');
assert(indexHtml.includes('scholarship-deadline-trust.js'), 'Scholarship Finder should load deadline-trust script');

console.log('Scholarship deadline trust model verified.');
