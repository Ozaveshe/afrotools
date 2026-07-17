#!/usr/bin/env node
'use strict';

/**
 * Build the crawlable /tools/ fallback directory from the validated canonical
 * registry. The client registry still powers rich filtering.
 */

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const registryApi = require('./lib/canonical-registry');

const ROOT = path.join(__dirname, '..');
const TOOLS_PAGE = path.join(ROOT, 'tools/index.html');
const DIRECTORY_JSON_PATH = path.join(ROOT, 'data/tool-directory.json');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inferCountries(tool, countryById) {
  if (tool.applicability.scope === 'pan-african') return ['All African countries'];
  const names = tool.applicability.countryIds
    .map((id) => countryById.get(id))
    .filter(Boolean)
    .map((country) => country.title);
  return names.length ? names : ['Regional'];
}

function statusClass(status) {
  return String(status || '').toLowerCase().replace(/\s+/g, '-');
}

function toolRecord(tool, categoryById, countryById) {
  const category = categoryById.get(tool.categoryId) || {};
  return {
    id: tool.id,
    name: tool.title,
    description: tool.description || '',
    category_key: tool.categoryId || 'uncategorized',
    category: category.title || tool.categoryId || 'Uncategorized',
    countries: inferCountries(tool, countryById),
    status: 'Live',
    language: tool.localeCoverage[0] || 'en',
    last_updated: tool.dataFreshness.asOf || null,
    url: tool.route,
    priority: Number(tool.source.priority || 0),
    aliases: tool.routeAliases.slice()
  };
}

function buildFallbackHtml(records) {
  const grouped = new Map();
  records.forEach((record) => {
    if (!grouped.has(record.category_key)) grouped.set(record.category_key, []);
    grouped.get(record.category_key).push(record);
  });

  const sections = [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, tools]) => {
      tools.sort((a, b) => (b.priority - a.priority) || a.name.localeCompare(b.name));
      const cards = tools.map((tool) => {
        const countryText = tool.countries.join(', ');
        const freshness = tool.last_updated || 'Not dated';
        return `      <a class="tc static-tool-card" data-tool-card data-directory-record data-category="${escapeHtml(tool.category_key)}" data-country="${escapeHtml(countryText)}" data-status="${statusClass(tool.status)}" data-language="${escapeHtml(tool.language)}" href="${escapeHtml(tool.url)}">
        <div class="tc-top"><div class="tc-icon">AT</div><h3>${escapeHtml(tool.name)}</h3></div>
        <p>${escapeHtml(tool.description)}</p>
        <div class="tc-meta"><span><strong>Countries:</strong> ${escapeHtml(countryText)}</span><span><strong>Category:</strong> ${escapeHtml(tool.category)}</span><span><strong>Language:</strong> ${escapeHtml(tool.language.toUpperCase())} &middot; <strong>Data as of:</strong> ${escapeHtml(freshness)}</span></div>
        <div class="tc-foot"><span class="tc-badge tc-badge-live">Live</span><span class="tc-cta">Open Tool &rarr;</span></div>
      </a>`;
      }).join('\n');

      return `  <section class="tools-section static-tool-section" data-static-category="${escapeHtml(key)}">
    <div class="section-header"><div class="section-icon">AT</div><h2 class="section-title">${escapeHtml(tools[0].category)}</h2><div class="section-count">${tools.length} canonical records</div></div>
    <div class="tg-grid">
${cards}
    </div>
  </section>`;
    });

  return `<p class="directory-note">Static fallback generated from the validated canonical AfroTools registry. Filters and search enhance this list when JavaScript loads; without JavaScript, every published canonical record below remains crawlable.</p>
${sections.join('\n')}`;
}

function replaceFallback(html, fallback) {
  const start = '<!-- TOOL_DIRECTORY_FALLBACK_START -->';
  const end = '<!-- TOOL_DIRECTORY_FALLBACK_END -->';
  if (!html.includes(start) || !html.includes(end)) {
    throw new Error('Missing tool directory fallback markers in tools/index.html');
  }
  return html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${fallback}\n    ${end}`);
}

const registry = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(registry);
if (!validation.ok) throw new Error(validation.errors.map(registryApi.formatIssue).join('\n'));

const categoryById = new Map(registry.categories.map((category) => [category.id, category]));
const countryById = new Map(registry.countries.map((country) => [country.id, country]));
const records = registry.tools
  .filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated && tool.localeCoverage.includes('en'))
  .map((tool) => toolRecord(tool, categoryById, countryById));

fs.mkdirSync(path.dirname(DIRECTORY_JSON_PATH), { recursive: true });
writeFileSyncWithRetry(DIRECTORY_JSON_PATH, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

const toolsPage = fs.readFileSync(TOOLS_PAGE, 'utf8');
writeFileSyncWithRetry(TOOLS_PAGE, replaceFallback(toolsPage, buildFallbackHtml(records)), 'utf8');

console.log(`Built ${records.length} crawlable canonical tool rows`);
console.log(`Live tool experiences: ${registryApi.getSelector(registry, 'tools.live_experiences').value}`);
