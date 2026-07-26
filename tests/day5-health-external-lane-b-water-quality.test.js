'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/water-quality/water-result-engine.js');

test('missing testing and values never produce a safety conclusion', () => {
  const result = engine.review({
    labStatus: 'none',
    sampleScope: 'unknown',
    advisory: 'unknown',
    ecoliStatus: 'not-entered'
  });
  assert.equal(result.level, 'Safety cannot be assessed');
  assert.match(result.warning, /cannot test or certify water/i);
});

test('official advisories override otherwise passing entries', () => {
  const base = {
    labStatus: 'competent',
    sampleScope: 'drinking',
    ecoliStatus: 'not-detected',
    arsenic: 5,
    fluoride: 1,
    turbidity: 0.5
  };
  const doNotDrink = engine.review({ ...base, advisory: 'do-not-drink' });
  const boil = engine.review({ ...base, advisory: 'boil' });
  assert.equal(doNotDrink.level, 'Official do-not-drink advisory takes priority');
  assert.match(doNotDrink.action, /Do not use these entries, or boiling, to end or override/i);
  assert.equal(boil.level, 'Official boil-water advisory takes priority');
  assert.match(boil.action, /boiling does not remove every chemical hazard/i);
});

test('E. coli detection gets a distinct public-health action pathway', () => {
  const result = engine.review({
    labStatus: 'competent',
    sampleScope: 'drinking',
    advisory: 'none',
    ecoliStatus: 'detected'
  });
  assert.equal(result.level, 'E. coli was reported detected');
  assert.match(result.action, /water\/public-health authority.*now/i);
});

test('chemical boundaries and turbidity caution are deterministic', () => {
  const boundaries = engine.review({
    labStatus: 'competent',
    sampleScope: 'drinking',
    advisory: 'none',
    ecoliStatus: 'not-detected',
    arsenic: 10,
    fluoride: 1.5,
    turbidity: 1
  });
  const caution = engine.review({
    labStatus: 'competent',
    sampleScope: 'drinking',
    advisory: 'none',
    ecoliStatus: 'not-detected',
    arsenic: 10,
    fluoride: 1.5,
    turbidity: 5
  });
  const exceeded = engine.review({
    labStatus: 'competent',
    sampleScope: 'drinking',
    advisory: 'none',
    ecoliStatus: 'not-detected',
    arsenic: 10.1,
    fluoride: 1.51,
    turbidity: 5.1
  });
  assert.equal(boundaries.flags.filter((flag) => flag.status === 'pass').length, 4);
  assert.equal(caution.flags[3].status, 'caution');
  assert.match(caution.level, /safety unverified/i);
  assert.equal(exceeded.flags.filter((flag) => flag.status === 'fail').length, 3);
  assert.match(exceeded.level, /references are exceeded/i);
});

test('sample mismatch and all-passing results still do not certify safety', () => {
  const mismatch = engine.review({
    labStatus: 'competent',
    sampleScope: 'other',
    advisory: 'none',
    ecoliStatus: 'not-detected'
  });
  const passing = engine.review({
    labStatus: 'competent',
    sampleScope: 'drinking',
    advisory: 'none',
    ecoliStatus: 'not-detected',
    arsenic: 9,
    fluoride: 1.2,
    turbidity: 0.8
  });
  assert.equal(mismatch.level, 'Confirm the report and sample context');
  assert.equal(passing.level, 'No entered reference exceedance — safety remains unverified');
  assert.match(passing.action, /do not certify/i);
});

test('route, export, privacy and AI context preserve the non-certification contract', () => {
  const html = fs.readFileSync(path.join(root, 'tools/water-quality/index.html'), 'utf8');
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/water-quality.json'), 'utf8'));
  assert.match(html, /Current official local water advisory/);
  assert.match(html, /do not convert a detection limit into zero/i);
  assert.match(html, /9789240121225/);
  assert.match(html, /Testing status:[\s\S]*Report sample context:[\s\S]*Official local advisory:[\s\S]*Sample collection date:[\s\S]*Result[\s\S]*Assumptions[\s\S]*Warning/);
  assert.doesNotMatch(html, /fetch\s*\(|sendBeacon|localStorage|sessionStorage|fonts\.googleapis|cdn\.jsdelivr/i);
  assert.ok(context.disallowed.includes('certifying water as safe'));
  const hash = crypto.createHash('sha256').update(context.staticText).digest('hex');
  assert.equal(context.legacyTextSha256, `sha256:${hash}`);
});
