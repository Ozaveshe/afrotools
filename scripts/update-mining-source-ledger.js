#!/usr/bin/env node
/**
 * Mining source ledger.
 *
 * Mirrors scripts/update-energy-source-ledger.js and
 * scripts/update-telecom-source-ledger.js: validates that
 * data/mining/official-sources.json stays internally consistent and stays
 * honest about what it cannot evidence.
 *
 * Mining royalty rates are legally significant and perishable — set by each
 * jurisdiction's Mining Code / Finance Act and revised at budget, with several
 * regimes using price- or profit-based sliding formulas rather than a flat rate.
 * The Mining Royalty Calculator presents every rate as an EDITABLE, planning-grade
 * default; this ledger binds the official source behind each bound rate and
 * records every significant jurisdiction we have NOT yet bound as an explicit gap.
 *
 *   node scripts/update-mining-source-ledger.js           # report
 *   node scripts/update-mining-source-ledger.js --check   # exit 1 on error
 *
 * Deliberately does NOT fetch the URLs. A changed hash must never be the reason a
 * royalty rate changes — read the Mining Code / Finance Act, per
 * .claude/rules/mining.md.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'data', 'mining', 'official-sources.json');
const DATASET = path.join(ROOT, 'data', 'mining', 'mining-royalties.js');
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
    // The file guards module.exports/window; evaluate it and hand back MINING_DATA.
    return new Function(`${src}; return MINING_DATA;`)();
  } catch (e) {
    errors.push(`Cannot load ${path.relative(ROOT, DATASET)}: ${e.message}`);
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
  if (s.country && !data.countries[s.country]) {
    errors.push(`${s.id}: country ${s.country} is not in the dataset.`);
  }
  if (Array.isArray(s.tools)) {
    for (const t of s.tools) {
      if (!(ledger.tools || []).includes(t)) errors.push(`${s.id}: references unknown tool "${t}"`);
    }
  }
}

// Every market in the dataset must be reachable from the ledger via its bound
// source id. A dataset country whose `source` points nowhere is the silent
// failure mode we care about.
for (const [cc, c] of Object.entries(data.countries)) {
  if (!c.source) {
    errors.push(`Dataset market ${cc} has no source id.`);
  } else if (!ids.has(c.source)) {
    errors.push(`Dataset market ${cc} references unknown source "${c.source}".`);
  }
  // No mineral may carry a zero or negative flat rate: that is the ||0-becomes-free
  // bug frozen into the data. A rate is either a positive number or explicitly
  // null+variable (formula/sliding scale the UI forces the user to confirm).
  for (const [m, def] of Object.entries(c.minerals || {})) {
    if (def.rate === null || def.rate === undefined) {
      if (!def.variable) errors.push(`${cc}.${m}: null rate must be flagged variable (formula/sliding scale).`);
      if (typeof def.min !== 'number' || typeof def.max !== 'number') {
        errors.push(`${cc}.${m}: variable rate must carry a numeric min and max band.`);
      }
    } else if (typeof def.rate !== 'number' || def.rate <= 0) {
      errors.push(`${cc}.${m}: rate must be a positive number or null+variable (got ${def.rate}).`);
    }
  }
}

// Each bound source should point at a real dataset country (checked above) and
// each dataset country should have a source (checked above). Cross-check that the
// source id set and the dataset's source set line up, to catch orphan sources.
const datasetSources = new Set(Object.values(data.countries).map((c) => c.source).filter(Boolean));
for (const s of sources) {
  if (!datasetSources.has(s.id)) {
    warnings.push(`Source ${s.id} is bound in the ledger but no dataset market uses it.`);
  }
}

// The published dataset carries its own id->authority/url map (data/mining/
// mining-royalties.js `sources`) so the tool can cite a source without shipping
// this governance file. It must not drift from the ledger: every dataset source
// id must exist in the ledger, and every country's bound source must be present.
const dataSources = data.sources || {};
for (const [cc, c] of Object.entries(data.countries)) {
  if (c.source && !dataSources[c.source]) {
    errors.push(`Dataset market ${cc}: source "${c.source}" is missing from the dataset sources map.`);
  }
}
for (const sid of Object.keys(dataSources)) {
  if (!ids.has(sid)) errors.push(`Dataset sources map has "${sid}" with no matching ledger source.`);
  const ds = dataSources[sid];
  if (!ds.authority || !ds.url) errors.push(`Dataset sources map "${sid}" needs authority and url.`);
  else if (!/^https?:\/\//.test(ds.url)) errors.push(`Dataset sources map "${sid}": url is not absolute.`);
}

// A gap must name what it is missing, or it is just a to-do.
for (const g of ((ledger.gaps || {}).jurisdictionsWithoutSource || [])) {
  if (!g.country || !g.authority) errors.push('gaps.jurisdictionsWithoutSource entry missing country/authority.');
  if (!Array.isArray(g.needs) || !g.needs.length) {
    errors.push(`gaps.jurisdictionsWithoutSource ${g.country || '(no country)'}: must say which fields it needs.`);
  }
  // A jurisdiction cannot be both bound in the dataset and listed as a gap.
  if (g.country && data.countries[g.country]) {
    errors.push(`gaps.jurisdictionsWithoutSource: ${g.country} is already bound in the dataset.`);
  }
}
for (const u of ((ledger.gaps || {}).unsourcedClaims || [])) {
  if (!u.field || !u.why) errors.push('gaps.unsourcedClaims entry needs field and why.');
}

// Freshness of the dataset itself.
const age = data.lastUpdated ? daysSince(data.lastUpdated) : null;
if (age === null) {
  errors.push('mining-royalties.js has no parseable lastUpdated.');
} else if (age > (ledger.reviewCadenceDays || 180)) {
  warnings.push(`Dataset stamp ${data.lastUpdated} is ${age} days old, past reviewCadenceDays ${ledger.reviewCadenceDays}. Royalty rates should be shown as planning-grade, not current.`);
} else if (age > (ledger.highRiskCadenceDays || 90)) {
  warnings.push(`Dataset stamp ${data.lastUpdated} is ${age} days old, past highRiskCadenceDays ${ledger.highRiskCadenceDays}. Budget-set rates (e.g. Zimbabwe) should be shown as planning-grade.`);
}

const marketCount = Object.keys(data.countries).length;
const gapCount = ((ledger.gaps || {}).jurisdictionsWithoutSource || []).length;

console.log('Mining source ledger');
console.log(`  sources            : ${sources.length}`);
console.log(`  markets in dataset : ${marketCount} (${Array.from(datasetSources).length} sourced)`);
console.log(`  dataset stamp      : ${data.lastUpdated}${age === null ? '' : ` (${age} days old)`}`);
console.log(`  recorded gaps      : ${gapCount} jurisdiction(s), ${((ledger.gaps || {}).unsourcedClaims || []).length} unsourced claim class(es)`);

for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

if (errors.length) {
  console.error(`\nMining source ledger invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log('  Mining source ledger valid.');
if (check && warnings.length) {
  console.log('\n(warnings above are advisory; --check fails only on errors)');
}
process.exit(0);
