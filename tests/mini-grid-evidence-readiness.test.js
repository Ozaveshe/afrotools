'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'mini-grid-feasibility', 'index.html');
const engineFile = path.join(root, 'engines', 'mini-grid-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Protected Screening Result',
  'Fixed Revenue Tariff',
  '$0.40/kWh',
  'Annual OPEX Assumption',
  '5% of CAPEX',
  'Illustrative 40% Grant Cap',
  'Screening result vs evidence readiness',
  'id="readinessContext"',
  'id="readinessGates"',
  'id="evidenceLoadSurvey"',
  'id="evidenceWillingness"',
  'id="evidenceAnchor"',
  'id="evidenceSite"',
  'id="readinessSummary"',
  'id="copyScreeningBrief"',
  'id="readinessStatus"',
  'function screeningBriefText(input,result,evidence)',
  'function updateReadiness()',
  'function renderReadiness(input,result)',
  'function invalidateReadiness()',
  'Checklist marks are local notes, not verification by AfroTools.',
  'not approval or bankability',
  'connection ramp-up',
  'grant cap:',
  'not eligibility or availability',
  'stay in your browser unless you choose to copy this brief',
  'Screening brief marked stale.',
  'Mini-grid screening brief copied.'
].forEach((needle) => assert(html.includes(needle), `Missing mini-grid-evidence-readiness contract: ${needle}`));

assert(!html.includes('data-df-form="mini-grid-feasibility"'), 'The disconnected generic mini-grid form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Mini-Grid root');
assert(!html.includes('name="tariff"'), 'A disconnected editable tariff must not imply control over the protected model');
assert(!html.includes('name="capex"'), 'A disconnected generic CAPEX input must not remain');
assert(!html.includes('Enter your appliances, usage and tariff'), 'The app must not claim appliance or tariff inputs that do not exist');
assert(!html.includes('built for all 54 African countries'), 'The app must not overstate the countries shown in its selector');
assert(!html.includes('starting point for any DFI or investor proposal'), 'A screening model must not be framed as investor-ready');
assert(!html.includes('Grant Potential (DFI)'), 'An illustrative amount must not be presented as grant potential');
assert(!html.includes('localStorage'), 'Community inputs and evidence marks must not be silently stored');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 17, 'The existing 17-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Mini-Grid FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'What does the mini-grid screening result mean?',
    'Which tariff and operating-cost assumptions drive payback?',
    'Which evidence should be checked before pre-feasibility?'
  ],
  'FAQ schema must match the evidence-readiness guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Mini-Grid engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-mini-grid-engine');
assert(formula, 'Mini-Grid formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Mini-Grid engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'mini-grid-feasibility.webp')), 'Canonical Mini-Grid image is missing');

console.log('Mini-Grid verified: protected screening label separated from four evidence gates, fixed tariff/OPEX disclosed, grant amount relabeled, stale-brief guard, protected formula digest, privacy boundary, and canonical image.');
