'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../tools/ovulation-calc/cycle-window-engine.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/ovulation-calc/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/ovulation-calc/cycle-window.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/ovulation-calc.json'), 'utf8'));

{
  const result = engine.calculate({
    lastPeriodDate: '2026-07-01',
    shortestCycle: 28,
    longestCycle: 30,
    asOf: '2026-07-26',
  });
  assert.equal(result.valid, true);
  assert.equal(result.nextPeriodStart, '2026-07-29');
  assert.equal(result.nextPeriodEnd, '2026-07-31');
  assert.equal(result.ovulationStart, '2026-07-13');
  assert.equal(result.ovulationEnd, '2026-07-19');
  assert.equal(result.pregnancyPossibleStart, '2026-07-08');
  assert.equal(result.pregnancyPossibleEnd, '2026-07-20');
  assert.equal(result.uncertainty, 'low');
}

{
  const result = engine.calculate({
    lastPeriodDate: '2026-07-01',
    shortestCycle: 24,
    longestCycle: 32,
    asOf: '2026-07-26',
  });
  assert.equal(result.uncertainty, 'extremely-low');
  assert.match(result.uncertaintyCopy, /especially uncertain/);
}

{
  const result = engine.calculate({
    lastPeriodDate: '2026-07-01',
    shortestCycle: 45,
    longestCycle: 45,
    asOf: '2026-07-26',
  });
  assert.equal(result.valid, true);
  assert.equal(result.outsideCommonRange, true);
  assert.equal(result.uncertainty, 'extremely-low');
  assert.match(result.uncertaintyCopy, /longer than the NHS common 21- to 35-day range/);
}

assert.equal(engine.calculate({
  lastPeriodDate: '2026-07-01',
  shortestCycle: 32,
  longestCycle: 28,
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  lastPeriodDate: '2026-05-01',
  shortestCycle: 28,
  longestCycle: 30,
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  lastPeriodDate: '2026-07-27',
  shortestCycle: 28,
  longestCycle: 30,
  asOf: '2026-07-26',
}).valid, false);

assert.match(html, /Cycle window estimator/);
assert.match(html, /cannot detect whether or when ovulation happened/);
assert.match(html, /Do not use these dates to decide unprotected sex is safe/);
assert.match(html, /No pregnancy claim/);
assert.match(html, /does not label other days safe/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/calculateur-ovulation\/"/);
assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/kikokotoo-ovulation\/"/);
assert.match(html, /Cycle dates stay off storage/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|chart\.js/i);
assert.doesNotMatch(html, /email.gat|save-result-button|health-workflow|Due Date|Fertility in Africa/i);
assert.doesNotMatch(script, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon/);
assert.equal(context.toolKey, 'ovulation-calc');
assert.match(context.staticText, /must never claim to confirm ovulation, fertility, infertility, conception or pregnancy/i);
assert.match(context.staticText, /Never label dates outside the output as safe/i);

console.log('cycle window estimator VIP tests passed');
