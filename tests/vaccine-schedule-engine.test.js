const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require(path.join(ROOT, 'tools', 'vaccine-schedule', 'vaccine-schedule-engine.js'));
const HTML = fs.readFileSync(path.join(ROOT, 'tools', 'vaccine-schedule', 'index.html'), 'utf8');
const CONTEXT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ai', 'tool-context', 'vaccine-schedule.json'), 'utf8'));

function input(overrides = {}) {
  return { country: 'NG', ageBand: 'infant', recordStatus: 'routine', recordProduct: '', ...overrides };
}

test('supported country creates a dated official handoff without a schedule or completion status', () => {
  const result = engine.prepare(input());
  assert.equal(result.ok, true);
  assert.equal(result.country, 'Nigeria');
  assert.equal(result.sourceStatus, 'official-programme-handoff');
  assert.match(result.officialUrl, /^https:\/\/nphcda\.gov\.ng\//);
  assert.equal(result.checkedDate, '2026-07-26');
  assert.deepEqual(result.scheduleItems, []);
  assert.deepEqual(result.dueDates, []);
  assert.equal(result.completionStatus, null);
});

test('country without a safely verified page fails closed to the WHO portal and local provider', () => {
  const ethiopia = engine.prepare(input({ country: 'ET' }));
  assert.equal(ethiopia.ok, true);
  assert.equal(ethiopia.sourceStatus, 'no-verified-country-page');
  assert.equal(ethiopia.officialUrl, '');
  assert.match(ethiopia.whoUrl, /immunizationdata\.who\.int/);
  assert.match(ethiopia.sourceNote, /Fail-closed/i);
});

test('catch-up and missing-record paths generate questions, never instructions', () => {
  const missed = engine.prepare(input({ country: 'ZA', recordStatus: 'missed' }));
  assert.match(missed.questions.join(' '), /create the catch-up plan from the exact record/i);
  assert.doesNotMatch(missed.questions.join(' '), /restart|continue where|give .* dose|administer/i);
  const missingRecord = engine.prepare(input({ recordStatus: 'no-record' }));
  assert.match(missingRecord.questions.join(' '), /without inventing dates or doses/i);
});

test('optional product text is normalized, bounded and never interpreted', () => {
  const result = engine.prepare(input({ recordProduct: '  Product   label ' + 'x'.repeat(100) }));
  assert.equal(result.recordProduct.length, 80);
  assert.match(result.questions.join(' '), /What exact product and dose does that entry represent/i);
});

test('missing or unsupported selections fail closed', () => {
  assert.equal(engine.prepare(input({ country: '' })).ok, false);
  assert.equal(engine.prepare(input({ ageBand: '14-weeks' })).ok, false);
  assert.equal(engine.prepare(input({ recordStatus: 'complete' })).ok, false);
});

test('page retires universal schedule, due-date tracker, persistence and unsupported claims', () => {
  assert.doesNotMatch(HTML, /const VACCINES|AGE_DAYS|getDueDate|vax_done|localStorage\.setItem|vaccines completed|data-status=["']overdue|class=["'][^"']*overdue/i);
  assert.doesNotMatch(HTML, /WHO EPI Schedule for Africa|Complete child vaccination schedule|all vaccines .* free|2-3 million child deaths|12\.7 million|40-75%|over 99%/i);
  assert.doesNotMatch(HTML, /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|chart\.js|health-workflow\.js|email-gated/i);
  assert.match(HTML, /No schedule or completion verdict was generated/);
});

test('page has exact catch-up, contraindication, completion, emergency and privacy boundaries', () => {
  assert.match(HTML, /Do not calculate missed doses here/);
  assert.match(HTML, /Do not give or withhold a dose from this page/);
  assert.match(HTML, /never marks a person “complete,” “overdue,” “protected,” or “up to date.”/);
  assert.match(HTML, /Get immediate local emergency care/);
  assert.match(HTML, /does not request or store a birth date, name, school, clinic, address, or contact details/);
  assert.match(HTML, /Print \/ Save PDF/);
  assert.match(HTML, /Download text brief/);
});

test('SEO, source freshness, JSON-LD and AI context are truthful', () => {
  assert.equal((HTML.match(/<main(?:\s|>)/g) || []).length, 1);
  assert.equal((HTML.match(/<\/main>/g) || []).length, 1);
  assert.match(HTML, /<title>Vaccination Programme Finder &amp; Visit Brief \| AfroTools<\/title>/);
  assert.match(HTML, /<link rel="canonical" href="https:\/\/afrotools\.com\/tools\/vaccine-schedule\/">/);
  assert.match(HTML, /<meta property="article:modified_time" content="2026-07-26">/);
  assert.match(HTML, /Checked 26 July 2026/);
  const blocks = Array.from(HTML.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), match => JSON.parse(match[1]));
  assert.deepEqual(blocks.map(block => block['@type']), ['WebApplication', 'BreadcrumbList', 'FAQPage']);
  assert.equal(CONTEXT.toolKey, 'vaccine-schedule');
  assert.match(CONTEXT.staticText, /must not output a universal fixed schedule/i);
});
