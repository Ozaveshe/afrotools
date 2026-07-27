#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'agriculture', 'all-tools', 'index.html');
const registrySource = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const sandbox = { document: undefined, window: {} };
vm.createContext(sandbox);
vm.runInContext(registrySource, sandbox);

const taxonomy = require(path.join(root, 'assets/js/components/category-taxonomy.js')).agriculture;
const rows = sandbox.AFRO_TOOLS
  .filter((row) => taxonomy.isActiveTool(row))
  .sort((left, right) => String(left.name).localeCompare(String(right.name)));
const report = taxonomy.getReport(rows);

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function familyLabel(key) {
  return String(key || '')
    .replace(/^tools\//, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function countryLabel(row, family) {
  const route = String(row.href || '').replace(/\/+$/, '');
  const segment = route.split('/').filter(Boolean).slice(-1)[0] || '';
  const familySegment = String(family.key || '').replace(/^tools\//, '');
  if (segment === familySegment || route.startsWith('/tools/')) return 'Pan-African';
  const nameCountry = String(row.name || '').match(/\(([^)]+)\)\s*$/);
  if (nameCountry) return nameCountry[1];
  return segment.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function renderFamily(family) {
  const tools = family.tools.slice().sort((left, right) => {
    const leftCountry = countryLabel(left, family);
    const rightCountry = countryLabel(right, family);
    if (leftCountry === 'Pan-African') return -1;
    if (rightCountry === 'Pan-African') return 1;
    return leftCountry.localeCompare(rightCountry);
  });
  const anchor = `family-${String(family.key).replace(/^tools\//, '').replace(/[^a-z0-9-]/g, '-')}`;
  return `
            <section class="agri-directory-family" id="${anchor}">
              <h3>${escapeHtml(familyLabel(family.key))}</h3>
              <p>${tools.length === 1 ? 'One calculator' : `${tools.length} country and pan-African calculators`} for this task.</p>
              <ul class="agri-directory-links">
${tools.map((row) => `                <li><a href="${escapeHtml(row.href)}">${escapeHtml(row.name)}</a><span>${escapeHtml(countryLabel(row, family))}</span></li>`).join('\n')}
              </ul>
            </section>`;
}

function renderBucket(bucket) {
  return `
        <section class="agri-directory-group" id="${escapeHtml(bucket.slug)}">
          <div class="agri-directory-group__header">
            <p class="agri-section__eyebrow">Farm work area</p>
            <h2>${escapeHtml(bucket.label)}</h2>
            <p>${escapeHtml(bucket.summary)}</p>
            <a href="/agriculture/${escapeHtml(bucket.slug)}/">Open the ${escapeHtml(bucket.label)} guide</a>
          </div>
${bucket.familyStats.map(renderFamily).join('\n')}
        </section>`;
}

const html = `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.88bd45ff.min.js" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Agriculture Calculators for Africa | AfroTools</title>
  <meta name="description" content="Browse all ${report.totalTools} AfroTools Agriculture calculators by farm task and country, with direct links that work without search or filters.">
  <meta name="ai-context" content="Static directory of AfroTools Agriculture calculators, grouped by farm task and country. Calculators provide planning estimates; changing prices, rules, weather and local conditions must be confirmed.">
  <meta property="og:title" content="All Agriculture Calculators for Africa | AfroTools">
  <meta property="og:description" content="Direct links to all ${report.totalTools} Agriculture calculators, organized by farm task and country.">
  <meta property="og:url" content="https://afrotools.com/agriculture/all-tools/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="All Agriculture Calculators for Africa | AfroTools">
  <meta name="twitter:description" content="Browse every Agriculture calculator by task and country.">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
  <link rel="stylesheet" href="/assets/css/design-system.min.css?v=1bd26ae3">
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/agriculture-taxonomy.css?v=3b1c115e">
  <link rel="stylesheet" href="/assets/css/agriculture-directory.css">
  <link rel="canonical" href="https://afrotools.com/agriculture/all-tools/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/agriculture/all-tools/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/agriculture/all-tools/">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "All Agriculture Calculators for Africa",
    "url": "https://afrotools.com/agriculture/all-tools/",
    "description": "A static directory of AfroTools Agriculture calculators grouped by farm task and country.",
    "numberOfItems": ${report.totalTools},
    "isPartOf": {
      "@type": "CollectionPage",
      "name": "Agriculture Tools for Africa",
      "url": "https://afrotools.com/agriculture/"
    }
  }
  </script>
  <script src="/assets/js/components/navbar.min.js?v=11746cbb" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
</head>
<body class="agri-taxonomy-page agri-directory-page">
  <afro-navbar active="agriculture"></afro-navbar>
  <div class="agri-shell">
    <header class="agri-hero">
      <div class="agri-hero__inner">
        <p class="agri-breadcrumb"><a href="/">Home</a> / <a href="/agriculture/">Agriculture</a> / <span aria-current="page">All calculators</span></p>
        <span class="agri-eyebrow">Complete calculator directory</span>
        <h1>Find every Agriculture calculator by task and country.</h1>
        <p>This page gives you a direct link to every current English Agriculture calculator. Choose the work you need to do, then select a pan-African or country version.</p>
        <div class="agri-directory-summary" aria-label="Directory coverage">
          <strong>${report.totalTools}</strong> calculators across <strong>${report.buckets.length}</strong> farm work areas and <strong>${report.buckets.reduce((sum, bucket) => sum + bucket.familyCount, 0)}</strong> task families.
        </div>
      </div>
    </header>
    <main class="agri-main">
      <nav class="agri-directory-jump" aria-label="Agriculture work areas">
${report.buckets.map((bucket) => `        <a href="#${escapeHtml(bucket.slug)}">${escapeHtml(bucket.label)} <span>${bucket.count}</span></a>`).join('\n')}
      </nav>
${report.buckets.map(renderBucket).join('\n')}
      <section class="agri-directory-note" aria-labelledby="agri-directory-note-title">
        <h2 id="agri-directory-note-title">Before you act on a result</h2>
        <p>These tools are for planning. Use your own field measurements and current local prices, and confirm changing agronomy, weather, finance, insurance, market and regulatory information with the relevant local specialist or authority.</p>
      </section>
    </main>
  </div>
  <afro-footer></afro-footer>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>
`;

if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== html) {
    console.error('Agriculture static directory is missing or stale. Run: node scripts/build-agriculture-discovery.js');
    process.exit(1);
  }
  console.log(`Agriculture static directory current: ${report.totalTools} routes, ${report.buckets.length} work areas.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, html);
console.log(`Wrote ${path.relative(root, output)} with ${report.totalTools} crawlable calculator links.`);
