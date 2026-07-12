#!/usr/bin/env node
/**
 * AFROTOOLS — Sitemap Generator
 * ===================================================================
 * Generates sitemap.xml from the tool registry + known static pages.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *
 * Output: sitemap.xml in repo root
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://afrotools.com';
const TODAY = new Date().toISOString().split('T')[0];

// ── LOAD TOOL REGISTRY ──────────────────────────────────

// We need to eval the registry file since it uses `var AFRO_TOOLS = ...` pattern
const registryPath = path.join(__dirname, '..', 'assets', 'js', 'components', 'tool-registry.js');
const registryCode = fs.readFileSync(registryPath, 'utf8');

// Create a minimal DOM-free environment
const sandbox = { document: { readyState: 'complete', getElementById: () => null, createElement: () => ({ textContent: '' }), head: { appendChild: () => {} }, addEventListener: () => {}, dispatchEvent: () => {}, querySelector: () => null } };
function FakeEvent() {}
const fn = new Function('document', 'CustomEvent', registryCode + '\nreturn { AFRO_TOOLS, AFRO_CATEGORIES };');
const { AFRO_TOOLS, AFRO_CATEGORIES } = fn(sandbox.document, FakeEvent);

console.log(`Loaded ${AFRO_TOOLS.length} tools from registry`);

// ── STATIC PAGES ──────────────────────────────────────────

const staticPages = [
  { url: '/',                  priority: '1.0', changefreq: 'daily' },
  { url: '/tools/',            priority: '0.9', changefreq: 'weekly' },
  { url: '/pricing/',          priority: '0.7', changefreq: 'monthly' },
  { url: '/developers/',       priority: '0.6', changefreq: 'monthly' },
  { url: '/search/',           priority: '0.5', changefreq: 'weekly' },
  { url: '/about/',            priority: '0.5', changefreq: 'monthly' },
  { url: '/privacy/',          priority: '0.3', changefreq: 'yearly' },
  { url: '/terms/',            priority: '0.3', changefreq: 'yearly' },
  { url: '/contact/',          priority: '0.5', changefreq: 'monthly' },
  { url: '/suggest-tool/',     priority: '0.4', changefreq: 'monthly' },
  { url: '/faq/',              priority: '0.5', changefreq: 'monthly' },
  { url: '/advertise/',        priority: '0.4', changefreq: 'monthly' },
  { url: '/api/',              priority: '0.6', changefreq: 'monthly' },
  { url: '/tools/paye-calculator/', priority: '0.9', changefreq: 'weekly' },
];

// Pages to exclude from sitemap (redirects, non-canonical, private, etc.)
const EXCLUDED_URLS = new Set([
  '/dashboard/', '/admin/', '/offline.html', '/pro/', '/salary-tax/',
  // Audit fix: exclude redirect sources (non-canonical)
  '/nigeria/ng-paye', '/nigeria/ng-paye/',
  '/tools/paye-calculator/', '/tools/paye-calculator',
  '/fr/cote-divoire/', '/fr/cote-divoire',
  '/categories/financial/', '/categories/financial',
  '/privacy-policy', '/privacy-policy/', '/privacy-policy.html',
  '/terms-of-use', '/terms-of-use/', '/terms-of-use.html',
  '/developer/', '/developer',
  // Audit fix: exclude non-canonical country hub aliases
  '/central-african-republic/', '/central-african-republic',
  // Audit fix: exclude admin/internal pages
  '/afrotools-mission-control.html', '/style-guide.html', '/logo-system.html',
  '/nigeria/index_old.html',
]);

// Also parse netlify.toml for 301/302 redirect sources
const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
  const redirectPattern = /from\s*=\s*"([^"]+)"[\s\S]*?status\s*=\s*(301|302)/g;
  let match;
  while ((match = redirectPattern.exec(tomlContent)) !== null) {
    const from = match[1].replace(/\*/g, '').replace(/\/+$/, '');
    if (from) {
      EXCLUDED_URLS.add(from);
      EXCLUDED_URLS.add(from + '/');
    }
  }
}

// ── FRENCH / FRANCOPHONE PAGES ────────────────────────
const frDir = path.join(__dirname, '..', 'fr');
const frenchPages = [];
if (fs.existsSync(frDir)) {
  const walkFr = (dir, base) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      if (entry.isDirectory()) {
        walkFr(path.join(dir, entry.name), `${base}/${entry.name}`);
      } else if (entry.name === 'index.html') {
        frenchPages.push({ url: `${base}/`, priority: '0.7', changefreq: 'weekly' });
      } else if (entry.name.endsWith('.html')) {
        frenchPages.push({ url: `${base}/${entry.name.replace('.html', '')}`, priority: '0.7', changefreq: 'weekly' });
      }
    });
  };
  // Add fr hub
  if (fs.existsSync(path.join(frDir, 'index.html'))) {
    frenchPages.push({ url: '/fr/', priority: '0.8', changefreq: 'weekly' });
  }
  fs.readdirSync(frDir, { withFileTypes: true }).forEach(entry => {
    if (entry.isDirectory()) {
      walkFr(path.join(frDir, entry.name), `/fr/${entry.name}`);
    }
  });
}

