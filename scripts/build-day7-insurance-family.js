'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const tool = process.argv[2];
const definitions = {
  'car-insurance': ['Car Insurance Assumption Planner', 'quote', 'Estimate a premium from cover, rates and fees you enter.'],
  'health-insurance-compare': ['Health Insurance Comparison Worksheet', 'compare', 'Compare two entered plan scenarios without inventing premiums, eligibility or provider rankings.'],
  'life-insurance-calc': ['Life Insurance Needs Planner', 'need', 'Estimate a household protection gap from needs and resources you enter.'],
  'funeral-insurance': ['Funeral Cover Assumption Planner', 'quote', 'Model a user-supplied cover amount and rate without presenting a live premium.'],
  'motor-third-party': ['Motor Third-Party Assumption Planner', 'quote', 'Estimate third-party motor costs from values and rates you enter.'],
  'business-insurance': ['Business Insurance Assumption Planner', 'quote', 'Model an entered business exposure and rate without deciding suitable coverage.'],
  'travel-insurance': ['Travel Insurance Assumption Planner', 'quote', 'Model an entered trip exposure and rate without presenting a live quote.'],
  'workers-comp': ['Workers Compensation Contribution Worksheet', 'contribution', 'Estimate workers\' compensation from payroll and rates you enter.'],
  'health-contribution': ['Health Contribution Worksheet', 'contribution', 'Estimate health contributions from salary and rates you enter.'],
  'claim-tracker': ['Insurance Claim Notification Planner', 'claim', 'Compare an incident and planned notification date against a policy window you enter.'],
  'crop-insurance-calc': ['Crop Insurance Assumption Planner', 'quote', 'Model an entered crop exposure and rate without predicting yield, eligibility or payout.'],
  'fire-insurance': ['Fire Insurance Assumption Planner', 'quote', 'Model an entered property exposure and rate without presenting a valuation or quote.'],
  'insurance-fraud-checker': ['Insurance Warning-Signal Checklist', 'warning', 'Record warning signals without accusing a person or deciding whether fraud occurred.'],
  'marine-insurance': ['Marine Insurance Assumption Planner', 'quote', 'Model an entered shipment exposure and rate without presenting a quote or coverage decision.'],
  'microinsurance': ['Microinsurance Assumption Planner', 'quote', 'Model an entered exposure and rate without inventing eligibility, providers or premiums.'],
  'professional-indemnity': ['Professional Indemnity Assumption Planner', 'quote', 'Model an entered professional exposure and rate without deciding suitable limits or presenting a quote.']
};
const searchTitles = {
  'car-insurance': 'Car Insurance Planner',
  'business-insurance': 'Business Insurance Planner',
  'crop-insurance-calc': 'Crop Insurance Planner',
  'funeral-insurance': 'Funeral Cover Planner',
  'health-contribution': 'Health Contribution',
  'health-insurance-compare': 'Health Insurance Comparison',
  'life-insurance-calc': 'Life Insurance Needs',
  'microinsurance': 'Microinsurance Planner',
  'motor-third-party': 'Third-Party Motor Planner',
  'workers-comp': "Workers' Comp Worksheet"
};
if (!definitions[tool]) {
  console.error('Usage: node scripts/build-day7-insurance-family.js <insurance-tool>');
  process.exit(1);
}

