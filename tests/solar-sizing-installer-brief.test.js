'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'solar-sizing', 'index.html');
const engineFile = path.join(root, 'engines', 'solar-sizing-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'id="installerBriefOutput"',
  'id="copyInstallerBrief"',
  'id="installerBriefStatus"',
  'Calculated installer brief',
  'Send every installer the same calculated load brief',
  'buildInstallerBrief',
  'renderInstallerBrief',
  'invalidateInstallerBrief',
  'Country-energy dataset month:',
  'Peak-sun assumption:',
  'Appliance load used',
  'PV array includes a 25% production and loss margin.',
  'Battery capacity targets 1.5 days of calculated energy demand.',
  'Inverter includes 20% connected-load headroom',
  'not stored automatically',
  'The previous brief is stale and cannot be copied.',
  'Calculated installer brief copied.'
].forEach((needle) => assert(html.includes(needle), `Missing calculated installer-brief contract: ${needle}`));

assert(!html.includes('data-df-form="solar-sizing"'), 'The disconnected generic solar-sizing form must not remain');
assert(!html.includes('/assets/js/pages/english-df-app-upgrades.js'), 'The generic form runtime must not control the Solar Sizing root');
assert(!html.includes('name="loadWatts"'), 'A second essential-load estimate must not remain');
assert(!html.includes('name="autonomy"'), 'A second battery-autonomy estimate must not remain');
assert(!html.includes('name="buffer"'), 'A second headroom estimate must not remain');
assert(!html.includes('Enter your appliances, usage and tariff'), 'FAQ copy must not claim a nonexistent tariff input');
assert(!html.includes('built for all 54 African countries'), 'The root must not overstate the countries shown in its selector');
assert(!html.includes('localStorage'), 'Appliance and sizing data must not be silently stored by the root app');

const countryOptions = [...html.matchAll(/<option value="[A-Z]{2}">/g)];
assert.strictEqual(countryOptions.length, 21, 'The existing 21-country selector must remain intact');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const faq = structuredData.find((entry) => entry['@type'] === 'FAQPage');
assert(faq, 'Solar Sizing FAQ schema is missing');
assert.deepStrictEqual(
  faq.mainEntity.map((entry) => entry.name),
  [
    'How does the Solar Sizing Calculator estimate system size?',
    'Does the calculator model appliance startup surge?',
    'What should I send installers for comparable solar quotes?'
  ],
  'FAQ schema must match the app-specific visible guidance'
);

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Solar Sizing engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-solar-sizing-engine');
assert(formula, 'Solar Sizing formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected engine digest must still match the formula registry');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'solar-sizing.webp')), 'Canonical Solar Sizing image is missing');

console.log('Solar Sizing verified: one engine-backed installer brief, stale-result guard, app-specific FAQ, protected formula digest, 21-country selector, privacy boundary, and canonical image.');
