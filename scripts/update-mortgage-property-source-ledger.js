#!/usr/bin/env node
/**
 * Mortgage & Property source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/mortgage-property/official-sources.json stays internally consistent and
 * stays honest about what it cannot evidence.
 *
 * Mortgage & Property carries two classes of perishable public numbers:
 *  1. Transaction taxes set by statute/gazette -- stamp duty, transfer duty,
 *     property capital gains tax, land-registration fees. Authoritative only
 *     from the revenue authority (FIRS, KRA, SARS, GRA, TRA, URA, ETA, DGI).
 *  2. Interest rates -- central-bank policy rates set the floor; commercial
 *     mortgage rates are lender offers layered on top (recorded as unsourced).
 *
 * Unlike energy/telecom, this hub has NO central dataset file: each tool
 * hard-codes its own country rate table inside tools/<tool>/index.html. So this
 * validator checks the ledger's internal integrity AND that every tool the
 * ledger names still exists on disk -- it deliberately does NOT fetch any URL.
 * A changed hash must never be the reason a stamp-duty band or a policy rate
 * changes -- read the gazetted Finance Act, per .claude/rules/government.md.
 *
 *   node scripts/update-mortgage-property-source-ledger.js           # report
 *   node scripts/update-mortgage-property-source-ledger.js --check   # exit 1 on error
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'mortgage-property', 'official-sources.json');
const TOOLS_DIR = path.join(ROOT, 'tools');
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

const ledger = readLedger();
if (!ledger) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const tools = ledger.tools || [];
const toolSet = new Set(tools);

// Every listed tool must still exist on disk. Silence -- a tool renamed or
// removed while the ledger still claims to cover it -- is the failure we care
// about.
for (const t of tools) {
  if (!fs.existsSync(path.join(TOOLS_DIR, t, 'index.html'))) {
    errors.push(`Tool "${t}" is listed in the ledger but tools/${t}/index.html does not exist.`);
  }
}
if (new Set(tools).size !== tools.length) errors.push('Duplicate entries in tools[].');

const sources = ledger.sources || [];
const ids = new Set();
const KNOWN_TYPES = new Set(['revenue-authority', 'central-bank', 'scheme-administrator', 'regulator', 'registry']);

for (const s of sources) {
  if (!s.id) errors.push('Source with no id.');
  else if (ids.has(s.id)) errors.push(`Duplicate source id: ${s.id}`);
  else ids.add(s.id);

  for (const field of ['country', 'authority', 'title', 'url', 'sourceType', 'fields']) {
    if (!s[field] || (Array.isArray(s[field]) && !s[field].length)) {
      errors.push(`${s.id || '(no id)'}: missing ${field}`);
    }
  }
  if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${s.id}: url is not absolute (${s.url})`);
  if (s.sourceType && !KNOWN_TYPES.has(s.sourceType)) {
    warnings.push(`${s.id}: unusual sourceType "${s.sourceType}".`);
  }
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!toolSet.has(t)) errors.push(`${s.id}: references tool "${t}" not in tools[].`);
    }
  }
}

// A revenue authority or central bank must never sit alongside a commercial
// mortgage rate as if it set it. Guard the documented invariant: policyRate is
// the only interest-rate field a central bank may claim.
for (const s of sources) {
  if (s.sourceType === 'central-bank' && (s.fields || []).some((f) => /commercial|mortgageRate/i.test(f))) {
    errors.push(`${s.id}: a central bank must not claim a commercial mortgage rate -- bind only policyRate.`);
  }
}

// Gaps must be honest: an authority gap must name what it is missing, and a
// country cannot be both fully sourced and listed as a gap for the same field.
const gaps = ledger.gaps || {};
const gapAuthorities = gaps.authoritiesWithoutUrl || [];
for (const g of gapAuthorities) {
  if (!g.country || !g.authority) errors.push('gaps.authoritiesWithoutUrl entry missing country/authority.');
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.authoritiesWithoutUrl ${g.country || '(no country)'}: must say which fields it needs.`);
  }
  if (!g.why) errors.push(`gaps.authoritiesWithoutUrl ${g.country || '(no country)'}: must say why (the liability).`);
}
for (const u of gaps.unsourcedClaims || []) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// Field-level: a (country, field) that has a bound source must not also appear
// as a gap needing that same field -- that would be double-counting.
const sourcedByCountryField = new Set();
for (const s of sources) {
  for (const f of s.fields || []) sourcedByCountryField.add(`${s.country}:${f}`);
}
for (const g of gapAuthorities) {
  for (const f of g.needs || []) {
    if (sourcedByCountryField.has(`${g.country}:${f}`)) {
      errors.push(`${g.country} is listed as a gap for "${f}" but a source already binds that field.`);
    }
  }
}

const revenue = sources.filter((s) => s.sourceType === 'revenue-authority');
const banks = sources.filter((s) => s.sourceType === 'central-bank');
const schemes = sources.filter((s) => s.sourceType === 'scheme-administrator');
const sourcedCountries = new Set(sources.map((s) => s.country));

console.log('Mortgage & Property source ledger');
console.log(`  tools listed       : ${tools.length}`);
console.log(`  sources            : ${sources.length} (${revenue.length} revenue-authority, ${banks.length} central-bank, ${schemes.length} scheme)`);
console.log(`  countries sourced  : ${sourcedCountries.size}`);
console.log(`  recorded gaps      : ${gapAuthorities.length} authority, ${(gaps.unsourcedClaims || []).length} unsourced-claim class(es)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nMortgage & Property source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Mortgage & Property source ledger valid.');
if (check && warnings.length) {
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
