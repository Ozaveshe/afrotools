#!/usr/bin/env node
// Build an indexable, no-JavaScript creator directory from a reviewed public snapshot.
const fs = require('node:fs');
const path = require('node:path');
const { renderSubnav } = require('../tools/afrostream/subnav');

const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'data', 'afrostream', 'creator-directory-snapshot.json');
const outputPath = path.join(ROOT, 'tools', 'afrostream', 'directory', 'index.html');
if (process.argv.includes('--refresh-navigation')) {
  let html = fs.readFileSync(outputPath, 'utf8');
  if (!html.includes('aria-label="AfroStream navigation"')) html = html.replace('<afro-navbar></afro-navbar>', '<afro-navbar></afro-navbar>\n' + renderSubnav());
  if (!html.includes('/tools/afrostream/subnav.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/tools/afrostream/subnav.css">\n</head>');
  if (!html.includes('/tools/afrostream/subnav.js')) html = html.replace('</body>', '<script src="/tools/afrostream/subnav.js" defer></script>\n</body>');
  fs.writeFileSync(outputPath, html);
  console.log('Refreshed directory navigation; snapshot and release metadata preserved.');
  process.exit(0);
}
const snapshot = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function countryName(code) {
  return countryNames.of(code) || code;
}

if (snapshot.schemaVersion !== 1 ||
    snapshot.projectRef !== 'zpclagtgczsygrgztlts' ||
    snapshot.source !== 'public.as_creators' ||
    snapshot.criteria !== 'is_published = true AND flagged IS NOT TRUE' ||
    !/^\d{4}-\d{2}-\d{2}/.test(snapshot.retrievedAt || '') ||
    !Array.isArray(snapshot.creators) ||
    !snapshot.creators.length) {
  throw new Error('Creator directory snapshot metadata is incomplete');
}

const seen = new Set();
const byCountry = new Map();
for (const row of snapshot.creators) {
  if (!row || typeof row.name !== 'string' || !row.name.trim() ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug || '') ||
      !/^[A-Z]{2}$/.test(row.country || '') ||
      typeof row.categories !== 'string' || seen.has(row.slug)) {
    throw new Error('Invalid or duplicate public creator row');
  }
  seen.add(row.slug);
  if (!byCountry.has(row.country)) byCountry.set(row.country, []);
  byCountry.get(row.country).push(row);
}

const countries = Array.from(byCountry.keys()).sort(function(a, b) {
  return countryName(a).localeCompare(countryName(b), 'en');
});
const options = countries.map(function(code) {
  return '<option value="' + code + '">' + escapeHtml(countryName(code)) + '</option>';
}).join('\n');
const sections = countries.map(function(code) {
  const rows = byCountry.get(code).sort(function(a, b) {
    return a.name.localeCompare(b.name, 'en') || a.slug.localeCompare(b.slug, 'en');
  });
  const items = rows.map(function(row) {
    const href = '/tools/afrostream/creator?id=' + encodeURIComponent(row.slug);
    return '<li class="as-directory-item" data-creator data-country="' + code + '">' +
      '<a href="' + href + '"><strong>' + escapeHtml(row.name) + '</strong>' +
      (row.categories ? '<span>' + escapeHtml(row.categories) + '</span>' : '') +
      '</a></li>';
  }).join('\n');
  return '<section class="as-directory-group" data-country-group="' + code + '" aria-labelledby="country-' + code.toLowerCase() + '">' +
    '<h2 id="country-' + code.toLowerCase() + '">' + escapeHtml(countryName(code)) +
    ' <small>' + rows.length + ' profiles</small></h2>' +
    '<ul class="as-directory-list">' + items + '</ul></section>';
}).join('\n');
const canonical = 'https://afrotools.com/tools/afrostream/directory/';
const schema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'AfroStream Creator Directory',
  description: 'Browse published AfroStream creator profiles by country and category.',
  url: canonical,
  dateModified: snapshot.retrievedAt.slice(0, 10),
  isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com/' }
});
const html = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<title>African Creator Directory by Country | AfroStream</title>',
  '<meta name="description" content="Browse published AfroStream creator profiles by country and category, then open a profile for current platform links and reported activity.">',
  '<meta name="robots" content="index, follow">',
  '<link rel="canonical" href="' + canonical + '">',
  '<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="African Creator Directory by Country | AfroStream">',
  '<meta property="og:description" content="Find published AfroStream creator profiles by country and category.">',
  '<meta property="og:url" content="' + canonical + '">',
  '<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">',
  '<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">',
  '<link rel="stylesheet" href="/assets/css/global.min.css?v=23d6ef69">',
  '<link rel="stylesheet" href="/tools/afrostream/style.css?v=780e4d2b">',
  '<link rel="stylesheet" href="/tools/afrostream/directory.css">',
  '<link rel="stylesheet" href="/tools/afrostream/subnav.css">',
  '<script src="/assets/js/analytics-bootstrap.js?v=03318ee7" data-loader-version="d7e7b03e" async></script>',
  '<script src="/assets/js/components/navbar.min.js?v=4bbc4536" defer></script>',
  '<script src="/assets/js/components/footer.min.js?v=506bb75a" defer></script>',
  '<script type="application/ld+json">' + schema + '</script>',
  '</head>',
  '<body class="as-page as-directory-page">',
  '<afro-navbar></afro-navbar>',
  renderSubnav(),
  '<main class="as-directory" id="main">',
  '<nav class="as-directory-breadcrumbs" aria-label="Breadcrumb"><a href="/tools/afrostream/">AfroStream</a><span aria-hidden="true">/</span><span>Creator directory</span></nav>',
  '<header class="as-directory-header">',
  '<h1>Creator directory</h1>',
  '<p class="as-directory-intro">Browse AfroStream creator profiles by country. Search for a name or category, then open a profile for platform links and current reported activity.</p>',
  '<p class="as-directory-note">Catalog snapshot: ' + escapeHtml(snapshot.retrievedAt.slice(0, 10)) +
    '. Names, countries and categories come from published, unflagged AfroStream records. This is an alphabetical directory, not a ranking. ' +
    '<a href="/tools/afrostream/rankings">View current rankings</a> for score and activity context.</p>',
  '</header>',
  '<form class="as-directory-controls" id="directoryFilters" role="search" hidden>',
  '<div class="as-directory-field"><label for="directorySearch">Search name or category</label><input id="directorySearch" type="search" autocomplete="off" placeholder="e.g. gaming"></div>',
  '<div class="as-directory-field"><label for="directoryCountry">Country</label><select id="directoryCountry"><option value="">All countries</option>' + options + '</select></div>',
  '<button class="as-directory-clear" id="directoryClear" type="button">Clear filters</button>',
  '</form>',
  '<noscript><p class="as-directory-note">The complete directory is listed below. Search filters require JavaScript.</p></noscript>',
  '<p class="as-directory-count" id="directoryCount" role="status" aria-live="polite">' + snapshot.creators.length + ' profiles in this snapshot</p>',
  '<p class="as-directory-empty" id="directoryEmpty" hidden>No profiles match these filters. Try another name or country.</p>',
  sections,
  '</main>',
  '<afro-footer></afro-footer>',
  '<script src="/tools/afrostream/directory.js" defer></script>',
  '<script src="/tools/afrostream/subnav.js" defer></script>',
  '<script src="/assets/js/lazy-analytics.js?v=d7e7b03e" defer></script>',
  '</body>',
  '</html>'
].join('\n') + '\n';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);
console.log('Built AfroStream directory: ' + snapshot.creators.length + ' profiles across ' + countries.length + ' country sections');
