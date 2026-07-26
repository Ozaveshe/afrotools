'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/hep-b-screening/hep-b-pathway-engine.js');

test('adult routine pathway names the triple panel without interpreting it', () => {
  const result = engine.build({
    reason: 'routine',
    ageGroup: 'adult',
    exposureTiming: 'none',
    testing: 'none',
    diagnosis: 'none',
    vaccine: 'unknown'
  });
  assert.deepEqual(result.paths.map((pathway) => pathway.title), ['1. Testing pathway', '2. Diagnosis pathway', '3. Vaccination pathway']);
  assert.match(result.paths[0].text, /HBsAg, anti-HBs and total anti-HBc/);
  assert.match(result.paths[1].text, /Testing and diagnosis are separate/);
  assert.match(result.warning, /does not interpret laboratory results/i);
});

test('under-18 and unclear age contexts do not inherit adult screening wording', () => {
  const child = engine.build({
    reason: 'routine',
    ageGroup: 'under18',
    exposureTiming: 'none',
    testing: 'none',
    diagnosis: 'none',
    vaccine: 'unknown'
  });
  const unknown = engine.build({
    reason: 'routine',
    ageGroup: 'unknown',
    exposureTiming: 'none',
    testing: 'none',
    diagnosis: 'none',
    vaccine: 'unknown'
  });
  assert.match(child.paths[0].text, /Do not automatically apply the adult triple-panel/);
  assert.match(unknown.paths[0].text, /Confirm the age-specific pathway/);
});

test('possible exposure always routes immediately and timing never self-clears', () => {
  const older = engine.build({
    reason: 'exposure',
    ageGroup: 'adult',
    exposureTiming: '8plus',
    testing: 'partial',
    diagnosis: 'none',
    vaccine: 'incomplete'
  });
  const contradictory = engine.build({
    reason: 'exposure',
    ageGroup: 'adult',
    exposureTiming: 'none',
    testing: 'none',
    diagnosis: 'none',
    vaccine: 'unknown'
  });
  assert.match(older.urgency, /contact.*immediately/i);
  assert.match(older.urgency, /8 or more days ago/);
  assert.match(older.paths[0].text, /do not set testing timing yourself/i);
  assert.match(contradictory.notes[0], /timing marked as none/);
  assert.match(contradictory.urgency, /immediately/i);
});

test('pregnancy remains a distinct testing pathway during each pregnancy', () => {
  const result = engine.build({
    reason: 'pregnancy',
    ageGroup: 'adult',
    exposureTiming: 'none',
    testing: 'triple',
    diagnosis: 'none',
    vaccine: 'complete'
  });
  assert.match(result.paths[0].text, /HBsAg screening during this pregnancy/);
  assert.match(result.urgency, /prenatal care promptly during this pregnancy/i);
});

test('qualified diagnosis status is preserved without verification and vaccination stays separate', () => {
  const result = engine.build({
    reason: 'result',
    ageGroup: 'adult',
    exposureTiming: 'none',
    testing: 'told-positive',
    diagnosis: 'clinician',
    vaccine: 'complete'
  });
  assert.match(result.paths[1].text, /cannot verify, classify, stage or reassess/i);
  assert.match(result.paths[2].text, /vaccination as a separate professional decision/i);
  assert.doesNotMatch(result.paths[2].text, /immune|not infected/i);
});

test('route, export, privacy and AI context preserve the three-pathway contract', () => {
  const html = fs.readFileSync(path.join(root, 'tools/hep-b-screening/index.html'), 'utf8');
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/hep-b-screening.json'), 'utf8'));
  assert.match(html, /Qualified diagnosis status/);
  assert.match(html, /Timing is passed to the service; this app never uses it to decide that action is too late/);
  assert.match(html, /Reason:[\s\S]*Age context:[\s\S]*Possible exposure timing:[\s\S]*Testing record:[\s\S]*Qualified diagnosis status:[\s\S]*Vaccination record:[\s\S]*Pathways[\s\S]*Assumption[\s\S]*Warning/);
  assert.doesNotMatch(html, /fetch\s*\(|sendBeacon|localStorage|sessionStorage|fonts\.googleapis|cdn\.jsdelivr/i);
  assert.ok(context.disallowed.includes('interpreting a laboratory marker or marker combination'));
  const hash = crypto.createHash('sha256').update(context.staticText).digest('hex');
  assert.equal(context.legacyTextSha256, `sha256:${hash}`);
});
