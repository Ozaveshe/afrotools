const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const rebuilt = [
  'stamp-duty', 'rental-yield', 'home-renovation-cost', 'land-title-check',
  'property-valuation', 'rent-affordability', 'tenant-screening', 'rental-agreement',
  'property-mgmt-fees', 'building-materials', 'construction-budget', 'dev-feasibility',
  'survey-cost', 'property-cgt', 'service-charge', 'short-let-calc', 'agent-commission',
  'plot-converter', 'building-permit', 'diaspora-property', 'offplan-vs-ready'
];
const preserved = [
  'mortgage-calculator', 'rent-vs-buy', 'mortgage-affordability',
  'home-loan-eligibility', 'property-transfer-cost', 'first-home-buyer', 'property-roi'
];

for (const tool of rebuilt) {
  const html = fs.readFileSync(path.join(ROOT, 'tools', tool, 'index.html'), 'utf8');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com/tools/${tool}/">`));
  assert.match(html, /<title>[^<]{20,}\| AfroTools<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{80,}">/);
  assert.match(html, /"@type":"WebApplication"/);
  assert.match(html, new RegExp(`data-tool="${tool}"`));
  assert.match(html, /no live rate, price, valuation, legal rule, title status, eligibility, approval or official integration/i);
  assert.match(html, /sends no form values over the network and writes nothing to browser storage/i);
  assert.match(html, /Rate data:<\/strong> none is bundled/);
  assert.match(html, /Confidence:<\/strong> high for the displayed arithmetic or checklist count/);
  assert.doesNotMatch(html, /Save to dashboard|Email checklist|unlock PDF|AI-powered|country rates|typical expenses/i);
  assert.doesNotMatch(html, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/);
}

for (const tool of preserved) {
  const html = fs.readFileSync(path.join(ROOT, 'tools', tool, 'index.html'), 'utf8');
  assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com/tools/${tool}/">`));
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /planning|scenario|checklist|readiness|reconcile/i, `${tool} needs a planning boundary`);
}

assert.strictEqual(rebuilt.length + preserved.length, 28);
console.log('Day 7 property contract verified for 21 rebuilt assumption-only tools and 7 preserved mature workflows.');
