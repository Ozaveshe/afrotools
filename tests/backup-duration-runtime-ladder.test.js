'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'backup-duration', 'index.html');
const engineFile = path.join(root, 'engines', 'backup-duration-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Load-shedding runtime ladder',
  'id="runtimeLadderContext"',
  'id="runtimeLadderBody"',
  'id="copyRuntimePlan"',
  'id="runtimeLadderStatus"',
  'var LOAD_SCENARIOS=',
  'function scenarioRows(input)',
  'function runtimePlanText(input,result,scenarios)',
  'function renderRuntimeLadder(input,result)',
  'function invalidateRuntimePlan()',
  '{name:"All entered loads",ratio:1',
  '{name:"Shed 25% of load",ratio:.75',
  '{name:"Half-load plan",ratio:.5',
  '{name:"Critical-load target",ratio:.4',
  '{name:"Emergency essentials",ratio:.25',
  'Inverter efficiency assumption: 90%',
  're-runs the protected formula',
  'startup surge, inverter idle draw, battery age',
  'stay in your browser unless you choose to copy',
  'Runtime plan marked stale. Recalculate to refresh every load target.',
  'Outage runtime plan copied.'
].forEach((needle) => assert(html.includes(needle), `Missing load-shedding-runtime contract: ${needle}`));

assert(!html.includes('data-df-form="backup-duration"'), 'The disconnected generic backup-duration form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Backup Duration root');
assert(!html.includes('name="usable"'), 'A second generic usable-capacity input must not remain');
assert(!html.includes('name="loss"'), 'A second generic inverter-loss input must not remain');
assert(!html.includes('Enter your appliances, usage and tariff'), 'The app must not claim appliance or tariff inputs that do not exist');
assert(!html.includes('built for all 54 African countries'), 'The app must not make an irrelevant country-coverage claim');
assert(!html.includes('exactly how long'), 'The app must not describe backup runtime as exact');
assert(!html.includes('accurate backup hours'), 'Metadata must not promise accuracy the model cannot establish');
assert(!html.includes('localStorage'), 'Battery inputs and runtime plans must not be silently stored');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Backup Duration FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'How is the load-shedding runtime ladder calculated?',
    'What happens if I enter both kWh and Ah battery capacity?',
    'Why can real backup runtime be shorter than the estimate?'
  ],
  'FAQ schema must match the runtime-ladder guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Backup Duration engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-backup-duration-engine');
assert(formula, 'Backup Duration formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Backup Duration engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'backup-duration.webp')), 'Canonical Backup Duration image is missing');

console.log('Backup Duration verified: five protected-engine load scenarios, visible efficiency and capacity assumptions, stale-plan guard, copyable outage plan, protected formula digest, privacy boundary, and canonical image.');
