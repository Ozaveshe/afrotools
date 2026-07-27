'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'tools', 'visa-checker');
const dataCode = fs.readFileSync(path.join(root, 'data/insurance/country-insurance-index.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(dataCode, sandbox);
const countries = Object.values(sandbox.window.AfroTools.insuranceData.countries).sort((a, b) => a.name.localeCompare(b.name));
const bySlug = new Map(countries.map(country => [country.slug, country]));
const government = JSON.parse(fs.readFileSync(path.join(root, 'data/government/official-sources.json'), 'utf8'));
const immigration = new Map();
for (const source of government.sources) {
  if (source.country && /immigration|home affairs/i.test(`${source.authority || ''} ${source.title || ''}`) && !immigration.has(source.country)) {
    immigration.set(source.country, source);
  }
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
const options = `<option value="">Choose passport country</option>${countries.map(country => `<option value="${country.code}">${esc(country.name)}</option>`).join('')}`;
const files = fs.readdirSync(directory).filter(file => file !== 'index.html' && file.endsWith('.html')).sort();
for (const fileName of files) {
  const country = bySlug.get(fileName.slice(0, -5));
  if (!country) throw new Error(`Missing country metadata: ${fileName}`);
  const old = fs.readFileSync(path.join(directory, fileName), 'utf8');
  const alternates = [...old.matchAll(/<link rel="alternate"[^>]+>/g)].map(match => match[0]).join('\n');
  const canonical = `https://afrotools.com/tools/visa-checker/${country.slug}`;
  const source = immigration.get(country.code);
  const sourceBlock = source
    ? `<p><strong>Bound destination authority:</strong> <a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.authority)}</a>. This directory link does not provide a live entry answer.</p>`
    : `<p><strong>Source gap:</strong> the Government official-source ledger has no destination immigration URL bound for ${esc(country.name)}. Identify the responsible government authority or embassy independently before relying on any entry information.</p>`;
  const title = `${country.name} Visa Route Verification Planner`;
  const description = `Prepare a passport-to-${country.name} entry-rule verification brief without inventing visa status, eligibility, fees, stay limits or approval.`;
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: title, description, url: canonical, applicationCategory: 'TravelApplication', isAccessibleForFree: true, provider: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } }).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} | AfroTools</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:title" content="${esc(title)} | AfroTools">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${schema}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/visa-family-verification.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/pages/visa-family-verification.js" defer></script>
</head>
<body class="visa-family-page">
  <afro-navbar theme="dark" active="government"></afro-navbar>
  <main class="visa-family" data-visa-family data-destination-code="${country.code}" data-destination-name="${esc(country.name)}">
    <header class="visa-family__hero">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/government/">Government &amp; Civic</a> / <a href="/tools/visa-checker/">Visa Route Verification</a> / ${esc(country.name)}</nav>
      <p class="visa-family__eyebrow">${esc(country.name)} destination worksheet</p>
      <h1>${esc(title)}</h1>
      <p>${esc(description)}</p>
      <p class="visa-family__notice"><strong>Boundary:</strong> no live visa status, exemption, arrival right, eVisa availability, eligibility, fee, stay limit, processing time or approval is supplied. Empty input stays empty.</p>
    </header>
    <section class="visa-family__panel" aria-labelledby="route-heading">
      <h2 id="route-heading">Prepare the route brief</h2>
      <form novalidate>
        <label>Passport country<select name="origin" required>${options}</select></label>
        <div class="visa-family__actions">
          <button type="submit">Prepare verification brief</button>
          <button type="button" data-action="reset">Reset</button>
        </div>
        <output class="visa-family__result" data-result tabindex="-1" aria-live="polite" aria-atomic="true"></output>
      </form>
      <p>No passport number, name, travel date, payment detail or application reference is requested. Form values are not sent over the network or written to browser storage.</p>
    </section>
    <section class="visa-family__panel" aria-labelledby="source-heading">
      <h2 id="source-heading">Source, freshness and confidence</h2>
      ${sourceBlock}
      <p><strong>Freshness:</strong> entry rules can change without notice. Reconfirm close to travel and before paying or booking.</p>
      <p><strong>Confidence:</strong> high for the route label and preparation checklist; no confidence is assigned to entry eligibility because the tool does not issue a verdict.</p>
    </section>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(directory, fileName), html.replace(/[ \t]+\n/g, '\n'), 'utf8');
}
console.log(`Built ${files.length} visa country verification routes.`);
