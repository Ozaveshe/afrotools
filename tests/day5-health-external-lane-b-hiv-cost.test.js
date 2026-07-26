'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/hiv-treatment-cost/hiv-cost-engine.js');

test('legacy monthly entries retain exact monthly and annual arithmetic', () => {
  const result = engine.calculate({
    currency: 'KES',
    clinic: 1000,
    labs: 500,
    transport: 300,
    other: 200,
    support: 750
  });
  assert.equal(result.grossMonthly, 2000);
  assert.equal(result.netMonthly, 1250);
  assert.equal(result.netAnnual, 15000);
});

test('mixed cadences are annualised before assistance is subtracted', () => {
  const result = engine.calculate({
    currency: 'NGN',
    decimalPlaces: 2,
    clinic: 1000,
    clinicPeriod: 'quarterly',
    labs: 1200,
    labsPeriod: 'annual',
    transport: 100,
    transportPeriod: 'monthly',
    other: 500,
    otherPeriod: 'once',
    support: 300,
    supportPeriod: 'quarterly'
  });
  assert.deepEqual(result.breakdown.map((line) => line.annual), [4000, 1200, 1200, 500]);
  assert.equal(result.grossAnnual, 6900);
  assert.equal(result.supportAnnual, 1200);
  assert.equal(result.netAnnual, 5700);
  assert.equal(result.netMonthly, 475);
});

test('annualised assistance cannot exceed annualised gross costs', () => {
  assert.throws(() => engine.calculate({
    currency: 'USD',
    clinic: 100,
    clinicPeriod: 'annual',
    labs: 0,
    transport: 0,
    other: 0,
    support: 10,
    supportPeriod: 'monthly'
  }), /Annualised confirmed assistance cannot exceed/);
});

test('display precision is explicit and currency labels reject unsafe or personal text', () => {
  const rounded = engine.calculate({
    currency: 'TND',
    decimalPlaces: 3,
    clinic: 10.1255,
    labs: 0,
    transport: 0,
    other: 0,
    support: 0
  });
  assert.equal(rounded.grossAnnual, 121.506);
  assert.throws(() => engine.calculate({
    currency: '<script>',
    clinic: 0,
    labs: 0,
    transport: 0,
    other: 0,
    support: 0
  }), /short currency code/i);
  assert.throws(() => engine.calculate({
    currency: 'my clinic',
    clinic: 0,
    labs: 0,
    transport: 0,
    other: 0,
    support: 0
  }), /short currency code/i);
});

test('route, export, privacy and AI context preserve arithmetic-only boundaries', () => {
  const html = fs.readFileSync(path.join(root, 'tools/hiv-treatment-cost/index.html'), 'utf8');
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/hiv-treatment-cost.json'), 'utf8'));
  assert.match(html, /Clinic amount cadence/);
  assert.match(html, /Monthly × 12; quarterly × 4/);
  assert.match(html, /Currency label:[\s\S]*Displayed decimal places:[\s\S]*Results[\s\S]*Assumptions[\s\S]*Warning/);
  assert.match(html, /no regimen, missed-dose, interruption or adherence advice/i);
  assert.doesNotMatch(html, /fetch\s*\(|sendBeacon|localStorage|sessionStorage|fonts\.googleapis|cdn\.jsdelivr/i);
  assert.ok(context.disallowed.includes('giving regimen, interruption, missed-dose or adherence advice'));
  const hash = crypto.createHash('sha256').update(context.staticText).digest('hex');
  assert.equal(context.legacyTextSha256, `sha256:${hash}`);
});
