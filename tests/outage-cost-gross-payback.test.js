'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'outage-cost', 'index.html');
const engineFile = path.join(root, 'engines', 'outage-cost-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Gross avoidable loss / month',
  'id="avoidableFormula"',
  'id="avoidableResult"',
  'id="recommendationText"',
  'Proposed backup capital cost',
  'Do not include recurring running costs here.',
  'var avoidableBase = lostRevenue + staffCost + riskCost;',
  'var avoidableRecovery = avoidableBase * recoveryBufferPct;',
  'var avoidableIncidentLoss = avoidableBase + avoidableRecovery;',
  'Current backup running cost and its recovery markup are excluded from that saving.',
  'only if it eliminates all modeled residual losses',
  'Payback boundary: before financing, maintenance, replacement energy, taxes, and coverage gaps.',
  '["gross_avoidable_loss_per_incident",round(report.avoidableIncidentLoss,2)]',
  '["gross_avoidable_loss_per_month",round(report.breakEvenBudget,2)]',
  '["gross_estimated_payback_months",round(report.paybackMonths,2)]',
  '<time datetime="2026-07-14">14 July 2026</time>'
].forEach((needle) => assert(html.includes(needle), `Missing outage investment contract: ${needle}`));

assert(!html.includes('lostRevenue + staffCost + riskCost + recoveryBuffer'), 'Gross avoidable loss must not include the recovery markup on current backup operation');
assert(!html.includes('Break-even backup budget equals monthly outage exposure'), 'Outdated payback methodology copy must be removed');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const appSchema = structuredData.find((entry) => entry['@type'] === 'WebApplication');
assert(appSchema, 'Outage Cost WebApplication schema is missing');
assert.strictEqual(appSchema.dateModified, '2026-07-14', 'Outage Cost schema freshness is stale');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected legacy Outage Cost engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-outage-cost-engine');
assert(formula, 'Outage Cost formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected legacy Outage Cost engine digest must remain unchanged');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'outage-cost.webp')), 'Canonical Outage Cost image is missing');

console.log('Outage Cost verified: gross avoidable-loss ledger, current backup cost exclusion, bounded capital payback, copied/CSV/local evidence, inline investment icon, protected legacy digest, and canonical image.');
