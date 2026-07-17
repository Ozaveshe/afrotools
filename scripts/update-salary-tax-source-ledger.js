#!/usr/bin/env node
/**
 * Salary & Income Tax source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/salary-tax/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * Salary & Income Tax carries the site's highest-stakes legal figures -- PAYE
 * bands, personal reliefs, tax-free thresholds and statutory deduction rates
 * (NSSF, SHIF/NHIF, pension, social security). These change with each country's
 * finance act, not on a calendar. The revenue authority (KRA, FIRS, SARS, GRA,
 * URA, TRA, ...) was already named on many PAYE pages; this binds the ones we
 * can cite and records the rest as explicit, named gaps.
 *
 *   node scripts/update-salary-tax-source-ledger.js           # report
 *   node scripts/update-salary-tax-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason
 * a band or a relief changes -- read the gazetted Act, per
 * .claude/rules/salary-tax.md and .claude/rules/government.md.
 *
 * Unlike the energy ledger, this validator is self-contained: the list of 54
 * markets lives in the ledger's own `markets` array, so there is no fragile
 * parse of a per-country dataset. The PAYE band data is spread across per-page
 * engines and engines/francophone-paye-engine.js, which have no single machine
 * -readable index.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'salary-tax', 'official-sources.json');
const check = process.argv.includes('--check');

const errors = [];
const warnings = [];

let ledger;
try {
  ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
} catch (e) {
  console.error(`Cannot read ${path.relative(ROOT, LEDGER)}: ${e.message}`);
  process.exit(1);
}

function daysSince(iso) {
  // Accept YYYY-MM or YYYY-MM-DD; a month-only stamp counts from the 1st.
  if (!iso) return null;
  const norm = /^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso;
  const then = Date.parse(`${norm}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

const markets = Array.isArray(ledger.markets) ? ledger.markets : [];
if (!markets.length) errors.push('ledger.markets is empty; it must list every ISO market this hub covers.');
const marketSet = new Set(markets);
if (marketSet.size !== markets.length) errors.push('ledger.markets contains duplicate country codes.');

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
    errors.push(`${s.id}: country ${s.country} is not in ledger.markets.`);
  }
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!(ledger.tools || []).includes(t)) errors.push(`${s.id}: references unknown tool "${t}"`);
    }
  }
}

// Every market must be reachable from the ledger: either it has a bound source,
// or it is recorded as an explicit gap. Silence is the failure mode we care about
// -- an unsourced market that nobody wrote down.
const covered = new Set();
for (const s of sources) {
  if (s.country === 'ALL') markets.forEach((c) => covered.add(c));
  else covered.add(s.country);
}
const gaps = (ledger.gaps || {}).revenueAuthoritiesWithoutUrl || [];
const gapCountries = new Set(gaps.map((g) => g.country));

for (const cc of markets) {
  if (!covered.has(cc) && !gapCountries.has(cc)) {
    errors.push(`Market ${cc} has neither a source nor a recorded gap.`);
  }
}

// A gap must name what it is missing, or it is just a to-do.
for (const g of gaps) {
  if (!g.country || !g.authority) errors.push('gaps.revenueAuthoritiesWithoutUrl entry missing country/authority.');
  else if (!marketSet.has(g.country)) errors.push(`gaps.revenueAuthoritiesWithoutUrl: ${g.country} is not in ledger.markets.`);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.revenueAuthoritiesWithoutUrl ${g.country || '(no country)'}: must say which fields it needs.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// A market must not be both sourced and listed as an unsourced gap.
for (const cc of gapCountries) {
  if (covered.has(cc)) errors.push(`Market ${cc} is both sourced and listed as a revenue-authority gap.`);
}

// Optional ledger-level freshness stamp (the hub has no single dataset stamp).
const age = daysSince(ledger.lastReviewed);
if (ledger.lastReviewed && age === null) {
  errors.push(`ledger.lastReviewed "${ledger.lastReviewed}" is not a parseable date.`);
} else if (age !== null && age > (ledger.reviewCadenceDays || 180)) {
  warnings.push(`Ledger lastReviewed ${ledger.lastReviewed} is ${age} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}. Re-verify bound sources against the gazetted Acts.`);
}

const revAuth = sources.filter((s) => s.sourceType === 'revenue-authority');
const boundCountries = new Set(sources.map((s) => s.country));

console.log('Salary & Income Tax source ledger');
console.log(`  sources            : ${sources.length} (${revAuth.length} revenue-authority, ${sources.length - revAuth.length} other)`);
console.log(`  markets covered    : ${markets.length}`);
console.log(`  markets bound      : ${boundCountries.size}`);
console.log(`  recorded gaps      : ${gaps.length} revenue-authority, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced-claim class(es)`);
if (ledger.lastReviewed) console.log(`  ledger stamp       : ${ledger.lastReviewed}${age === null ? '' : ` (${age} days old)`}`);

if (markets.length && boundCountries.size < markets.length) {
  warnings.push(`${markets.length - boundCountries.size} of ${markets.length} markets have no bound revenue-authority URL (recorded in gaps.revenueAuthoritiesWithoutUrl).`);
}

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nSalary & Income Tax source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Salary & Income Tax source ledger valid.');
if (check && warnings.length) {
  // Warnings are coverage/staleness signals, not contract breaks. --check
  // surfaces them without failing the build, so a stale stamp never blocks a
  // deploy that is unrelated to salary-tax.
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
