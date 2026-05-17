#!/usr/bin/env node
/**
 * Build the crawlable /tools/ fallback directory.
 *
 * The client registry still powers rich filtering, but this script makes the
 * first HTML response useful when JavaScript or registry hydration fails.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'assets/js/components/tool-registry.js');
const TOOLS_PAGE = path.join(ROOT, 'tools/index.html');
const DIRECTORY_JSON_PATH = path.join(ROOT, 'data/tool-directory.json');
const AUDIT_DATE = new Date().toISOString().slice(0, 10);

const COUNTRY_NAMES = [
  'Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt', 'Tanzania', 'Uganda', 'Rwanda',
  'Ethiopia', 'Senegal', 'Cameroon', 'Morocco', 'Algeria', 'Tunisia', 'Zambia', 'Zimbabwe',
  'Botswana', 'Namibia', 'Malawi', 'Mauritius', 'Seychelles', 'Benin', 'Togo', 'Mali',
  'Niger', 'Liberia', 'Gambia', 'Somalia', 'Djibouti', 'Eritrea', 'Comoros', 'Angola',
  'Mozambique', 'Libya', 'Sudan', 'Madagascar', 'Burundi', 'Gabon', 'Chad', 'Guinea',
  'Lesotho', 'Sierra Leone', 'Cote dIvoire', "Cote d'Ivoire", "Côte d'Ivoire",
  'Cape Verde', 'DR Congo', 'Republic of Congo', 'Central African Republic', 'South Sudan',
  'Equatorial Guinea', 'Guinea-Bissau', 'Burkina Faso', 'Sao Tome', 'São Tomé'
];

function loadRegistry() {
  const code = fs.readFileSync(REGISTRY_PATH, 'utf8');
  function FakeEvent() {}
  const sandbox = {
    window: {},
    CustomEvent: FakeEvent,
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '', style: {}, appendChild() {} }),
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      querySelector: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: REGISTRY_PATH });
  return {
    tools: sandbox.AFRO_TOOLS || [],
    categories: sandbox.AFRO_CATEGORIES || {},
    getPublicToolStats: sandbox.getPublicToolStats,
    getTotalToolCount: sandbox.getTotalToolCount,
  };
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHref(href, fallback) {
  return String(href || fallback || '')
    .replace(/\/index\.html$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

function getCountDetails(tools, filterFn) {
  const rows = tools.filter((tool) => {
    const langOk = !tool.lang || tool.lang === 'en';
    return langOk && (typeof filterFn === 'function' ? filterFn(tool) : true);
  });
  const hrefs = [];
  const seen = new Set();
  const weightedFamilies = new Map();
  for (const tool of rows) {
    const hrefKey = normalizeHref(tool.href, tool.id);
    if (!seen.has(hrefKey)) {
      seen.add(hrefKey);
      hrefs.push(hrefKey);
    }
    const count = Number(tool.toolCount) || 1;
    if (count > 1 && count > (weightedFamilies.get(hrefKey) || 0)) {
      weightedFamilies.set(hrefKey, count);
    }
  }
  let hiddenVariants = 0;
  for (const [familyHref, declaredCount] of weightedFamilies.entries()) {
    const explicitFamilyUrls = hrefs.filter((href) => href === familyHref || href.startsWith(familyHref + '/')).length;
    hiddenVariants += Math.max(0, declaredCount - explicitFamilyUrls);
  }
  return {
    registry_entries: rows.length,
    unique_urls: hrefs.length,
    country_variant_instances: hiddenVariants,
    tool_country_instances: hrefs.length + hiddenVariants,
  };
}

function inferCountries(tool) {
  const explicit = tool.countries || tool.country || tool.countryName;
  if (Array.isArray(explicit) && explicit.length) return explicit;
  if (typeof explicit === 'string' && explicit.trim()) return [explicit.trim()];
  if (Number(tool.toolCount) >= 54) return ['All African countries'];

  const haystack = normalize([tool.name, tool.desc, tool.href, tool.id].join(' '));
  const matches = COUNTRY_NAMES.filter((country) => haystack.includes(normalize(country)));
  return matches.length ? Array.from(new Set(matches)) : ['Pan-African'];
}

function statusLabel(tool) {
  if (tool.status === 'live' || tool.status === 'new') return 'Live';
  if (tool.status === 'beta') return 'Beta';
  return 'Coming soon';
}

function statusClass(tool) {
  const label = tool.status === 'Live' || tool.status === 'Beta' || tool.status === 'Coming soon'
    ? tool.status
    : statusLabel(tool);
  return label.toLowerCase().replace(/\s+/g, '-');
}

function lastUpdated(tool) {
  return tool.lastVerified || tool.last_verified || tool.updated || tool.lastUpdated || tool.last_updated || AUDIT_DATE;
}

function toolRecord(tool, categories) {
  const category = categories[tool.category] || {};
  return {
    id: tool.id,
    name: tool.name,
    description: tool.desc || '',
    category_key: tool.category || 'uncategorized',
    category: category.name || tool.category || 'Uncategorized',
    countries: inferCountries(tool),
    status: statusLabel(tool),
    language: tool.lang || 'en',
    last_updated: lastUpdated(tool),
    url: tool.href || '/tools/' + tool.id + '/',
    priority: Number(tool.priority || 0),
  };
}

function buildFallbackHtml(records) {
  const grouped = new Map();
  for (const record of records) {
    if (!grouped.has(record.category_key)) grouped.set(record.category_key, []);
    grouped.get(record.category_key).push(record);
  }
  const sections = Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, tools]) => {
      tools.sort((a, b) => (b.priority - a.priority) || a.name.localeCompare(b.name));
      const cards = tools.map((tool) => {
        const live = tool.status === 'Live';
        const href = live ? ` href="${escapeHtml(tool.url)}"` : '';
        const tag = live ? 'a' : 'div';
        const countryText = tool.countries.join(', ');
        return `      <${tag} class="tc static-tool-card" data-tool-card data-category="${escapeHtml(tool.category_key)}" data-country="${escapeHtml(countryText)}" data-status="${escapeHtml(statusClass(tool))}" data-language="${escapeHtml(tool.language)}"${href}>
        <div class="tc-top"><div class="tc-icon">🛠️</div><h3>${escapeHtml(tool.name)}</h3></div>
        <p>${escapeHtml(tool.description)}</p>
        <div class="tc-meta"><span><strong>Countries:</strong> ${escapeHtml(countryText)}</span><span><strong>Category:</strong> ${escapeHtml(tool.category)}</span><span><strong>Language:</strong> ${escapeHtml(tool.language.toUpperCase())} · <strong>Updated:</strong> ${escapeHtml(tool.last_updated)}</span></div>
        <div class="tc-foot"><span class="tc-badge ${live ? 'tc-badge-live' : 'tc-badge-soon'}">${escapeHtml(tool.status)}</span><span class="tc-cta">${live ? 'Open Tool' : 'Coming Soon'} →</span></div>
      </${tag}>`;
      }).join('\n');

      return `  <section class="tools-section static-tool-section" data-static-category="${escapeHtml(key)}">
    <div class="section-header"><div class="section-icon">🛠️</div><h2 class="section-title">${escapeHtml(tools[0].category)}</h2><div class="section-count">${tools.length} registry rows</div></div>
    <div class="tg-grid">
${cards}
    </div>
  </section>`;
    });

  return `<p class="directory-note">Static fallback generated from the AfroTools registry on ${AUDIT_DATE}. Filters and search enhance this list when JavaScript loads; without JavaScript, every registry row below remains crawlable.</p>
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

const { tools, categories, getPublicToolStats } = loadRegistry();
const records = tools
  .filter((tool) => !tool.lang || tool.lang === 'en')
  .map((tool) => toolRecord(tool, categories));
const publicStats = typeof getPublicToolStats === 'function' ? getPublicToolStats('en') : null;

fs.mkdirSync(path.dirname(DIRECTORY_JSON_PATH), { recursive: true });
writeFileSyncWithRetry(DIRECTORY_JSON_PATH, JSON.stringify(records, null, 2) + '\n', 'utf8');

const toolsPage = fs.readFileSync(TOOLS_PAGE, 'utf8');
const updatedToolsPage = replaceFallback(toolsPage, buildFallbackHtml(records));
writeFileSyncWithRetry(TOOLS_PAGE, updatedToolsPage, 'utf8');

console.log(`Built ${records.length} crawlable tool rows`);
if (publicStats) console.log(`Public live tool count: ${publicStats.liveTools}`);
