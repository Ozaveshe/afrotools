'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tool = process.argv[2];
const defs = {
  'stamp-duty': ['Stamp Tariff Assumption Calculator', 'Calculate from a transaction value, rate and fixed charge you enter; no statutory band is preloaded.', 'rate'],
  'rental-yield': ['Rental Yield Calculator', 'Calculate net yield from property value, rent and annual costs you enter; no rent or valuation is forecast.', 'yield'],
  'home-renovation-cost': ['Home Renovation Cost Planner', 'Build a quantity-and-unit-cost renovation scenario without presenting a contractor quote.', 'cost'],
  'land-title-check': ['Land Title Verification Checklist', 'Prepare evidence and official-search steps without claiming to verify title or ownership.', 'checklist'],
  'property-valuation': ['Comparable Property Value Worksheet', 'Build a transparent comparable-price scenario without presenting an appraisal or market valuation.', 'valuation'],
  'rent-affordability': ['Rent Affordability Boundary', 'Compare rent with a budget ratio you enter without deciding tenant eligibility.', 'affordability'],
  'tenant-screening': ['Fair Tenant Screening Checklist', 'Prepare a consent-aware, consistent evidence checklist without scoring or approving a tenant.', 'checklist'],
  'rental-agreement': ['Rental Agreement Review Draft', 'Prepare a basic review draft for qualified local legal review; not a jurisdiction-ready lease.', 'agreement'],
  'property-mgmt-fees': ['Property Management Fee Worksheet', 'Apply a fee rate and fixed charge you enter without claiming a market rate.', 'management'],
  'building-materials': ['Building Materials Cost Worksheet', 'Multiply quantities by supplier unit costs you enter without inventing local prices.', 'cost'],
  'construction-budget': ['Construction Budget Worksheet', 'Build a quantity-and-unit-cost construction scenario without presenting a bill of quantities.', 'cost'],
  'dev-feasibility': ['Property Development Feasibility Worksheet', 'Compare entered revenue with entered project costs without forecasting sales or approvals.', 'development'],
  'survey-cost': ['Land Survey Cost Worksheet', 'Build a survey-cost scenario from quantity, unit cost and fixed charges you enter.', 'cost'],
  'property-cgt': ['Property Capital Gains Tax Assumption Calculator', 'Apply a tax rate and exemption you enter; no country tax rule or filing position is preloaded.', 'tax'],
  'service-charge': ['Property Service Charge Worksheet', 'Allocate entered shared costs across entered units without validating a lease or budget.', 'service'],
  'short-let-calc': ['Short-Let Income Scenario', 'Calculate from nightly rate, occupied nights and expenses you enter without forecasting demand.', 'shortlet'],
  'agent-commission': ['Real Estate Commission Worksheet', 'Apply commission and tax rates you enter without claiming a market or statutory rate.', 'commission'],
  'plot-converter': ['Plot Measurement Converter', 'Convert standard area units while keeping customary plot names outside the calculation.', 'converter'],
  'building-permit': ['Building Permit Preparation Checklist', 'Prepare questions and evidence without confirming requirements or approval.', 'checklist'],
  'diaspora-property': ['Diaspora Property Budget Worksheet', 'Compare an entered FX scenario with entered acquisition costs without live FX, title or valuation claims.', 'diaspora'],
  'offplan-vs-ready': ['Off-Plan vs Ready Cost Comparison', 'Compare entered cost scenarios without forecasting completion, appreciation or developer performance.', 'offplan']
};
if (!defs[tool]) {
  console.error('Usage: node scripts/build-day7-property-tool.js <property-tool>');
  process.exit(1);
}
const [title, description, mode] = defs[tool];
const file = path.join(root, 'tools', tool, 'index.html');
const old = fs.readFileSync(file, 'utf8');
const alternates = [...old.matchAll(/<link rel="alternate"[^>]+>/g)].map(match => match[0]).join('\n');
const canonical = `https://afrotools.com/tools/${tool}/`;
function fields() {
  const currency = '<label>Currency label<input name="currency" value="your currency" required></label>';
  const templates = {
    rate: `${currency}<label>Transaction value<input name="value" type="number" min="0.01" step="any" required></label><label>Your duty rate (%)<input name="rate" type="number" min="0" max="100" step="any" required></label><label>Your fixed charges<input name="fixed" type="number" min="0" step="any" required></label>`,
    yield: `${currency}<label>Property value<input name="value" type="number" min="0.01" step="any" required></label><label>Monthly rent<input name="rent" type="number" min="0" step="any" required></label><label>Annual operating costs<input name="costs" type="number" min="0" step="any" required></label>`,
    cost: `${currency}<label>Quantity or area<input name="quantity" type="number" min="0.01" step="any" required></label><label>Supplier or contractor unit cost<input name="unitCost" type="number" min="0.01" step="any" required></label><label>Fixed costs<input name="fixed" type="number" min="0" step="any" required></label><label>Contingency (%)<input name="contingency" type="number" min="0" max="100" step="any" required></label>`,
    valuation: `${currency}<label>Area<input name="area" type="number" min="0.01" step="any" required></label><label>Entered comparable price per area unit<input name="comparable" type="number" min="0.01" step="any" required></label><label>Your upward adjustment (%)<input name="adjustment" type="number" min="0" max="100" step="any" required></label>`,
    affordability: `${currency}<label>Monthly net income<input name="income" type="number" min="0.01" step="any" required></label><label>Monthly rent<input name="rent" type="number" min="0" step="any" required></label><label>Your rent budget ratio (%)<input name="ratio" type="number" min="0" max="100" step="any" required></label><label>Upfront rent months<input name="advance" type="number" min="0" step="any" required></label>`,
    agreement: `${currency}<label>Landlord name<input name="landlord" required autocomplete="off"></label><label>Tenant name<input name="tenant" required autocomplete="off"></label><label>Property address<textarea name="address" required></textarea></label><label>Start date<input name="start" type="date" required></label><label>Duration (months)<input name="duration" type="number" min="1" step="1" required></label><label>Rent amount<input name="rent" type="number" min="0" step="any" required></label><label>Deposit amount<input name="deposit" type="number" min="0" step="any" required></label>`,
    management: `${currency}<label>Rent per fee period<input name="rent" type="number" min="0" step="any" required></label><label>Your management rate (%)<input name="rate" type="number" min="0" max="100" step="any" required></label><label>Your fixed fees<input name="fixed" type="number" min="0" step="any" required></label>`,
    development: `${currency}<label>Expected revenue<input name="revenue" type="number" min="0.01" step="any" required></label><label>Land cost<input name="land" type="number" min="0" step="any" required></label><label>Build cost<input name="build" type="number" min="0" step="any" required></label><label>Professional costs<input name="professional" type="number" min="0" step="any" required></label><label>Finance costs<input name="finance" type="number" min="0" step="any" required></label><label>Other costs<input name="other" type="number" min="0" step="any" required></label>`,
    tax: `${currency}<label>Sale proceeds<input name="sale" type="number" min="0.01" step="any" required></label><label>Entered cost basis<input name="basis" type="number" min="0" step="any" required></label><label>Selling and improvement costs<input name="costs" type="number" min="0" step="any" required></label><label>Exemption assumption<input name="exemption" type="number" min="0" step="any" required></label><label>Your tax rate (%)<input name="rate" type="number" min="0" max="100" step="any" required></label>`,
    service: `${currency}<label>Annual shared costs<input name="annual" type="number" min="0" step="any" required></label><label>Units sharing cost<input name="units" type="number" min="1" step="1" required></label><label>Reserve assumption (%)<input name="reserve" type="number" min="0" max="100" step="any" required></label>`,
    shortlet: `${currency}<label>Nightly rate<input name="nightly" type="number" min="0" step="any" required></label><label>Occupied nights per year<input name="nights" type="number" min="0" max="365" step="1" required></label><label>Annual expenses<input name="expenses" type="number" min="0" step="any" required></label>`,
    commission: `${currency}<label>Transaction value<input name="value" type="number" min="0" step="any" required></label><label>Your commission rate (%)<input name="rate" type="number" min="0" max="100" step="any" required></label><label>Tax on commission (%)<input name="tax" type="number" min="0" max="100" step="any" required></label>`,
    converter: '<label>Value<input name="value" type="number" min="0" step="any" required></label><label>From unit<select name="from"><option value="sqm">square metres</option><option value="hectare">hectares</option><option value="acre">acres</option><option value="sqft">square feet</option></select></label><label>To unit<select name="to"><option value="acre">acres</option><option value="sqm">square metres</option><option value="hectare">hectares</option><option value="sqft">square feet</option></select></label>',
    diaspora: `${currency}<label>Foreign-currency budget<input name="budget" type="number" min="0.01" step="any" required></label><label>Your local currency per foreign unit<input name="fx" type="number" min="0.000001" step="any" required></label><label>Property price in local currency<input name="price" type="number" min="0" step="any" required></label><label>Other acquisition costs<input name="costs" type="number" min="0" step="any" required></label>`,
    offplan: `${currency}<label>Ready-property entered cost<input name="ready" type="number" min="0" step="any" required></label><label>Off-plan entered price<input name="offplan" type="number" min="0" step="any" required></label><label>Off-plan carrying costs<input name="carrying" type="number" min="0" step="any" required></label><label>Delay assumption (months)<input name="delay" type="number" min="0" step="1" required></label><label>Monthly rent during delay<input name="rent" type="number" min="0" step="any" required></label>`
  };
  if (mode === 'checklist') {
    const items = tool === 'tenant-screening'
      ? ['Applicant consent recorded', 'Identity evidence checked consistently', 'Income or affordability evidence checked consistently', 'References checked with consent']
      : tool === 'land-title-check'
        ? ['Seller identity and authority evidence', 'Official registry search requested', 'Survey or parcel reference reconciled', 'Encumbrances and disputes reviewed professionally']
        : ['Responsible planning authority identified', 'Current application list obtained officially', 'Drawings and professional sign-offs checked', 'Inspection and approval stages confirmed'];
    return `<fieldset><legend>Preparation items</legend>${items.map((item, index) => `<label><input type="checkbox" name="item-${index}">${item}</label>`).join('')}</fieldset>`;
  }
  return `<div class="property-assumption__grid">${templates[mode]}</div>`;
}
const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: title, description, url: canonical, applicationCategory: 'FinanceApplication', isAccessibleForFree: true, provider: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } }).replace(/</g, '\\u003c');
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} | AfroTools</title>
  <meta name="description" content="${description} Local-first planning with explicit legal, official and valuation boundaries.">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:title" content="${title} | AfroTools">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${schema}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/property-assumption-workflow.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/pages/property-assumption-workflow.js" defer></script>
