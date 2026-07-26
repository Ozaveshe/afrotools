const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../tools/childbirth-cost/childbirth-budget-engine.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/childbirth-cost/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/childbirth-cost/childbirth-budget.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/childbirth-cost.json'), 'utf8'));

assert.match(html, /<title>Provider-Quote Childbirth Budget \| AfroTools<\/title>/);
assert.match(html, /AfroTools supplies no country price/);
assert.match(html, /Quote or assumption date/);
assert.match(html, /A zero field means “nothing entered,” not “free.”/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|Linda Mama|NHIS|NHIF|Cost Ranges by Country|Compare public|Normal Vaginal Birth/i);
assert.doesNotMatch(script, /(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|getItem|removeItem|clear)|fetch\(|\/api\//);
assert.match(script, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.match(context.staticText, /must never supply or infer country/);
assert.match(context.staticText, /A zero field means no amount entered/);
assert.strictEqual(context.schemaVersion, 1);
assert.strictEqual(context.status, 'unverified-static');
assert.match(context.legacyTextSha256, /^sha256:[a-f0-9]{64}$/);

const result = engine.calculate({
  currency: 'ngn',
  quoteDate: '2026-07-01',
  sourceType: 'written-provider',
  plannedCare: '200000.50',
  professionalFees: '50000',
  medicinesSupplies: '25000.25',
  testsCare: '10000',
  transportStay: '15000',
  contingency: '20000',
  confirmedContribution: '100000',
  asOf: '2026-07-26'
});
assert.strictEqual(result.valid, true);
assert.strictEqual(result.currency, 'NGN');
assert.strictEqual(result.grossCents, 32000075);
assert.strictEqual(result.contributionCents, 10000000);
assert.strictEqual(result.householdCents, 22000075);
assert.strictEqual(result.ageDays, 25);
assert.strictEqual(result.freshness, 'recent');
assert.strictEqual(result.lineItems.length, 6);
assert.match(result.boundary, /Every amount was user-entered/);

assert.strictEqual(engine.calculate({
  currency: 'NGN',
  quoteDate: '2026-07-27',
  sourceType: 'written-provider',
  plannedCare: '1',
  professionalFees: '0',
  medicinesSupplies: '0',
  testsCare: '0',
  transportStay: '0',
  contingency: '0',
  confirmedContribution: '0',
  asOf: '2026-07-26'
}).valid, false);
assert.strictEqual(engine.calculate({
  currency: 'NGN',
  quoteDate: '2026-01-01',
  sourceType: 'household-assumption',
  plannedCare: '10',
  professionalFees: '0',
  medicinesSupplies: '0',
  testsCare: '0',
  transportStay: '0',
  contingency: '0',
  confirmedContribution: '11',
  asOf: '2026-07-26'
}).valid, false);

console.log('childbirth budget VIP tests passed');
