#!/usr/bin/env node
/**
 * Fintech source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/fintech/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * Fintech is different from energy/telecom in one way: it has no single country
 * dataset file. Each of the 32 tools embeds its own data (per-country option
 * attributes or an in-page provider table), and mid-market FX is now pulled live
 * from the shared forex feed. So this ledger binds sources by CLASS OF CLAIM
 * (FX feed, central-bank policy/T-bill benchmarks) and records commercial
 * provider pricing as unsourced by design -- exactly as energy records solar-kit
 * prices. The validator therefore checks internal consistency, the honesty of
 * the gaps block, and the freshness of the shared FX feed, rather than
 * cross-checking a dataset.
 *
 *   node scripts/update-fintech-source-ledger.js           # report
 *   node scripts/update-fintech-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason
 * a benchmark rate, fee, APR or FX figure changes -- read the gazetted rate
 * notice or auction result, per .claude/rules/government.md and
 * .claude/rules/energy.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'fintech', 'official-sources.json');
const FX_FILE = path.join(ROOT, 'data', 'forex', 'latest.json');
const check = process.argv.includes('--check');

const errors = [];
const warnings = [];

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`Cannot read ${label} (${path.relative(ROOT, file)}): ${e.message}`);
    return null;
  }
}

function daysSince(iso) {
  // Accept YYYY-MM, YYYY-MM-DD, or a full ISO timestamp.
  const norm = /^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso;
  const then = Date.parse(/T/.test(norm) ? norm : `${norm}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

const ledger = readJson(LEDGER, 'ledger');
if (!ledger) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const sources = ledger.sources || [];
const tools = ledger.tools || [];
const toolSet = new Set(tools);
const ids = new Set();

for (const s of sources) {
  if (!s.id) errors.push('Source with no id.');
  else if (ids.has(s.id)) errors.push(`Duplicate source id: ${s.id}`);
  else ids.add(s.id);

  for (const field of ['country', 'authority', 'title', 'url', 'sourceType', 'fields']) {
    if (!s[field]) errors.push(`${s.id || '(no id)'}: missing ${field}`);
  }
  if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${s.id}: url is not absolute (${s.url})`);
  if (s.country && s.country !== 'ALL' && !/^[A-Z]{2}$/.test(s.country)) {
    errors.push(`${s.id}: country must be a 2-letter ISO code or ALL (got "${s.country}")`);
  }
  if (Array.isArray(s.fields) && !s.fields.length) errors.push(`${s.id}: fields is empty`);
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!toolSet.has(t)) errors.push(`${s.id}: references unknown tool "${t}"`);
    }
  }
}

// The shared FX feed must be a real, bound source -- it is the one perishable
// class that IS sourced, so silence here would be dishonest.
if (!sources.some((s) => (s.fields || []).some((f) => /^fx\./.test(f)))) {
  errors.push('No source binds a fx.* field. The live forex feed must be recorded as a source.');
}

// Gap honesty: a regulator gap must name what it is missing, or it is a to-do.
const gapCountries = new Set();
for (const g of ((ledger.gaps || {}).regulatorsWithoutUrl || [])) {
  if (!g.country || !g.authority) errors.push('gaps.regulatorsWithoutUrl entry missing country/authority.');
  else if (!/^[A-Z]{2}$/.test(g.country)) errors.push(`gaps.regulatorsWithoutUrl: "${g.country}" is not a 2-letter ISO code.`);
  else gapCountries.add(g.country);
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.regulatorsWithoutUrl ${g.country || '(no country)'}: must say which fields it needs.`);
  }
  if (!g.why) warnings.push(`gaps.regulatorsWithoutUrl ${g.country}: no "why" recorded.`);
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
  for (const t of (u.tools || [])) {
    if (!toolSet.has(t)) errors.push(`unsourcedClaims ${u.field}: references unknown tool "${t}"`);
  }
}

// A market must not be both bound to a central-bank source and listed as a
// regulator gap -- that would be claiming and disclaiming the same thing.
const sourcedCountries = new Set(sources.filter((s) => s.country !== 'ALL').map((s) => s.country));
for (const cc of gapCountries) {
  if (sourcedCountries.has(cc)) errors.push(`Market ${cc} is both bound to a source and listed as a regulator gap.`);
}

// Freshness: the ledger's own review stamp, and the shared FX feed (high-risk).
const ledgerAge = ledger.lastReviewed ? daysSince(ledger.lastReviewed) : null;
if (ledgerAge === null) {
  warnings.push('Ledger has no parseable lastReviewed stamp.');
} else if (ledgerAge > (ledger.reviewCadenceDays || 90)) {
  warnings.push(`Ledger lastReviewed ${ledger.lastReviewed} is ${ledgerAge} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}.`);
}

const fx = readJson(FX_FILE, 'forex feed');
let fxAge = null;
if (fx) {
  const stamp = fx.timestamp || fx.date || '';
  fxAge = stamp ? daysSince(stamp) : null;
  if (fxAge === null) {
    warnings.push('Forex feed has no parseable timestamp.');
  } else if (fxAge > (ledger.highRiskCadenceDays || 30)) {
    warnings.push(`Forex feed ${stamp} is ${fxAge} days old, past highRiskCadenceDays ${ledger.highRiskCadenceDays}. Mid-market FX should be treated as planning-grade until refreshed.`);
  }
} else {
  // readJson already pushed an error; forex feed is the FX source of record.
}

const centralBanks = sources.filter((s) => s.sourceType === 'central-bank');

console.log('Fintech source ledger');
console.log(`  tools               : ${tools.length}`);
console.log(`  sources             : ${sources.length} (${centralBanks.length} central-bank, ${sources.length - centralBanks.length} other)`);
console.log(`  central banks bound : ${new Set(centralBanks.map((s) => s.country)).size} market(s)`);
console.log(`  recorded gaps       : ${((ledger.gaps || {}).regulatorsWithoutUrl || []).length} regulator, ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced-claim class(es)`);
console.log(`  ledger reviewed     : ${ledger.lastReviewed || '(none)'}${ledgerAge === null ? '' : ` (${ledgerAge} days old)`}`);
console.log(`  forex feed stamp    : ${fx ? (fx.timestamp || fx.date || '(none)') : '(unreadable)'}${fxAge === null ? '' : ` (${fxAge} days old)`}`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nFintech source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Fintech source ledger valid.');
if (check && warnings.length) {
  // Warnings are staleness signals, not contract breaks. --check surfaces them
  // without failing the build, so a stale FX stamp never blocks an unrelated deploy.
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
