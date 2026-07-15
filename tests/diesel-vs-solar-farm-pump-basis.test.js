'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'diesel-vs-solar-farm', 'index.html');
const engineFile = path.join(root, 'engines', 'diesel-vs-solar-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  '<option value="0" selected>Estimate from farm size (0.5 kW/ha)</option>',
  'Used to estimate pump kW only when farm-size mode is selected.',
  'id="pumpBasisHint"',
  'id="rPumpKW"',
  'id="rPumpBasis"',
  'Quote-ready pump sizing basis',
  'id="pumpBasisContext"',
  'id="pumpBasisChecks"',
  'id="copyPumpBrief"',
  'id="pumpBasisStatus"',
  'function basisText(input,result)',
  'function updatePumpHint()',
  'function pumpBriefText(input,result,country)',
  'function renderPumpBasis(input,result)',
  'function invalidatePumpBrief()',
  'Farm-size estimate:',
  'farm area not entered',
  '0.5 kW/ha is not hydraulic pump sizing',
  'total dynamic head',
  'borehole yield/recovery',
  'stay in your browser unless you choose to copy this brief',
  'Pump quote brief marked stale.',
  'Pump quote brief copied.'
].forEach((needle) => assert(html.includes(needle), `Missing farm-pump-basis contract: ${needle}`));

assert(!html.includes('data-df-form="diesel-vs-solar-farm"'), 'The disconnected generic diesel-vs-solar form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Diesel vs Solar Farm root');
assert(!html.includes('name="tariff"'), 'A disconnected generic tariff input must not remain');
assert(!html.includes('name="buffer"'), 'A disconnected generic sizing-buffer input must not remain');
assert(!html.includes('Enter your appliances, usage and tariff'), 'The app must not claim appliance or tariff inputs that do not exist');
assert(!html.includes('built for all 54 African countries'), 'The app must not overstate the countries shown in its selector');
assert(!html.includes('fuel prices at record highs'), 'The app must not make an unsupported current fuel-market claim');
assert(!html.includes('use current fuel prices'), 'The app must label its dated dataset rather than call prices current');
assert(!html.includes('localStorage'), 'Farm and pump inputs and quote briefs must not be silently stored');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 18, 'The existing 18-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Diesel vs Solar Farm FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'How does farm-size pump estimation work?',
    'What happens when I select a known pump size?',
    'What should a solar-pump supplier verify?'
  ],
  'FAQ schema must match the pump-sizing-basis guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Diesel vs Solar engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-diesel-vs-solar-engine');
assert(formula, 'Diesel vs Solar formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Diesel vs Solar engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'diesel-vs-solar-farm.webp')), 'Canonical Diesel vs Solar Farm image is missing');

console.log('Diesel vs Solar Farm verified: reachable farm-size engine mode, explicit known-pump behavior, quote-ready hydraulic checks, stale-brief guard, protected formula digest, privacy boundary, and canonical image.');
