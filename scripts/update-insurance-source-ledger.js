#!/usr/bin/env node
/**
 * Insurance source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/insurance/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * Insurance carries perishable public numbers -- motor third-party tariffs,
 * comprehensive rate bands, statutory health-fund contribution rates,
 * workers-comp rates and penetration figures -- and, unlike government,
 * transport, telecom and energy, had no ledger at all until now. The
 * per-country regulator name already lived in
 * data/insurance/country-insurance-index.js but was never bound to the numbers
 * it was supposed to justify. This binds the regulators we can cite and records
 * the rest as explicit, named gaps.
 *
 *   node scripts/update-insurance-source-ledger.js           # report
 *   node scripts/update-insurance-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason
 * a tariff or a contribution rate changes -- read the gazetted circular or CIMA
 * code article, per .claude/rules/government.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'insurance', 'official-sources.json');
const DATASET = path.join(ROOT, 'data', 'insurance', 'country-insurance-index.js');
const FALLBACK_STAMP = path.join(ROOT, 'data', 'insurance-data.json');
const check = process.argv.includes('--check');

const errors = [];
const warnings = [];

function readLedger() {
  try {
    return JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  } catch (e) {
    errors.push(`Cannot read ${path.relative(ROOT, LEDGER)}: ${e.message}`);
    return null;
  }
}

function readDataset() {
  try {
    const src = fs.readFileSync(DATASET, 'utf8');
    const sandbox = { window: {} };
    new Function('window', src)(sandbox.window);
    return sandbox.window.AfroTools && sandbox.window.AfroTools.insuranceData;
  } catch (e) {
    errors.push(`Cannot load ${path.relative(ROOT, DATASET)}: ${e.message}`);
    return null;
  }
}

function readFallbackStamp() {
  try {
    const j = JSON.parse(fs.readFileSync(FALLBACK_STAMP, 'utf8'));
    return j && j._metadata && j._metadata.lastUpdated;
  } catch (e) {
    return null;
  }
}

function daysSince(iso) {
  const norm = /^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso;
  const then = Date.parse(`${norm}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

const ledger = readLedger();
const data = readDataset();
if (!ledger || !data || !data.countries) {
  console.error(errors.join('\n') || 'Insurance dataset has no countries.');
  process.exit(1);
}

const countries = data.countries;
const sources = ledger.sources || [];
const ids = new Set();

for (const s of sources) {
  if (!s.id) errors.push('Source with no id.');
  else if (ids.has(s.id)) errors.push(`Duplicate source id: ${s.id}`);
  else ids.add(s.id);

  for (const field of ['country', 'authority', 'title', 'url', 'sourceType', 'fields']) {
    if (!s[field]) errors.push(`${s.id || '(no id)'}: missing ${field}`);
  }
  if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${s.id}: url is not absolute (${s.url})`);
  if (s.country && s.country !== 'ALL' && !countries[s.country]) {
    errors.push(`${s.id}: country ${s.country} is not in the dataset.`);
  }
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!(ledger.tools || []).includes(t)) errors.push(`${s.id}: references unknown tool "${t}"`);
    }
  }
}

// Every market in the dataset should be reachable from the ledger, either via a
// source or via an explicit, recorded gap. Silence is the failure mode we care
// about: an unsourced market that nobody wrote down.
const covered = new Set();
for (const s of sources) {
  if (s.country === 'ALL') Object.keys(countries).forEach((c) => covered.add(c));
  else covered.add(s.country);
}
const gapCountries = new Set(((ledger.gaps || {}).regulatorsWithoutUrl || []).map((g) => g.country));
for (const cc of Object.keys(countries)) {
  if (!covered.has(cc) && !gapCountries.has(cc)) {
    errors.push(`Market ${cc} has neither a source nor a recorded gap.`);
  }
}

// A regulator gap must name what it is missing, or it is just a to-do.
for (const g of ((ledger.gaps || {}).regulatorsWithoutUrl || [])) {
  if (!g.country || !g.authority) errors.push('gaps.regulatorsWithoutUrl entry missing country/authority.');
  else if (!countries[g.country]) errors.push(`gaps.regulatorsWithoutUrl: ${g.country} is not in the dataset.`);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.regulatorsWithoutUrl ${g.country}: must say which fields it needs.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// A verified figure must name what was read, when, and from which bound source.
// This is the only place a number may be presented as current rather than
// planning-grade, so the provenance has to be checkable.
const verified = ledger.verifiedFigures || [];
for (const f of verified) {
  if (!f.country || !f.field || !f.value || !f.verified || !f.sourceId) {
    errors.push('verifiedFigures entry needs country, field, value, verified (date) and sourceId.');
    continue;
  }
  if (!countries[f.country]) errors.push(`verifiedFigures: ${f.country} is not in the dataset.`);
  if (!ids.has(f.sourceId)) errors.push(`verifiedFigures ${f.country}/${f.field}: sourceId "${f.sourceId}" is not a known source.`);
  const fAge = daysSince(f.verified);
  if (fAge === null) errors.push(`verifiedFigures ${f.country}/${f.field}: verified date "${f.verified}" is not parseable.`);
  else if (fAge > (ledger.reviewCadenceDays || 180)) {
    warnings.push(`verifiedFigures ${f.country}/${f.field} was verified ${fAge} days ago, past reviewCadenceDays ${ledger.reviewCadenceDays}. Re-read the source before presenting it as current.`);
  }
}

// A market must not be both sourced and listed as an unsourced regulator gap.
for (const cc of gapCountries) {
  if (covered.has(cc)) errors.push(`Market ${cc} is both sourced and listed as a regulator gap.`);
}

// Freshness. The calculator seed carries no stamp, so fall back to the curated
// insurance-data.json metadata date (recorded in the ledger).
const stamp = data.lastUpdated || readFallbackStamp();
const age = stamp ? daysSince(stamp) : null;
if (!data.lastUpdated) {
  warnings.push('country-insurance-index.js has no lastUpdated stamp; freshness tracked against data/insurance-data.json (see gaps.unsourcedClaims dataset.lastUpdated).');
}
if (age === null) {
  warnings.push('No parseable freshness stamp found for the insurance dataset.');
} else if (age > (ledger.reviewCadenceDays || 180)) {
  warnings.push(`Insurance dataset stamp ${stamp} is ${age} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}. Premiums should be shown as planning-grade, not current.`);
} else if (age > (ledger.highRiskCadenceDays || 60)) {
  warnings.push(`Insurance dataset stamp ${stamp} is ${age} days old, past highRiskCadenceDays ${ledger.highRiskCadenceDays}. Motor tariff and contribution figures should be shown as planning-grade.`);
}

const regulators = sources.filter((s) => s.sourceType === 'regulator');
const regulatorCountries = new Set(regulators.map((s) => s.country));
const marketCount = Object.keys(countries).length;
if (regulatorCountries.size < marketCount) {
  warnings.push(
    `${marketCount - regulatorCountries.size} of ${marketCount} markets publish an insurance premium with no bound regulator source (recorded in gaps.regulatorsWithoutUrl).`
  );
}

console.log('Insurance source ledger');
console.log(`  sources            : ${sources.length} (${regulators.length} regulator, ${sources.length - regulators.length} other)`);
console.log(`  markets in dataset : ${marketCount}`);
console.log(`  markets sourced    : ${regulatorCountries.size}`);
console.log(`  freshness stamp    : ${stamp || '(none)'}${age === null ? '' : ` (${age} days old)`}`);
console.log(`  recorded gaps      : ${((ledger.gaps || {}).regulatorsWithoutUrl || []).length} regulator, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced claim class(es)`);
console.log(`  verified figures   : ${verified.length} (read from a bound source, with a date)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nInsurance source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Insurance source ledger valid.');
if (check && warnings.length) {
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