const dataCode = fs.readFileSync(path.join(root, 'data/insurance/country-insurance-index.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(dataCode, sandbox);
const countries = Object.values(sandbox.window.AfroTools.insuranceData.countries);
const bySlug = new Map(countries.map(country => [country.slug, country]));
const sourceLedger = JSON.parse(fs.readFileSync(path.join(root, 'data/insurance/official-sources.json'), 'utf8'));
const sourceByCountry = new Map(sourceLedger.sources.map(source => [source.country, source]));
const directory = path.join(root, 'tools', tool);
const htmlFiles = fs.readdirSync(directory).filter(file => file.endsWith('.html')).sort();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function fields(mode) {
  if (mode === 'need') return `
    <div class="insurance-workflow__grid">
      <label>Annual household needs<input name="annual" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Years to plan for<input name="years" type="number" min="1" step="1" required inputmode="numeric"></label>
      <label>Outstanding debts<input name="debts" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Education needs<input name="education" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Other one-time needs<input name="other" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Available savings and cover<input name="available" type="number" min="0" step="any" required inputmode="decimal"></label>
    </div>`;
  if (mode === 'compare') return `
    <div class="insurance-workflow__grid">
      <label>Plan A annual premium<input name="aPremium" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Plan A excess scenario<input name="aExcess" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Plan A annual limit<input name="aLimit" type="number" min="0.01" step="any" required inputmode="decimal"></label>
      <label>Plan B annual premium<input name="bPremium" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Plan B excess scenario<input name="bExcess" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Plan B annual limit<input name="bLimit" type="number" min="0.01" step="any" required inputmode="decimal"></label>
    </div>`;
  if (mode === 'contribution') return `
    <div class="insurance-workflow__grid">
      <label>Salary or payroll basis<input name="base" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Employee rate (%)<input name="employee" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
      <label>Employer rate (%)<input name="employer" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
      <label>Number of periods<input name="months" type="number" min="1" step="1" required inputmode="numeric"></label>
    </div>`;
  if (mode === 'claim') return `
    <div class="insurance-workflow__grid">
      <label>Incident date<input name="incident" type="date" required></label>
      <label>Planned notification date<input name="planned" type="date" required></label>
      <label>Policy notification window (days)<input name="windowDays" type="number" min="1" step="1" required inputmode="numeric"></label>
    </div>`;
  if (mode === 'warning') return `
    <fieldset><legend>Signals you observed</legend>
      <label><input type="checkbox" name="signals" value="pressure">Pressure to pay immediately or outside normal channels</label>
      <label><input type="checkbox" name="signals" value="identity">Intermediary identity or licence cannot be independently verified</label>
      <label><input type="checkbox" name="signals" value="document">Policy document details conflict with the insurer&#39;s records</label>
      <label><input type="checkbox" name="signals" value="guarantee">Guaranteed payout or impossible coverage claim</label>
    </fieldset>`;
  return `
    <div class="insurance-workflow__grid">
      <label>Exposure or cover amount<input name="exposure" type="number" min="0.01" step="any" required inputmode="decimal"></label>
      <label>Your annual rate assumption (%)<input name="rate" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
      <label>Your fixed fee assumption<input name="fixed" type="number" min="0" step="any" required inputmode="decimal"></label>
      <label>Your contingency assumption (%)<input name="contingency" type="number" min="0" max="100" step="any" required inputmode="decimal"></label>
    </div>`;
}

const [baseTitle, mode, description] = definitions[tool];
for (const file of htmlFiles) {
  const old = fs.readFileSync(path.join(directory, file), 'utf8');
  const slug = file === 'index.html' ? '' : file.slice(0, -5);
  const country = slug ? bySlug.get(slug) : null;
  if (slug && !country) throw new Error(`No country metadata for ${tool}/${slug}`);
  const source = country ? sourceByCountry.get(country.code) : null;
  const route = `/tools/${tool}/${slug}`;
  const canonicalPath = slug ? route : `/tools/${tool}/`;
  const canonical = `https://afrotools.com${canonicalPath}`;
  const pageTitle = country ? `${searchTitles[tool] || baseTitle} — ${country.name}` : baseTitle;
  const pageDescription = country
    ? `${description} For ${country.name}, use your inputs and verify current rules and insurer terms.`
    : `${description} Local-first planning worksheet with no live quote or eligibility claim.`;
  const alternates = [...old.matchAll(/<link rel="alternate"[^>]+>/g)].map(match => match[0]).join('\n');
  const countryLinks = !country && htmlFiles.length > 1
    ? `<section class="insurance-workflow__panel" aria-labelledby="country-heading"><h2 id="country-heading">Country worksheets</h2><p>Country routes change context and source gaps; they do not preload premiums or legal requirements.</p><ul class="insurance-workflow__countries">${htmlFiles.filter(item => item !== 'index.html').map(item => {
      const itemSlug = item.slice(0, -5);
      const itemCountry = bySlug.get(itemSlug);
      return `<li><a href="/tools/${tool}/${itemSlug}">${escapeHtml(itemCountry.name)}</a></li>`;
    }).join('')}</ul></section>`
    : '';
  const sourceHtml = source
    ? `<p><strong>Bound regulator directory:</strong> <a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.authority)}</a>. A homepage link does not verify a current tariff, contribution, product, eligibility rule or policy term.</p>`
    : `<p><strong>Source gap:</strong> no regulator URL is bound for this ${country ? escapeHtml(country.name) + ' ' : ''}route in the Insurance official-source ledger. Verify through the responsible public authority and a licensed insurer before acting.</p>`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(pageTitle)} | AfroTools</title>
  <meta name="description" content="${escapeHtml(pageDescription)}">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:title" content="${escapeHtml(pageTitle)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(pageDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: pageTitle, description: pageDescription, url: canonical, applicationCategory: 'FinanceApplication', isAccessibleForFree: true, provider: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } }).replace(/</g, '\\u003c')}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/insurance-assumption-workflow.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/pages/insurance-assumption-workflow.js" defer></script>
