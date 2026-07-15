'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'paygo-solar', 'index.html');
const engineFile = path.join(root, 'engines', 'paygo-solar-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Current spend the kit will replace',
  'id="spendReplacementPct"',
  'Keep coverage and savings separate.',
  'id="displacedFormula"',
  'id="displacedResult"',
  'id="residualFormula"',
  'id="residualResult"',
  'Combined monthly energy cost',
  'Deposit cash-flow recovery',
  'var displacedSpendMonthly = currentSpend * (spendReplacementPct / 100);',
  'var residualSpendMonthly = Math.max(0, currentSpend - displacedSpendMonthly);',
  'var combinedMonthlyCost = monthlyCommitment + residualSpendMonthly;',
  'var combinedTermCost = totalPaid + residualSpendTerm;',
  'var termSavings = baselineCost - combinedTermCost;',
  'var paybackMonths = deposit > 0 && monthlySavings > 0 ? deposit / monthlySavings : 0;',
  'var p = Math.pow(10, places == null ? 2 : places);',
  'PayGo commitment plus residual energy spend is higher than current monthly energy spend.',
  'the kit\'s " + round(Math.min(100, coveragePct), 0) + "% energy coverage',
  'Current spend replaced: ',
  'Combined energy cost over term: ',
  '<time datetime="2026-07-14">14 July 2026</time>'
].forEach((needle) => assert(html.includes(needle), `Missing PayGo spend-displacement contract: ${needle}`));

assert(!html.includes('var termSavings = baselineCost - totalPaid;'), 'PayGo term savings must include residual current energy spend');
assert(!html.includes('var paybackMonths = currentSpend > 0 ? totalPaid / currentSpend : 0;'), 'PayGo payback must not treat all current spend as displaced');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const appSchema = structuredData.find((entry) => entry['@type'] === 'WebApplication');
assert(appSchema, 'PayGo Solar WebApplication schema is missing');
assert.strictEqual(appSchema.dateModified, '2026-07-14', 'PayGo Solar schema freshness is stale');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected legacy PayGo Solar engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-paygo-solar-engine');
assert(formula, 'PayGo Solar formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected legacy PayGo Solar engine digest must remain unchanged');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'paygo-solar.webp')), 'Canonical PayGo Solar image is missing');

console.log('PayGo Solar verified: separate load coverage and spend displacement, residual cost, combined monthly and term cost, cash-flow deposit recovery, evidence flag, exports, protected legacy digest, and canonical image.');
