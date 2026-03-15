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
  { url: '/all-tools/',        priority: '0.9', changefreq: 'weekly' },
  { url: '/pricing/',          priority: '0.7', changefreq: 'monthly' },
  { url: '/developers/',       priority: '0.6', changefreq: 'monthly' },
  { url: '/style-guide.html',  priority: '0.3', changefreq: 'monthly' },
  { url: '/search/',           priority: '0.5', changefreq: 'weekly' },
];

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

// ── DEDUPLICATE & GENERATE ─────────────────────────────

const allPages = [...staticPages, ...categoryPages, ...countryHubs, ...toolPages];

// Deduplicate by URL
const seen = new Set();
const uniquePages = allPages.filter(p => {
  const key = p.url.replace(/\/$/, ''); // normalize
  if (seen.has(key)) return false;
  seen.add(key);
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
