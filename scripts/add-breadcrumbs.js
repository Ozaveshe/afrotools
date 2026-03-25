'use strict';
var fs = require('fs');
var path = require('path');

var root = process.cwd();
var BASE = 'https://afrotools.com';
var fixed = 0;
var skipped = 0;

function findHtmlFiles(dir, depth) {
  if (depth > 3) return [];
  var items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return []; }
  var files = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'assets' || item.name === 'scripts') continue;
    var full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(findHtmlFiles(full, depth + 1));
    } else if (item.name === 'index.html') {
      files.push(full);
    }
  }
  return files;
}

function getOgTitle(html) {
  var m = html.match(/property="og:title"\s+content="([^"]+)"/);
  if (!m) m = html.match(/content="([^"]+)"\s+property="og:title"/);
  if (m) return m[1].replace(/&mdash;.*/, '').replace(/[|–—].*/, '').replace(/\s+$/, '').replace(/&amp;/g, '&');
  // fallback: <title>
  var t = html.match(/<title>([^<]+)<\/title>/);
  if (t) return t[1].replace(/[|—–].*/, '').replace(/\s+$/, '');
  return null;
}

function getCanonical(html, relPath) {
  var m = html.match(/rel="canonical"\s+href="([^"]+)"/);
  if (!m) m = html.match(/href="([^"]+)"\s+rel="canonical"/);
  if (m) return m[1];
  // construct from path
  var urlPath = '/' + relPath.replace(/\\/g, '/').replace(/index\.html$/, '');
  return BASE + urlPath;
}

function buildBreadcrumb(html, relPath) {
  var parts = relPath.replace(/\\/g, '/').replace(/\/index\.html$/, '').split('/').filter(Boolean);
  var pageUrl = getCanonical(html, relPath);
  var pageTitle = getOgTitle(html);

  if (!pageTitle) return null;
  // Clean up: strip " — AfroTools", "| AfroTools", etc
  pageTitle = pageTitle.replace(/\s*[—|]\s*AfroTools.*$/, '').trim();

  // Category label map
  var labels = {
    'agriculture': 'Agriculture',
    'tools': 'Tools',
    'crypto': 'Crypto',
    'health': 'Health',
    'engineering': 'Engineering',
    'education': 'Education',
    'finance': 'Finance',
    'fr': null, // skip French pages
    'pro': 'Pro',
    'docs': 'Docs',
    'api': 'API',
    'vat-business-tax': 'VAT & Business Tax',
    'salary-tax': 'Salary & Tax',
    'document-pdf': 'Documents & PDF',
    'developer-tools': 'Developer Tools',
    'ecommerce': 'E-Commerce',
    'african': 'African Tools',
    'countries': 'Countries',
    'all-tools': 'All Tools',
    'search': 'Search',
    'about': 'About',
    'blog': 'Blog',
    'faq': 'FAQ',
    'contact': 'Contact',
    'pricing': 'Pricing',
    'privacy': 'Privacy Policy',
    'terms': 'Terms of Service',
    'changelog': 'Changelog',
    'advertise': 'Advertise',
    'suggest-tool': 'Suggest a Tool',
    'widgets': 'Widgets',
  };

  // Skip French pages and special dirs
  if (parts[0] === 'fr') return null;
  if (parts[0] === 'widgets') return null;
  if (parts[0] === 'thank-you') return null;

  var items = [
    { position: 1, name: 'AfroTools', item: BASE + '/' }
  ];

  if (parts.length === 0) {
    // homepage — skip
    return null;
  } else if (parts.length === 1) {
    // e.g. /ghana/ or /tools/ or /about/
    var label = labels[parts[0]];
    if (!label) label = pageTitle || parts[0];
    items.push({ position: 2, name: label, item: pageUrl });
  } else if (parts.length === 2) {
    // e.g. /tools/paye-calculator/ or /agriculture/fertilizer/
    var catLabel = labels[parts[0]];
    if (!catLabel) catLabel = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    var catUrl = BASE + '/' + parts[0] + '/';
    items.push({ position: 2, name: catLabel, item: catUrl });
    items.push({ position: 3, name: pageTitle, item: pageUrl });
  } else if (parts.length === 3) {
    // e.g. /engineering/afrodraft/app
    var catLabel2 = labels[parts[0]];
    if (!catLabel2) catLabel2 = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    var catUrl2 = BASE + '/' + parts[0] + '/';
    var subLabel = labels[parts[1]] || (parts[1].charAt(0).toUpperCase() + parts[1].slice(1).replace(/-/g, ' '));
    var subUrl = BASE + '/' + parts[0] + '/' + parts[1] + '/';
    items.push({ position: 2, name: catLabel2, item: catUrl2 });
    items.push({ position: 3, name: subLabel, item: subUrl });
    items.push({ position: 4, name: pageTitle, item: pageUrl });
  }

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map(function(it) {
      return { '@type': 'ListItem', 'position': it.position, 'name': it.name, 'item': it.item };
    })
  };

  return '<script type="application/ld+json">\n' + JSON.stringify(schema, null, 2) + '\n</script>';
}

var files = findHtmlFiles(root, 0);

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(root + path.sep, '');

  // Skip if already has BreadcrumbList
  if (html.includes('BreadcrumbList')) { skipped++; return; }
  // Skip if no og:title (not a real page)
  if (!html.includes('og:title')) { skipped++; return; }

  var schema = buildBreadcrumb(html, rel);
  if (!schema) { skipped++; return; }

  var newHtml = html.replace('</head>', schema + '\n</head>');
  if (newHtml !== html) {
    fs.writeFileSync(f, newHtml, 'utf8');
    fixed++;
  }
});

console.log('Added BreadcrumbList to ' + fixed + ' pages. Skipped: ' + skipped);
