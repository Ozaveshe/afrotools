'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'energy-audit', 'index.html');
const engineFile = path.join(root, 'engines', 'energy-audit-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  '30-day measured savings plan',
  'id="auditPlanContext"',
  'id="auditPlanList"',
  'id="copyAuditPlan"',
  'id="auditPlanStatus"',
  'function verificationFor(action)',
  'function rankedOpportunities(opportunities)',
  'function renderActionPlan(input,result)',
  'function invalidateActionPlan()',
  'Residential tariff used:',
  'Household-level heuristic; no individual appliances were measured.',
  'per-action estimates overlap and are not additive',
  'caps the combined household savings estimate at 50%',
  'Run a seven-day test at 24–26°C',
  'Record overnight meter use before and after unplugging standby loads',
  'copied only at your request',
  'Plan marked stale. Recalculate to refresh every estimate.',
  'Measured action plan copied.'
].forEach((needle) => assert(html.includes(needle), `Missing measured-action-plan contract: ${needle}`));

assert(!html.includes('data-df-form="energy-audit"'), 'The disconnected generic energy-audit form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Home Energy Audit root');
assert(!html.includes('name="tariff"'), 'A second generic tariff input must not remain');
assert(!html.includes('name="buffer"'), 'A second generic sizing-buffer input must not remain');
assert(!html.includes('Enter your appliances, usage and tariff'), 'The app must not claim appliance inputs that do not exist');
assert(!html.includes('built for all 54 African countries'), 'The app must not overstate the countries shown in its selector');
assert(!html.includes('localStorage'), 'Household inputs and action plans must not be silently stored');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 15, 'The existing 15-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Home Energy Audit FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'Is this an appliance-by-appliance energy audit?',
    'Can I add the savings percentages together?',
    'How should I verify an energy-saving recommendation?'
  ],
  'FAQ schema must match the measured-action-plan guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Home Energy Audit engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-energy-audit-engine');
assert(formula, 'Home Energy Audit formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Home Energy Audit engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'energy-audit.webp')), 'Canonical Home Energy Audit image is missing');

console.log('Home Energy Audit verified: prioritized 30-day action plan, per-action verification, overlap warning, stale-plan guard, protected formula digest, privacy boundary, and canonical image.');
