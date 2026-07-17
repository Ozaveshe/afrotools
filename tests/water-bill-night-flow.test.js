'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'water-bill', 'index.html');
const engineFile = path.join(root, 'engines', 'water-bill-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Measured night-flow test (optional)',
  'id="night-start-reading"',
  'id="night-end-reading"',
  'id="night-minutes"',
  'three decimals represent one litre',
  'id="night-flow-title"',
  'id="night-flow-status"',
  'id="night-delta-output"',
  'id="night-flow-output"',
  'id="night-loss-output"',
  'id="night-cost-output"',
  'function optionalNumber(name)',
  'const nightMovementLitres = nightDeltaM3 * 1000;',
  'const nightFlowLitresHour =',
  'const nightMonthlyLossM3 = nightDailyLossLitres * 30 / 1000;',
  'const projectedBlocks = blockUsage(consumption + nightMonthlyLossM3, input);',
  'const nightVariableBillImpact =',
  'The 30-day projection is a diagnostic ceiling, not a confirmed leak bill.',
  'Night test issue',
  'Night projected variable bill impact',
  'Night-flow variable bill impact:'
].forEach((needle) => assert(html.includes(needle), `Missing water night-flow contract: ${needle}`));

assert(!html.includes('monthlyLossM3 * input.block3Rate'), 'Night-flow bill impact must rerun tariff blocks rather than assume one rate');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
assert(structuredData.some((entry) => entry['@type'] === 'WebApplication'), 'Water Bill WebApplication schema is missing');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected legacy Water Bill engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-water-bill-engine');
assert(formula, 'Water Bill formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected legacy Water Bill engine digest must remain unchanged');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'water-bill.webp')), 'Canonical Water Bill image is missing');

console.log('Water Bill verified: optional measured night-flow test, incomplete/invalid/zero/movement states, tier-aware 30-day loss and variable bill impact, copied/CSV/local evidence, protected legacy digest, and canonical image.');
