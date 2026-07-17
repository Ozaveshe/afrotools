#!/usr/bin/env node
/**
 * Energy source ledger.
 *
 * Mirrors scripts/update-telecom-source-ledger.js and
 * scripts/update-government-source-ledger.js: validates that
 * data/energy/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * Energy carries the site's most price-perishable public numbers -- electricity
 * tariffs, petrol/diesel/kerosene pump prices, LPG cylinder prices, water
 * tariffs and solar kit costs -- and, unlike government, transport and telecom,
 * had no ledger at all until now. The per-country regulator name already lived
 * in data/energy/country-energy-index.js but was never bound to the numbers it
 * was supposed to justify. This binds the regulators we can cite and records
 * the rest as explicit, named gaps.
 *
 *   node scripts/update-energy-source-ledger.js           # report
 *   node scripts/update-energy-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason
 * a tariff or a pump price changes -- read the gazetted notice, per
 * .claude/rules/government.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'energy', 'official-sources.json');
const DATASET = path.join(ROOT, 'data', 'energy', 'country-energy-index.js');
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
    return new Function(`${src}; return ENERGY_DATA;`)();
  } catch (e) {
    errors.push(`Cannot load ${path.relative(ROOT, DATASET)}: ${e.message}`);
    return null;
  }
}

function daysSince(iso) {
  // Accept YYYY-MM or YYYY-MM-DD; a month-only stamp counts from the 1st.
  const norm = /^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso;
  const then = Date.parse(`${norm}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

const ledger = readLedger();
const data = readDataset();
if (!ledger || !data) {
  console.error(errors.join('\n'));
  process.exit(1);
}

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
  if (s.country && s.country !== 'ALL' && !data.countries[s.country]) {
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
  if (s.country === 'ALL') Object.keys(data.countries).forEach((c) => covered.add(c));
  else covered.add(s.country);
}
const gapCountries = new Set(((ledger.gaps || {}).regulatorsWithoutUrl || []).map((g) => g.country));
for (const cc of Object.keys(data.countries)) {
  if (!covered.has(cc) && !gapCountries.has(cc)) {
    errors.push(`Market ${cc} has neither a source nor a recorded gap.`);
  }
}

// A regulator gap must name what it is missing, or it is just a to-do.
for (const g of ((ledger.gaps || {}).regulatorsWithoutUrl || [])) {
  if (!g.country || !g.authority) errors.push('gaps.regulatorsWithoutUrl entry missing country/authority.');
  else if (!data.countries[g.country]) errors.push(`gaps.regulatorsWithoutUrl: ${g.country} is not in the dataset.`);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.regulatorsWithoutUrl ${g.country}: must say which fields it needs.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// A market must not be both sourced and listed as an unsourced regulator gap.
for (const cc of gapCountries) {
  if (covered.has(cc)) errors.push(`Market ${cc} is both sourced and listed as a regulator gap.`);
}

// Freshness of the dataset itself.
const age = data.lastUpdated ? daysSince(data.lastUpdated) : null;
if (age === null) {
  errors.push('country-energy-index.js has no parseable lastUpdated.');
} else if (age > (ledger.reviewCadenceDays || 90)) {
  warnings.push(`Dataset stamp ${data.lastUpdated} is ${age} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}. Prices should be shown as planning-grade, not current.`);
} else if (age > (ledger.highRiskCadenceDays || 30)) {
  warnings.push(`Dataset stamp ${data.lastUpdated} is ${age} days old, past highRiskCadenceDays ${ledger.highRiskCadenceDays}. Fuel and tariff figures should be shown as planning-grade.`);
}

const regulators = sources.filter((s) => s.sourceType === 'regulator');
const regulatorCountries = new Set(regulators.map((s) => s.country));
const marketCount = Object.keys(data.countries).length;
if (regulatorCountries.size < marketCount) {
  warnings.push(
    `${marketCount - regulatorCountries.size} of ${marketCount} markets publish an electricity tariff with no bound regulator source (recorded in gaps.regulatorsWithoutUrl).`
  );
}

console.log('Energy source ledger');
console.log(`  sources            : ${sources.length} (${regulators.length} regulator, ${sources.length - regulators.length} other)`);
console.log(`  markets in dataset : ${marketCount}`);
console.log(`  markets sourced    : ${regulatorCountries.size}`);
console.log(`  dataset stamp      : ${data.lastUpdated}${age === null ? '' : ` (${age} days old)`}`);
console.log(`  recorded gaps      : ${((ledger.gaps || {}).regulatorsWithoutUrl || []).length} regulator, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced claim class(es)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nEnergy source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Energy source ledger valid.');
if (check && warnings.length) {
  // Warnings are staleness signals, not contract breaks. --check surfaces them
  // without failing the build, so a stale stamp never blocks a deploy that is
  // unrelated to energy.
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