// ── CATEGORY PAGES ──────────────────────────────────────

const categoryPages = Object.values(AFRO_CATEGORIES || {}).map(cat => ({
  url: cat.href,
  priority: '0.8',
  changefreq: 'weekly',
}));

// ── TOOL PAGES ──────────────────────────────────────────

const toolPages = AFRO_TOOLS
  .filter(t => t.status === 'live' || t.status === 'new')
  .map(t => ({
    url: t.href,
    priority: t.tier === 'T1' ? '0.9' : t.tier === 'T2' ? '0.7' : '0.6',
    changefreq: 'weekly',
  }));

// ── COUNTRY HUB PAGES ─────────────────────────────────

// Extract unique country slugs from tool hrefs (e.g., /nigeria/ng-salary-tax → /nigeria/)
const countryHubSet = new Set();
AFRO_TOOLS.forEach(t => {
  if (t.countries && !t.countries.includes('ALL') && t.href) {
    const match = t.href.match(/^\/([a-z-]+)\//);
    if (match && !match[1].startsWith('tools')) {
      countryHubSet.add('/' + match[1] + '/');
    }
  }
});
const countryHubs = Array.from(countryHubSet).map(url => ({
  url,
  priority: '0.8',
  changefreq: 'monthly',
}));

// ── BLOG PAGES ──────────────────────────────────────────

const blogDir = path.join(__dirname, '..', 'blog');
const blogPages = [{ url: '/blog/', priority: '0.8', changefreq: 'weekly' }];
if (fs.existsSync(blogDir)) {
  fs.readdirSync(blogDir).forEach(entry => {
    const entryPath = path.join(blogDir, entry);
    if (fs.statSync(entryPath).isDirectory() && entry !== 'assets') {
      const indexFile = path.join(entryPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        blogPages.push({ url: `/blog/${entry}/`, priority: '0.6', changefreq: 'monthly' });
      }
    }
  });
}

// ── DEDUPLICATE & GENERATE ─────────────────────────────

const allPages = [...staticPages, ...categoryPages, ...countryHubs, ...toolPages, ...blogPages, ...frenchPages];

// Deduplicate by URL, exclude non-canonical pages, and verify files exist
const rootDir = path.join(__dirname, '..');
const seen = new Set();
let excludedCount = 0;
const uniquePages = allPages.filter(p => {
  // Normalize URL to trailing-slash version
  const normalized = p.url.endsWith('/') || p.url.includes('.') ? p.url : p.url + '/';
  const key = normalized.replace(/\/$/, '');
  if (seen.has(key)) return false;
  if (EXCLUDED_URLS.has(normalized) || EXCLUDED_URLS.has(key) || EXCLUDED_URLS.has(key + '/')) {
    excludedCount++;
    return false;
  }
  // Verify the actual file exists on disk
  const urlPath = key.replace(/^\//, '');
  const possiblePaths = [
    path.join(rootDir, urlPath, 'index.html'),
    path.join(rootDir, urlPath + '.html'),
    path.join(rootDir, urlPath),
  ];
  const fileExists = possiblePaths.some(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!fileExists && key !== '') {
    excludedCount++;
    return false;
  }
  seen.add(key);
  // Ensure trailing slash on directory URLs
  if (!p.url.endsWith('/') && !p.url.includes('.')) p.url = p.url + '/';
  return true;
});

// Sort: homepage first, then alphabetically
uniquePages.sort((a, b) => {
  if (a.url === '/') return -1;
  if (b.url === '/') return 1;
  return a.url.localeCompare(b.url);
});

// Generate XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePages.map(p => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

// Write
const outPath = path.join(__dirname, '..', 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');

console.log(`Generated sitemap.xml with ${uniquePages.length} URLs`);
console.log(`  Static: ${staticPages.length}`);
console.log(`  Categories: ${categoryPages.length}`);
console.log(`  Country hubs: ${countryHubs.length}`);
console.log(`  Tool pages: ${toolPages.length}`);
console.log(`  Blog posts: ${blogPages.length}`);
console.log(`  French pages: ${frenchPages.length}`);
console.log(`  Excluded (redirects/missing): ${excludedCount}`);
