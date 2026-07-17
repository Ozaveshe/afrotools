#!/usr/bin/env node
/**
 * HR & Payroll source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/hr-payroll/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * HR & Payroll carries statutory, legally-binding numbers: employer social
 * security contribution rates and — the perishable part — the earnings CEILINGS
 * those rates sit on (NSSF Tier I/II limits, pension caps, health-insurance
 * bands). Kenya's NSSF upper limit alone has stepped up every February since
 * 2024 (KES 18,000 -> 36,000 -> 72,000 -> 108,000). A cap left stale silently
 * under-states every employer cost above the old ceiling. This binds the social
 * security bodies we can cite and records the rest as explicit, named gaps.
 *
 *   node scripts/update-hr-payroll-source-ledger.js           # report
 *   node scripts/update-hr-payroll-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason
 * a contribution rate or a ceiling changes — read the gazette / the body's
 * published rate schedule, per .claude/rules/hr-payroll.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'hr-payroll', 'official-sources.json');
const DATASET = path.join(ROOT, 'data', 'hr', 'employer-cost-data.js');
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
    return new Function(`${src}; return EMPLOYER_COST_RULES;`)();
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

const markets = Object.keys(data);
const marketSet = new Set(markets);
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
  if (s.country && s.country !== 'ALL' && !marketSet.has(s.country)) {
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
  if (s.country === 'ALL') markets.forEach((c) => covered.add(c));
  else covered.add(s.country);
}
const gapCountries = new Set(((ledger.gaps || {}).bodiesWithoutUrl || []).map((g) => g.country));
for (const cc of markets) {
  if (!covered.has(cc) && !gapCountries.has(cc)) {
    errors.push(`Market ${cc} (${data[cc].name}) has neither a source nor a recorded gap.`);
  }
}

// A body gap must name what it is missing, or it is just a to-do.
for (const g of ((ledger.gaps || {}).bodiesWithoutUrl || [])) {
  if (!g.country || !g.authority) errors.push('gaps.bodiesWithoutUrl entry missing country/authority.');
  else if (!marketSet.has(g.country)) errors.push(`gaps.bodiesWithoutUrl: ${g.country} is not in the dataset.`);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.bodiesWithoutUrl ${g.country}: must say which fields it needs.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// A market must not be both sourced and listed as a body gap.
for (const cc of gapCountries) {
  if (covered.has(cc)) errors.push(`Market ${cc} is both sourced and listed as a body gap.`);
}

// Freshness: the ledger names the ceilings it has verified against a source and
// the date. Warn when a verified ceiling is older than the review cadence — a
// statutory cap that has not been re-read in a year is a planning-grade number.
const cadence = ledger.reviewCadenceDays || 365;
for (const v of (ledger.verifiedCeilings || [])) {
  if (!v.country || !v.field || !v.verified) {
    errors.push('verifiedCeilings entry needs country, field and verified date.');
    continue;
  }
  if (!marketSet.has(v.country)) errors.push(`verifiedCeilings: ${v.country} not in dataset.`);
  const age = daysSince(v.verified);
  if (age === null) errors.push(`verifiedCeilings ${v.country}/${v.field}: unparseable verified date ${v.verified}.`);
  else if (age > cadence) {
    warnings.push(`${v.country} ${v.field} last verified ${v.verified} (${age} days ago), past reviewCadenceDays ${cadence}. Re-read the source before trusting the ceiling.`);
  }
}

const regulators = sources.filter((s) => ['social-security', 'regulator', 'revenue'].includes(s.sourceType));
const regulatorCountries = new Set(regulators.map((s) => s.country));
const marketCount = markets.length;
if (regulatorCountries.size < marketCount) {
  warnings.push(
    `${marketCount - regulatorCountries.size} of ${marketCount} markets carry an employer contribution rate with no bound official body (recorded in gaps.bodiesWithoutUrl).`
  );
}

console.log('HR & Payroll source ledger');
console.log(`  sources            : ${sources.length} (${regulators.length} official body, ${sources.length - regulators.length} other)`);
console.log(`  markets in dataset : ${marketCount}`);
console.log(`  markets sourced    : ${regulatorCountries.size}`);
console.log(`  verified ceilings  : ${(ledger.verifiedCeilings || []).length}`);
console.log(`  recorded gaps      : ${((ledger.gaps || {}).bodiesWithoutUrl || []).length} body, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced claim class(es)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nHR & Payroll source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  HR & Payroll source ledger valid.');
if (check && warnings.length) {
  // Warnings are staleness signals, not contract breaks. --check surfaces them
  // without failing the build, so a stale ceiling never blocks a deploy that is
  // unrelated to HR & Payroll.
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
