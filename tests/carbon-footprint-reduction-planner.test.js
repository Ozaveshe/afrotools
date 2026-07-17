'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'carbon-footprint-energy', 'index.html');
const engineFile = path.join(root, 'engines', 'carbon-footprint-energy-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Dominant-source reduction planner',
  'id="carbonMethodContext"',
  '0.48 kg CO₂/kWh',
  '2.68 kg CO₂/litre',
  '3.00 kg CO₂/kg',
  '1.70 kg CO₂/kg',
  'Protected default set · reviewed 1 March 2026.',
  'country affects offset-cost currency, not these emissions factors',
  'https://www.epa.gov/ghgemissions/carbon-footprint-calculator',
  'https://www.epa.gov/climateleadership/ghg-emission-factors-hub',
  'id="reductionSource"',
  'id="reductionPct"',
  'id="planActivityCut"',
  'id="planAvoidedMonthly"',
  'id="planRevisedMonthly"',
  'id="planAvoidedAnnual"',
  'id="carbonPlanStatus"',
  'function updateReductionPlan()',
  'function prepareReductionPlan(inputs,result)',
  'function markPlanStale()',
  'country changes offset-cost currency only',
  'fixed factors apply to every country',
  'Reduction target marked stale.',
  'Do not use it as a formal emissions inventory.'
].forEach((needle) => assert(html.includes(needle), `Missing carbon reduction-planner contract: ${needle}`));

assert(!html.includes('data-df-form="carbon-footprint-energy"'), 'The disconnected generic carbon form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Carbon Footprint root');
assert(!html.includes('Enter your appliances, usage and tariff'), 'The app must not claim inputs that do not exist');
assert(!html.includes('standard emission factors'), 'The app must identify its fixed factor set instead of implying a general standard');
assert(!html.includes('localStorage'), 'Energy activity and reduction targets must not be silently stored');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 14, 'The existing 14-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Carbon Footprint FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'Are the electricity emissions country-specific?',
    'How should I choose a reduction target?',
    'Can I use this result as a formal emissions inventory?'
  ],
  'FAQ schema must match the fixed-factor reduction-planner guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Carbon Footprint engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-carbon-footprint-energy-engine');
assert(formula, 'Carbon Footprint formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Carbon Footprint engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'carbon-footprint-energy.webp')), 'Canonical Carbon Footprint image is missing');

console.log('Carbon Footprint verified: dominant-source reduction target, explicit fixed-factor and country scope, stale-result guard, official method context, protected formula digest, privacy boundary, and canonical image.');
