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

const deadlineOverrides = require(path.join(__dirname, '..', 'data', 'scholarships', 'deadline-overrides.json'));
const chevening = deadlineOverrides.overrides['chevening-scholarship-uk-government-fcdo'];
assert.strictEqual(chevening.deadline_date, '2026-10-06', 'Chevening should retain the verified 2027-28 application deadline');
assert.strictEqual(chevening.status, 'open', 'Chevening should remain open during the verified 2027-28 application window');
assert.strictEqual(chevening.deadline_confidence, 'verified', 'Chevening deadline should remain tied to official timeline evidence');
assert.strictEqual(chevening.deadline_source_url, 'https://www.chevening.org/scholarships/application-timeline/', 'Chevening should use the current official timeline URL');

const twas = deadlineOverrides.overrides['twas-fellowships'];
assert.strictEqual(twas.deadline_date, null, 'TWAS umbrella record must not inherit a programme-specific deadline');
assert.strictEqual(twas.deadline_confidence, 'no_single_public_deadline', 'TWAS umbrella should preserve verified variable-deadline semantics');

const tongarewa = deadlineOverrides.overrides['victoria-wellington-tongarewa-scholarship'];
assert.strictEqual(tongarewa.deadline_date, null, 'Tongarewa umbrella record must not inherit one trimester deadline');
assert.strictEqual(tongarewa.deadline_confidence, 'no_single_public_deadline', 'Tongarewa should preserve trimester-specific deadline semantics');

const worldBankAfrica = deadlineOverrides.overrides['world-bank-group-africa-fellowship-2027'];
assert.strictEqual(worldBankAfrica.deadline_date, '2026-08-25', 'World Bank Africa Fellowship should use the verified 2027 call deadline');
assert.strictEqual(worldBankAfrica.status, 'open', 'World Bank Africa Fellowship should be open during the official application window');

const sydneyVcis = deadlineOverrides.overrides['sydney-vice-chancellors-international-scholarship-2027'];
assert.strictEqual(sydneyVcis.deadline_date, null, 'Sydney VCIS must not turn one selection round into a universal deadline');
assert.strictEqual(sydneyVcis.deadline_confidence, 'no_single_public_deadline', 'Sydney VCIS should preserve round-specific variable semantics');

const hassJanuary = deadlineOverrides.overrides['strathclyde-hass-international-masters-scholarship-january-2027'];
assert.strictEqual(hassJanuary.deadline_date, null, 'Strathclyde HASS should remain date-null while the provider says the deadline is unconfirmed');
assert.strictEqual(hassJanuary.deadline_confidence, 'no_single_public_deadline', 'Strathclyde HASS must not inherit another faculty deadline');

const icgebArturo = deadlineOverrides.overrides['icgeb-arturo-falaschi-postdoctoral-fellowships-september-2026'];
assert.strictEqual(icgebArturo.deadline_date, '2026-08-14', 'ICGEB Arturo should retain the public expression-of-interest cutoff');
assert.strictEqual(icgebArturo.status, 'closed', 'ICGEB Arturo must close after the public expression-of-interest stage');

const icgebAicad = deadlineOverrides.overrides['icgeb-aicad-short-term-postdoctoral-fellowships-september-2026'];
assert.strictEqual(icgebAicad.status, 'closed', 'ICGEB-AICAD must close after the public expression-of-interest stage');

const manchesterEquityMerit = deadlineOverrides.overrides['manchester-equity-merit-scholarships'];
assert.strictEqual(manchesterEquityMerit.deadline_date, '2026-08-31', 'Manchester Equity and Merit should use the current 2027/28 scholarship cutoff');
assert.strictEqual(manchesterEquityMerit.status, 'open', 'Manchester Equity and Merit should remain open during the verified August 2026 window');

const unisqStudentSupport = deadlineOverrides.overrides['unisq-international-student-support-scholarship-2027'];
assert.strictEqual(unisqStudentSupport.deadline_date, null, 'UniSQ Student Support must remain date-null across provider study periods');
assert.strictEqual(unisqStudentSupport.deadline_confidence, 'no_single_public_deadline', 'UniSQ Student Support should preserve verified study-period deadline semantics');

const unisqDphd = deadlineOverrides.overrides['unisq-international-stipend-fees-research-scholarship-dphd'];
assert.strictEqual(unisqDphd.deadline_date, '2026-09-27', 'UniSQ DPHD should retain the official 2027 scholarship cutoff');

const sarbMasters = deadlineOverrides.overrides['sarb-data-science-machine-learning-scholarship-2027'];
assert.strictEqual(sarbMasters.deadline_date, '2026-10-31', "SARB Data Science master's scholarship should use the official call deadline");

const sarbExternal = deadlineOverrides.overrides['sarb-external-bursary-scheme-2027'];
assert.strictEqual(sarbExternal.deadline_date, '2026-09-30', 'SARB External Bursary should use the official 2027 call deadline');

const ruthFirst = deadlineOverrides.overrides['rhodes-university-ruth-first-scholarship-2027'];
assert.strictEqual(ruthFirst.deadline_date, '2026-08-25', 'Ruth First 2027 should use the official Rhodes deadline');

const cydDoctoral = deadlineOverrides.overrides['epfl-cyd-doctoral-fellowships-14th-call'];
assert.strictEqual(cydDoctoral.deadline_date, '2026-08-19', 'CYD Doctoral should use the public Stage 1 cutoff');
assert(cydDoctoral.deadline_text.includes('Stage 2'), 'CYD Doctoral should retain the shortlisted Stage 2 date in context');

const cydPostdoc = deadlineOverrides.overrides['epfl-cyd-distinguished-postdoctoral-fellowships-14th-call'];
assert.strictEqual(cydPostdoc.deadline_date, '2026-08-19', 'CYD Postdoctoral should use the public Stage 1 cutoff');

const friasEarlyCareer = deadlineOverrides.overrides['frias-early-career-fellowship-2027-2028'];
assert.strictEqual(friasEarlyCareer.deadline_date, '2026-09-18', "FRIAS Early Career should retain the provider's exact 2027/28 cutoff");
assert(friasEarlyCareer.deadline_text.includes('CET'), 'FRIAS should preserve the timezone text published by the provider');

console.log('Scholarship deadline trust model verified.');
