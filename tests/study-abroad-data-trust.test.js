const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const heroSources = require(path.join(root, 'tools/study-abroad-cost/study-abroad-hero-sources.js'));
const trust = require(path.join(root, 'tools/study-abroad-cost/study-abroad-data-trust.js'));

const heroKeys = ['uk', 'canada', 'australia', 'usa', 'germany'];
const officialTypes = new Set([
  trust.SOURCE_TYPES.OFFICIAL_GOVERNMENT,
  trust.SOURCE_TYPES.OFFICIAL_EDUCATION
]);

for (const key of heroKeys) {
  const fields = trust.getDestinationFields(key);
  assert(fields.length >= 5, `${key} should expose data-confidence fields`);

  for (const field of fields) {
    assert(field.sourceType, `${key}.${field.field} missing sourceType`);
    assert(field.confidence, `${key}.${field.field} missing confidence`);
    assert(Object.prototype.hasOwnProperty.call(field, 'sourceUrl'), `${key}.${field.field} missing sourceUrl property`);
    assert(Object.prototype.hasOwnProperty.call(field, 'sourceName'), `${key}.${field.field} missing sourceName property`);
    assert(Object.prototype.hasOwnProperty.call(field, 'lastChecked'), `${key}.${field.field} missing lastChecked property`);
    assert(Object.prototype.hasOwnProperty.call(field, 'notes'), `${key}.${field.field} missing notes property`);

    const claim = trust.claimFor(field);

    if (officialTypes.has(field.sourceType)) {
      assert(field.sourceUrl, `${key}.${field.field} official source needs sourceUrl`);
      assert(field.sourceName, `${key}.${field.field} official source needs sourceName`);
      assert(field.lastChecked, `${key}.${field.field} official source needs lastChecked`);
    }

    if (field.sourceType === trust.SOURCE_TYPES.MARKET_ESTIMATE) {
      assert.notStrictEqual(claim.label, 'Official government figure', `${key}.${field.field} market estimate displayed as official government`);
      assert.notStrictEqual(claim.label, 'Official education source', `${key}.${field.field} market estimate displayed as official education`);
      assert.strictEqual(claim.shortLabel, 'Estimate', `${key}.${field.field} market estimate should display Estimate`);
    }

    if (field.sourceType === trust.SOURCE_TYPES.UNKNOWN) {
      assert.strictEqual(claim.shortLabel, 'Needs verification', `${key}.${field.field} unknown field should display Needs verification`);
    }

    if (field.stale) {
      assert.strictEqual(field.confidence, trust.CONFIDENCE.NEEDS_REVIEW, `${key}.${field.field} stale field must be needs_review`);
      assert.match(field.notes, /stale|verify|verification|update/i, `${key}.${field.field} stale field needs a display-safe note`);
      assert.strictEqual(claim.shortLabel, 'Needs verification', `${key}.${field.field} stale field must not display official`);
    }
  }
}

const ukFields = trust.getDestinationFields('uk');
const ukOutside = ukFields.find((field) => field.field === 'proof_of_funds_outside_london');
const ukLondon = ukFields.find((field) => field.field === 'proof_of_funds_london');
assert(ukOutside, 'UK outside London proof-of-funds field should exist');
assert(ukLondon, 'UK London proof-of-funds field should exist');
assert.strictEqual(ukOutside.value, 1171 * 9, 'UK outside London proof-of-funds should use current GOV.UK 9-month value');
assert.strictEqual(ukLondon.value, 1529 * 9, 'UK London proof-of-funds should use current GOV.UK 9-month value');
assert.strictEqual(ukOutside.claim.shortLabel, 'Official', 'UK outside London proof-of-funds should be source-backed official');
assert.strictEqual(ukLondon.claim.shortLabel, 'Official', 'UK London proof-of-funds should be source-backed official');
assert.strictEqual(heroSources.officialLastChecked(heroSources.fields.uk), '2026-05-20', 'Hero source metadata should expose current last checked date');

const germanyFields = trust.getDestinationFields('germany');
const germanyBlocked = germanyFields.find((field) => field.field === 'blocked_account_exact_amount');
assert(germanyBlocked, 'Germany blocked-account exact amount review field should exist');
assert.strictEqual(germanyBlocked.sourceType, trust.SOURCE_TYPES.UNKNOWN, 'Germany exact blocked-account amount must not be official without mission verification');
assert.strictEqual(germanyBlocked.claim.shortLabel, 'Needs verification', 'Germany exact blocked-account amount must show needs verification');
assert.match(germanyBlocked.notes, /mission|Consular Services Portal/i, 'Germany blocked-account note should direct users to mission or portal verification');

const ukPanel = trust.renderPanel('uk', true);
assert(ukPanel.includes('Official values last checked:</strong> 2026-05-20'), 'Trust panel should show official values last checked date');

const regionalFields = trust.getDestinationFields('qatar');
assert(regionalFields.some((field) => field.sourceType === trust.SOURCE_TYPES.MARKET_ESTIMATE), 'regional destinations should expose market estimates');
assert(regionalFields.some((field) => field.sourceType === trust.SOURCE_TYPES.UNKNOWN), 'regional destinations should expose needs-verification fields');

const pageFiles = [
  'tools/study-abroad-cost/index.html',
  'tools/study-abroad-cost/study-abroad-cost.js',
  'tools/study-abroad-cost/study-abroad-backbone.js'
];
const unsupportedPatterns = [
  /quasi-official/i,
  /current official/i,
  /verified where available/i,
  /source-backed cost/i,
  /official cost/i,
  /verified cost/i,
  /real-time cost/i,
  /exact cost/i,
  /guaranteed to be funded/i,
  /Official (maintenance|proof|first-year|financial|floor)/i,
  /official proof floors/i,
  /current visa (fee|application charge)/i
];

for (const rel of pageFiles) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const pattern of unsupportedPatterns) {
    assert(!pattern.test(source), `${rel} still contains unsupported claim pattern ${pattern}`);
  }
}

const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const registryIndex = registry.indexOf("id: 'study-abroad-cost'");
assert(registryIndex >= 0, 'Study Abroad registry entry must remain discoverable');
const registrySnippet = registry.slice(Math.max(0, registryIndex - 500), registryIndex + 1200);
for (const pattern of unsupportedPatterns) {
  assert(!pattern.test(registrySnippet), `Study Abroad registry copy still contains unsupported claim pattern ${pattern}`);
}

const html = fs.readFileSync(path.join(root, 'tools/study-abroad-cost/index.html'), 'utf8');
assert(html.includes('study-abroad-hero-sources.js'), 'Study Abroad page must load hero source metadata before the upgraded engine');
assert(html.includes('study-abroad-data-trust.js'), 'Study Abroad page must load the data trust policy script');
assert(html.includes('Costs can change. Use AfroTools as a planning estimate'), 'Study Abroad page must show the global cost-change disclaimer');
assert(fs.existsSync(path.join(root, 'audit-results/study-abroad-cost-data-quality.md')), 'Study Abroad data-quality markdown audit must remain available');
assert(fs.existsSync(path.join(root, 'audit-results/study-abroad-cost-data-quality.json')), 'Study Abroad data-quality JSON audit must remain available');
assert(fs.existsSync(path.join(root, 'scripts/generate-study-abroad-cost-data-quality-audit.js')), 'Study Abroad data-quality audit generator must remain available');

console.log('Study Abroad data trust policy verified.');