</head>
<body class="property-assumption-page">
  <afro-navbar theme="dark" active="mortgage-property"></afro-navbar>
  <main class="property-assumption" data-property-workflow data-tool="${tool}">
    <header class="property-assumption__hero">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/mortgage-property/">Mortgage &amp; Property</a> / ${title}</nav>
      <p class="property-assumption__eyebrow">Local-first worksheet</p>
      <h1>${title}</h1>
      <p>${description}</p>
      <p class="property-assumption__notice"><strong>Boundary:</strong> no live rate, price, valuation, legal rule, title status, eligibility, approval or official integration is supplied. Empty inputs stay empty.</p>
    </header>
    <section class="property-assumption__panel" aria-labelledby="workflow-heading">
      <h2 id="workflow-heading">${mode === 'checklist' ? 'Prepare your verification file' : 'Enter your own assumptions'}</h2>
      <form novalidate>
        ${fields()}
        <div class="property-assumption__actions">
          <button type="submit">${mode === 'checklist' ? 'Review checklist' : mode === 'agreement' ? 'Build review draft' : 'Calculate from my inputs'}</button>
          <button type="button" data-action="reset">Reset</button>
          ${mode === 'agreement' ? '<button type="button" data-action="download" hidden>Download TXT review draft</button>' : ''}
        </div>
        <output class="property-assumption__result" data-result tabindex="-1" aria-live="polite" aria-atomic="true"></output>
      </form>
      <p class="property-assumption__small">This workflow sends no form values over the network and writes nothing to browser storage.</p>
    </section>
    <section class="property-assumption__source" aria-labelledby="source-heading">
      <h2 id="source-heading">Source, freshness and confidence</h2>
      <p><strong>Rate data:</strong> none is bundled. All monetary, percentage, price and duration assumptions come from you.</p>
      <p><strong>Freshness:</strong> confirm current requirements with the responsible land registry, revenue or planning authority, lender, licensed valuer, surveyor, quantity surveyor or legal professional.</p>
      <p><strong>Confidence:</strong> high for the displayed arithmetic or checklist count; low for any legal, official, valuation, market, eligibility or approval conclusion because the tool does not make one.</p>
    </section>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
fs.writeFileSync(file, html.replace(/[ \t]+\n/g, '\n'), 'utf8');
console.log(`Built ${tool}.`);