</head>
<body class="day7-insurance-workflow">
  <afro-navbar theme="dark" active="insurance"></afro-navbar>
  <main class="insurance-workflow" data-insurance-workflow data-mode="${mode}" data-currency="${country ? escapeHtml(country.currency) : 'your currency'}" data-source-date="2026-03-29">
    <header class="insurance-workflow__hero">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/insurance/">Insurance</a>${country ? ` / <a href="/tools/${tool}/">${escapeHtml(baseTitle)}</a> / ${escapeHtml(country.name)}` : ''}</nav>
      <p class="insurance-workflow__eyebrow">${country ? escapeHtml(country.name) + ' worksheet' : 'Local-first worksheet'}</p>
      <h1>${escapeHtml(pageTitle)}</h1>
      <p>${escapeHtml(pageDescription)}</p>
      <p class="insurance-workflow__notice"><strong>Planning boundary:</strong> AfroTools does not fetch insurer systems, issue quotes, determine eligibility, value property, decide claims or confirm legal obligations. Empty inputs stay empty.</p>
    </header>
    <section class="insurance-workflow__panel" aria-labelledby="workflow-heading">
      <h2 id="workflow-heading">Enter your own assumptions</h2>
      <form novalidate>
        ${fields(mode)}
        <div class="insurance-workflow__actions">
          <button type="submit">${mode === 'warning' ? 'Review signals' : 'Calculate from my inputs'}</button>
          <button type="button" data-action="reset">Reset</button>
        </div>
        <output class="insurance-workflow__result" data-result tabindex="-1" aria-live="polite" aria-atomic="true"></output>
      </form>
      <p class="insurance-workflow__small">No form values are sent over the network or written to browser storage by this worksheet.</p>
    </section>
    <section class="insurance-workflow__source" aria-labelledby="source-heading">
      <h2 id="source-heading">Source, freshness and confidence</h2>
      <p><strong>Dataset floor:</strong> 29 March 2026. <span data-source-age></span></p>
      ${sourceHtml}
      <p><strong>Confidence:</strong> high for the arithmetic shown from your inputs; low for market, legal, policy and eligibility conclusions because this worksheet does not make them.</p>
    </section>
    ${countryLinks}
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(directory, file), html.replace(/[ \t]+\n/g, '\n'), 'utf8');
}
console.log(`Built ${htmlFiles.length} ${tool} route(s).`);
