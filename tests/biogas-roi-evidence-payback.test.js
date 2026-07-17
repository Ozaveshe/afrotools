'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'tools', 'biogas-roi', 'index.html');
const engineFile = path.join(root, 'engines', 'biogas-roi-engine.js');
const html = fs.readFileSync(file, 'utf8');

[
  'Quote-backed payback inputs',
  'Only count benefits you can support.',
  'id="installedCost"',
  'id="lpgPricePerKg"',
  'id="verifiedSlurryValue"',
  'id="annualMaintenance"',
  'id="evidenceConfirmed"',
  'id="rEvidenceStatus"',
  'id="rLPGAvoided"',
  'Evidence-adjusted net payback',
  'var requiredGas=cookingHours*0.25;',
  'var coverage=requiredGas>0?Math.min(1,dailyGas/requiredGas):0;',
  'var fullLpgNeedKg=requiredGas>0?(30*requiredGas*6/13.7):0;',
  'var avoidedLpgKg=fullLpgNeedKg*coverage;',
  'Number.isFinite(data.lpg.perKg)?data.lpg.perKg:data.lpg.pricePerKg',
  'var annualNetBenefit=annualLpgSaving+(verifiedSlurryValue*12)-annualMaintenance;',
  'Bioslurry contributes zero to payback until a verified monthly value is entered.',
  'afrotools-biogas-roi-result',
  'Inputs changed — calculate again to refresh coverage and payback.',
  'Math.round(co2ScreenKg).toLocaleString()+" kg — 3 kg/kg LPG planning factor"',
  'https://openknowledge.fao.org/3/i8017en/I8017EN.pdf',
  'https://documents1.worldbank.org/curated/en/701271468340801242/pdf/esm3000051Biomass0Energy01PUBLIC1.pdf',
  'Reviewed 14 July 2026',
  'dateModified":"2026-07-14"'
].forEach((needle) => assert(html.includes(needle), `Missing Biogas evidence-payback contract: ${needle}`));

assert(!html.includes('document.getElementById("rLPGSaving").textContent=r.monthlySaving'), 'Page must not display the legacy full-demand LPG saving');
assert(!html.includes('document.getElementById("rSlurry").textContent=r.monthlySlurryValue'), 'Page must not display the legacy speculative bioslurry value');
assert(!html.includes('alert(r.error)'), 'Biogas validation must use accessible inline status instead of alert');
assert(html.includes('appearance:auto!important'), 'Biogas evidence checkbox needs an explicit visible checkbox override');

const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const appSchema = structuredData.find((entry) => entry['@type'] === 'WebApplication');
assert(appSchema, 'Biogas ROI WebApplication schema is missing');
assert.strictEqual(appSchema.dateModified, '2026-07-14', 'Biogas ROI schema freshness is stale');

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match) => acorn.parse(match[1], { ecmaVersion: 'latest', sourceType: 'script' }));

assert(fs.existsSync(engineFile), 'Protected Biogas ROI engine is missing');
const digest = crypto.createHash('sha256').update(fs.readFileSync(engineFile)).digest('hex');
const formulaRegistry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'calculation-quality', 'formula-registry.json'), 'utf8'));
const formula = formulaRegistry.formulas.find((entry) => entry.id === 'formula-engines-biogas-roi-engine');
assert(formula, 'Biogas ROI formula registry entry is missing');
assert.strictEqual(formula.artifactDigest, `sha256:${digest}`, 'Protected Biogas ROI engine digest must remain unchanged');
assert(fs.existsSync(path.join(root, 'assets', 'img', 'tools', 'biogas-roi.webp')), 'Canonical Biogas ROI image is missing');

console.log('Biogas ROI verified: coverage-capped LPG displacement, zero-default slurry, quote and O&M evidence gate, net payback, stale-result guard, source links, protected engine digest, and canonical image.');
