#!/usr/bin/env node
/**
 * Trade & Customs source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/trade/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * Trade carries HIGH-stakes public numbers -- import duty rates, CET bands, VAT
 * and levies, AfCFTA/regional preference offers and rules of origin -- and, like
 * energy before July 2026, had no ledger. The per-country customs authority name
 * already lived in data/trade/country-duty-rates.js but was never bound to the
 * numbers it justifies. This binds the authorities we can cite (national customs
 * bodies + regional secretariats) and records the rest as explicit, named gaps.
 *
 *   node scripts/update-trade-source-ledger.js           # report
 *   node scripts/update-trade-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason a
 * duty rate, CET band or VAT rate changes -- read the tariff schedule or gazette,
 * per .claude/rules/government.md. A Finance Act is the usual real trigger.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'trade', 'official-sources.json');
const DATASET = path.join(ROOT, 'data', 'trade', 'country-duty-rates.js');
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

// country-duty-rates.js is the reference market set: the countries whose duty,
// VAT and levy figures the hub actually publishes and must be able to justify.
function readDataset() {
  try {
    const src = fs.readFileSync(DATASET, 'utf8');
    return new Function(`${src}; return COUNTRY_DUTY_RATES;`)();
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
const rates = readDataset();
if (!ledger || !rates) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const markets = Object.keys(rates);
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
  // A national customs source must name a market that actually exists in the
  // duty dataset. Regional secretariats and global references use country=ALL.
  if (s.country && s.country !== 'ALL' && !rates[s.country]) {
    errors.push(`${s.id}: country ${s.country} is not in country-duty-rates.js.`);
  }
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!(ledger.tools || []).includes(t)) errors.push(`${s.id}: references unknown tool "${t}"`);
    }
  }
  if (!Array.isArray(s.fields) || !s.fields.length) {
    errors.push(`${s.id}: must list at least one field it evidences.`);
  }
}

// Every market in the duty dataset must be reachable from the ledger, either via
// a national customs source or via an explicit, recorded gap. Silence is the
// failure mode we care about: an unsourced market that nobody wrote down.
const covered = new Set(
  sources.filter((s) => s.country !== 'ALL').map((s) => s.country)
);
const gapCountries = new Set(((ledger.gaps || {}).authoritiesWithoutUrl || []).map((g) => g.country));
for (const cc of markets) {
  if (!covered.has(cc) && !gapCountries.has(cc)) {
    errors.push(`Market ${cc} has neither a customs source nor a recorded gap.`);
  }
}

// A customs gap must name what it is missing, or it is just a to-do.
for (const g of ((ledger.gaps || {}).authoritiesWithoutUrl || [])) {
  if (!g.country || !g.authority) errors.push('gaps.authoritiesWithoutUrl entry missing country/authority.');
  else if (!rates[g.country]) errors.push(`gaps.authoritiesWithoutUrl: ${g.country} is not in country-duty-rates.js.`);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.authoritiesWithoutUrl ${g.country}: must say which fields it needs.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// A market must not be both sourced and listed as an unsourced customs gap.
for (const cc of gapCountries) {
  if (covered.has(cc)) errors.push(`Market ${cc} is both sourced and listed as a customs gap.`);
}

// Freshness of the duty dataset. country-duty-rates.js carries no per-figure
// date, so the ledger's own datasetReviewed stamp is the floor.
const stamp = ledger.datasetReviewed;
const age = stamp ? daysSince(stamp) : null;
if (age === null) {
  errors.push('Ledger has no parseable datasetReviewed stamp.');
} else if (age > (ledger.reviewCadenceDays || 120)) {
  warnings.push(`datasetReviewed ${stamp} is ${age} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}. Duty/VAT/levy figures should be shown as planning-grade, not current.`);
} else if (age > (ledger.highRiskCadenceDays || 45)) {
  warnings.push(`datasetReviewed ${stamp} is ${age} days old, past highRiskCadenceDays ${ledger.highRiskCadenceDays}. Duty and CET figures should be shown as planning-grade.`);
}

const customs = sources.filter((s) => s.sourceType === 'customs-authority');
const secretariats = sources.filter((s) => s.sourceType === 'secretariat');
const customsCountries = new Set(customs.map((s) => s.country));
if (customsCountries.size < markets.length) {
  warnings.push(
    `${markets.length - customsCountries.size} of ${markets.length} duty-rate markets have no bound customs-authority source (recorded in gaps.authoritiesWithoutUrl).`
  );
}

console.log('Trade & Customs source ledger');
console.log(`  sources            : ${sources.length} (${customs.length} customs authority, ${secretariats.length} regional secretariat, ${sources.length - customs.length - secretariats.length} reference)`);
console.log(`  duty-rate markets  : ${markets.length}`);
console.log(`  markets sourced    : ${customsCountries.size}`);
console.log(`  dataset reviewed   : ${stamp}${age === null ? '' : ` (${age} days old)`}`);
console.log(`  recorded gaps      : ${((ledger.gaps || {}).authoritiesWithoutUrl || []).length} customs, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced claim class(es)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nTrade source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Trade source ledger valid.');
if (check && warnings.length) {
  // Warnings are staleness signals, not contract breaks. --check surfaces them
  // without failing the build, so a stale stamp never blocks an unrelated deploy.
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
