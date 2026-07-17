'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'battery-sizing', 'index.html');
const engineFile = path.join(root, 'engines', 'battery-sizing-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Same-load chemistry comparison',
  'id="lithiumCard"',
  'id="leadCard"',
  'id="lithiumCapacity"',
  'id="leadCapacity"',
  'id="chemDecision"',
  'id="copyChemComparison"',
  'id="chemStatus"',
  'decisionText',
  'buildComparison',
  'renderComparison',
  'invalidateComparison',
  'Country-energy dataset month:',
  '85% usable depth for LiFePO4; 50% for lead-acid.',
  '30% inverter headroom rounded up to 0.5 kVA.',
  'not stored automatically',
  'The stale comparison cannot be copied.',
  'Battery chemistry comparison copied.'
].forEach((needle) => assert(html.includes(needle), `Missing chemistry-comparison contract: ${needle}`));

assert(!html.includes('data-df-form="battery-sizing"'), 'The disconnected generic battery-sizing form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Battery Sizing root');
assert(!html.includes('name="tariff"'), 'The comparison must not introduce a nonexistent tariff workflow');
assert(!html.includes('name="buffer"'), 'A second sizing-buffer estimate must not remain');
assert(!html.includes('Enter your appliances, usage and tariff'), 'FAQ copy must not claim appliance or tariff inputs that do not exist');
assert(!html.includes('built for all 54 African countries'), 'The root must not overstate the countries shown in its selector');
assert(!html.includes('localStorage'), 'Battery inputs and comparison results must not be silently stored by the root app');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 19, 'The existing 19-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Battery Sizing FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'Why does LiFePO4 need less nameplate capacity than lead-acid?',
    'Why is the inverter recommendation the same for both battery chemistries?',
    'What is excluded from the battery chemistry comparison?'
  ],
  'FAQ schema must match the chemistry-specific visible guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Battery Sizing engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-battery-sizing-engine');
assert(formula, 'Battery Sizing formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Battery Sizing engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'battery-sizing.webp')), 'Canonical Battery Sizing image is missing');

console.log('Battery Sizing verified: same-load chemistry comparison, selected-result state, stale-result guard, protected formula digest, 19-country selector, privacy boundary, and canonical image.');
