'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const engine = require('../tools/due-date/due-date-range-engine.js');
const contextBuilder = require('../scripts/build-ai-tool-context.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/due-date/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/due-date/due-date-range.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/due-date-tools.json'), 'utf8'));

{
  const result = engine.calculate({
    method: 'lmp',
    date: '2026-01-01',
    cycleLength: 28,
    asOf: '2026-07-26',
  });
  assert.equal(result.valid, true);
  assert.equal(result.dueDate, '2026-10-08');
  assert.equal(result.week37Date, '2026-09-17');
  assert.equal(result.week42Date, '2026-10-22');
}

{
  const result = engine.calculate({
    method: 'lmp',
    date: '2026-01-01',
    cycleLength: 30,
    asOf: '2026-07-26',
  });
  assert.equal(result.dueDate, '2026-10-10');
}

{
  const day3 = engine.calculate({
    method: 'ivf',
    date: '2026-02-01',
    embryoAge: 3,
    asOf: '2026-07-26',
  });
  const day5 = engine.calculate({
    method: 'ivf',
    date: '2026-02-01',
    embryoAge: 5,
    asOf: '2026-07-26',
  });
  assert.equal(day3.dueDate, '2026-10-22');
  assert.equal(day5.dueDate, '2026-10-20');
}

assert.equal(engine.calculate({
  method: 'ivf',
  date: '2026-02-01',
  embryoAge: 6,
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  method: 'lmp',
  date: '2026-08-01',
  cycleLength: 28,
  asOf: '2026-07-26',
}).valid, false);

{
  const asOf = engine.parseIsoDate('2026-07-26');
  [21, 28, 35].forEach((cycleLength) => {
    const oldestDays = 294 + (cycleLength - 28);
    const boundary = engine.toIsoDate(engine.addDays(asOf, -oldestDays));
    const tooOld = engine.toIsoDate(engine.addDays(asOf, -(oldestDays + 1)));
    assert.equal(engine.calculate({
      method: 'lmp',
      date: boundary,
      cycleLength,
      asOf: '2026-07-26',
    }).valid, true, `cycle ${cycleLength} should accept its 42-week boundary`);
    const rejected = engine.calculate({
      method: 'lmp',
      date: tooOld,
      cycleLength,
      asOf: '2026-07-26',
    });
    assert.equal(rejected.valid, false, `cycle ${cycleLength} should reject boundary - 1 day`);
    assert.equal(rejected.field, 'date');
  });

  [
    { embryoAge: 3, oldestDays: 277 },
    { embryoAge: 5, oldestDays: 275 },
  ].forEach(({ embryoAge, oldestDays }) => {
    const boundary = engine.toIsoDate(engine.addDays(asOf, -oldestDays));
    const tooOld = engine.toIsoDate(engine.addDays(asOf, -(oldestDays + 1)));
    assert.equal(engine.calculate({
      method: 'ivf',
      date: boundary,
      embryoAge,
      asOf: '2026-07-26',
    }).valid, true, `day-${embryoAge} should accept its 42-week boundary`);
    const rejected = engine.calculate({
      method: 'ivf',
      date: tooOld,
      embryoAge,
      asOf: '2026-07-26',
    });
    assert.equal(rejected.valid, false, `day-${embryoAge} should reject boundary - 1 day`);
    assert.equal(rejected.field, 'date');
  });
}

assert.match(html, /Pregnancy date range estimator/);
assert.match(html, /Need appointment dates/);
assert.match(html, /No conception-date claim from LMP/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.match(html, /Nothing is remembered/);
assert.match(html, /Download TXT/);
assert.match(html, /Download PDF/);
assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/date-accouchement\/"/);
assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/kikokotoo-tarehe-ya-kujifungua\/"/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|chart\.js/i);
assert.doesNotMatch(html, /email.gat|save-result-button|health-workflow|milestoneData|trimester health tips/i);
assert.doesNotMatch(script, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon/);
assert.equal(context.toolKey, 'due-date-tools');
assert.equal(context.status, 'unverified-static');
assert.equal(
  context.legacyTextSha256,
  `sha256:${crypto.createHash('sha256').update(context.staticText).digest('hex')}`,
);
contextBuilder.validateDefinition(context, 'data/ai/tool-context/due-date-tools.json');
assert.match(context.staticText, /distinct purpose is calculation only/i);
assert.match(context.staticText, /does not create an appointment plan/i);
assert.match(context.staticText, /must not be saved, placed in URLs, sent to analytics/i);

console.log('due date range estimator VIP tests passed');
