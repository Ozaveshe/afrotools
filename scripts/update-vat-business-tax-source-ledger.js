#!/usr/bin/env node
/**
 * VAT & Business Tax source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/vat-business-tax/official-sources.json stays internally consistent and
 * honest about what it cannot evidence.
 *
 * VAT & Business Tax is HIGH-STAKES -- a wrong standard rate or registration
 * threshold flows straight into an invoice or a return. The perishable numbers
 * are the standard VAT/GST rate and the registration threshold per country;
 * they change with each finance act. The reference pack is
 * data/vat-business-tax/pan-african-vat-presets.json. It deliberately carries
 * a rate only for authority-bound planning presets; every other market is an
 * explicit source gap or an unverified no-VAT claim.
 *
 *   node scripts/update-vat-business-tax-source-ledger.js           # report
 *   node scripts/update-vat-business-tax-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason
 * a VAT rate or a threshold changes -- read the gazetted rate or finance-act
 * notice, per .claude/rules/government.md and .claude/rules/vat-business-tax.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'vat-business-tax', 'official-sources.json');
const PRESETS = path.join(ROOT, 'data', 'vat-business-tax', 'pan-african-vat-presets.json');
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

// The preset pack is the product source of truth. The page and widget consume
// the matching shared engine instead of embedding a second 54-market table.
function readPresetPack() {
  try {
    const pack = JSON.parse(fs.readFileSync(PRESETS, 'utf8'));
    if (!pack || !pack.countries || typeof pack.countries !== 'object') {
      errors.push('Pan-African VAT preset pack has no countries object.');
      return null;
    }
    return pack;
  } catch (e) {
    errors.push(`Cannot parse ${path.relative(ROOT, PRESETS)}: ${e.message}`);
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
const presetPack = readPresetPack();
if (!ledger || !presetPack) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const DB = presetPack.countries;
const dbCountries = Object.keys(DB);
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
  if (s.country && s.country !== 'ALL' && !DB[s.country]) {
    errors.push(`${s.id}: country ${s.country} is not in the flagship VAT table.`);
  }
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!(ledger.tools || []).includes(t)) errors.push(`${s.id}: references unknown tool "${t}"`);
    }
  }
}

// Every market in the flagship table must be reachable from the ledger: via a
// bound source, an explicit regulator gap, or the no-VAT list. Silence -- an
// unsourced market nobody wrote down -- is the failure mode we care about.
const covered = new Set();
for (const s of sources) {
  if (s.country === 'ALL') dbCountries.forEach((c) => covered.add(c));
  else covered.add(s.country);
}
const regGaps = (ledger.gaps || {}).regulatorsWithoutUrl || [];
const noVat = (ledger.gaps || {}).noVatSystem || [];
const gapCountries = new Set([...regGaps, ...noVat].map((g) => g.country));

for (const cc of dbCountries) {
  if (!covered.has(cc) && !gapCountries.has(cc)) {
    errors.push(`Market ${cc} has neither a source nor a recorded gap.`);
  }
}

// A no-VAT gap must remain explicitly unverified and must not carry a rate.
// This prevents the product from converting a research gap into a zero-rate
// claim merely because no primary authority source has been bound yet.
for (const g of noVat) {
  if (!g.country || !DB[g.country]) errors.push(`gaps.noVatSystem: ${g.country} is not in the flagship table.`);
  else if (DB[g.country].status !== 'unverified-no-vat-claim' || Object.prototype.hasOwnProperty.call(DB[g.country], 'standardRate')) {
    errors.push(`gaps.noVatSystem: ${g.country} must be an unverified-no-vat-claim without standardRate.`);
  }
}

// A regulator gap must name what it is missing, or it is just a to-do.
for (const g of regGaps) {
  if (!g.country || !g.authority) errors.push('gaps.regulatorsWithoutUrl entry missing country/authority.');
  else if (!DB[g.country]) errors.push(`gaps.regulatorsWithoutUrl: ${g.country} is not in the flagship table.`);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.regulatorsWithoutUrl ${g.country}: must say which fields it needs.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// A market must not be both sourced and listed as a gap.
for (const cc of gapCountries) {
  if (covered.has(cc)) errors.push(`Market ${cc} is both sourced and listed as a gap.`);
}

// Freshness of the reference table's review stamp.
const reviewed = ledger.datasetReviewed;
const age = reviewed ? daysSince(reviewed) : null;
if (reviewed && age === null) {
  errors.push(`datasetReviewed "${reviewed}" is not a parseable date.`);
} else if (age !== null && age > (ledger.reviewCadenceDays || 180)) {
  warnings.push(`Reference table reviewed ${reviewed} is ${age} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}. VAT rates and thresholds should be shown as planning-grade, not current.`);
} else if (age !== null && age > (ledger.highRiskCadenceDays || 90)) {
  warnings.push(`Reference table reviewed ${reviewed} is ${age} days old, past highRiskCadenceDays ${ledger.highRiskCadenceDays}. Re-read each authority's current rate before a client relies on it.`);
}

const revs = sources.filter((s) => s.sourceType === 'revenue-authority');
const revCountries = new Set(revs.map((s) => s.country));
const marketCount = dbCountries.length;
const vatMarkets = dbCountries.filter((c) => DB[c].status !== 'unverified-no-vat-claim').length;
if (revCountries.size < vatMarkets) {
  warnings.push(
    `${vatMarkets - revCountries.size} of ${vatMarkets} VAT/GST markets have no bound revenue-authority source (recorded in gaps.regulatorsWithoutUrl).`
  );
}

console.log('VAT & Business Tax source ledger');
console.log(`  sources             : ${sources.length} (${revs.length} revenue-authority)`);
console.log(`  markets in table    : ${marketCount} (${vatMarkets} with VAT/GST, ${noVat.length} no-VAT)`);
console.log(`  markets sourced     : ${revCountries.size}`);
console.log(`  reference reviewed  : ${reviewed || '(none)'}${age === null ? '' : ` (${age} days old)`}`);
console.log(`  recorded gaps       : ${regGaps.length} regulator, ${noVat.length} no-VAT, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced claim class(es)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nVAT & Business Tax source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  VAT & Business Tax source ledger valid.');
if (check && warnings.length) {
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
