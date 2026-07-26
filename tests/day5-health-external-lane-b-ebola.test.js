'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/ebola-checklist/ebola-action-engine.js');

test('emergency signs override exposure and outbreak selections', () => {
  const result = engine.assess({
    exposureWindow: 'none',
    outbreakContext: 'no',
    symptomOnset: 'today',
    confusion: true
  });
  assert.equal(result.level, 'Emergency services now');
  assert.match(result.action, /emergency services now/i);
  assert.match(result.warning, /Do not travel independently|wait/i);
});

test('recent possible exposure plus symptoms triggers immediate separation and public-health contact', () => {
  const result = engine.assess({
    exposureWindow: 'within21',
    outbreakContext: 'unknown',
    symptomOnset: '1-3',
    contact: true,
    fever: true
  });
  assert.equal(result.level, 'Immediate separation and public-health contact');
  assert.match(result.action, /testing, isolation and transport instructions/i);
  assert.match(result.warning, /self-clear/i);
});

test('official contact designation triggers public-health contact even without symptoms', () => {
  const result = engine.assess({
    exposureWindow: 'over21',
    outbreakContext: 'no',
    symptomOnset: 'none',
    authority: true
  });
  assert.equal(result.level, 'Contact public health immediately');
  assert.match(result.warning, /does not set a monitoring or isolation period/i);
});

test('an older self-entered exposure range never becomes clearance', () => {
  const older = engine.assess({
    exposureWindow: 'over21',
    outbreakContext: 'no',
    symptomOnset: 'none',
    funeral: true
  });
  const empty = engine.assess({
    exposureWindow: 'none',
    outbreakContext: 'no',
    symptomOnset: 'none'
  });
  assert.equal(older.level, 'Confirm the exposure timeline with public health');
  assert.match(older.warning, /cannot rule out exposure|end official monitoring/i);
  assert.equal(empty.level, 'No Ebola conclusion from this checklist');
  assert.match(empty.warning, /not proof/i);
});

test('route, export, privacy and AI context preserve the Ebola safety contract', () => {
  const html = fs.readFileSync(path.join(root, 'tools/ebola-checklist/index.html'), 'utf8');
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/ebola-checklist.json'), 'utf8'));
  assert.match(html, /Time since last possible exposure/);
  assert.match(html, /Affected-area or outbreak context/);
  assert.match(html, /2–21 day incubation range is context, not clearance/);
  assert.match(html, /WHO Ebola disease questions and answers/);
  assert.match(html, /Exposure timing:[\s\S]*Affected-area\/outbreak context:[\s\S]*Result[\s\S]*Assumption[\s\S]*Warning/);
  assert.doesNotMatch(html, /fetch\s*\(|sendBeacon|localStorage|sessionStorage|fonts\.googleapis|cdn\.jsdelivr/i);
  assert.match(context.staticText, /never self-clearance/i);
  assert.ok(context.disallowed.includes('setting monitoring, isolation or movement duration'));
  const hash = crypto.createHash('sha256').update(context.staticText).digest('hex');
  assert.equal(context.legacyTextSha256, `sha256:${hash}`);
});
