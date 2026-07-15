#!/usr/bin/env node
/**
 * inject-internal-links.js
 * Injects static <nav> sections with links to sibling HTML pages into
 * index.html files that generate links via JavaScript only.
 *
 * This ensures Google can discover sub-pages from raw HTML without
 * needing to execute JavaScript, while still pointing crawlers at the
 * preferred canonical route instead of the raw .html file path.
 *
 * Targets:
 *   1. Agriculture tool index pages → country sub-pages
 *   2. Country hub pages → PAYE, VAT sub-pages
 *   3. Tool pages with country variants → country sub-pages
 *   4. French (/fr/) mirrors of all the above
 *
 * Usage: node scripts/inject-internal-links.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { ROOT, preferredRouteForFile } = require('./lib/canonical-aliases');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

// Country slug → readable name
const COUNTRY_NAMES = {
  'algeria': 'Algeria', 'angola': 'Angola', 'benin': 'Benin',
  'botswana': 'Botswana', 'burkina-faso': 'Burkina Faso', 'burundi': 'Burundi',
  'cabo-verde': 'Cabo Verde', 'cameroon': 'Cameroon', 'cape-verde': 'Cape Verde',
  'car': 'Central African Republic', 'central-african-republic': 'Central African Republic',
  'chad': 'Chad', 'comoros': 'Comoros', 'congo': 'Congo', 'congo-brazzaville': 'Congo-Brazzaville',
  'cote-d-ivoire': "C\u00F4te d'Ivoire", 'cote-divoire': "C\u00F4te d'Ivoire",
  'djibouti': 'Djibouti', 'dr-congo': 'DR Congo', 'drc': 'DR Congo',
  'egypt': 'Egypt', 'eq-guinea': 'Equatorial Guinea', 'equatorial-guinea': 'Equatorial Guinea',
  'eritrea': 'Eritrea', 'eswatini': 'Eswatini', 'ethiopia': 'Ethiopia',
  'gabon': 'Gabon', 'gambia': 'Gambia', 'ghana': 'Ghana',
  'guinea': 'Guinea', 'guinea-bissau': 'Guinea-Bissau',
  'kenya': 'Kenya', 'lesotho': 'Lesotho', 'liberia': 'Liberia', 'libya': 'Libya',
  'madagascar': 'Madagascar', 'malawi': 'Malawi', 'mali': 'Mali',
  'mauritania': 'Mauritania', 'mauritius': 'Mauritius', 'morocco': 'Morocco',
  'mozambique': 'Mozambique', 'namibia': 'Namibia', 'niger': 'Niger', 'nigeria': 'Nigeria',
  'rwanda': 'Rwanda', 'sao-tome': 'S\u00E3o Tom\u00E9 & Pr\u00EDncipe',
  'sao-tome-and-principe': 'S\u00E3o Tom\u00E9 & Pr\u00EDncipe',
  'senegal': 'Senegal', 'seychelles': 'Seychelles', 'sierra-leone': 'Sierra Leone',
  'somalia': 'Somalia', 'south-africa': 'South Africa', 'south-sudan': 'South Sudan',
  'sudan': 'Sudan', 'tanzania': 'Tanzania', 'togo': 'Togo',
  'tunisia': 'Tunisia', 'uganda': 'Uganda', 'zambia': 'Zambia', 'zimbabwe': 'Zimbabwe',
  // French-named country directories
  'algerie': 'Alg\u00E9rie', 'cameroun': 'Cameroun', 'guinee': 'Guin\u00E9e',
  'maroc': 'Maroc', 'rdc': 'RDC', 'tunisie': 'Tunisie', 'senegal-fr': 'S\u00E9n\u00E9gal',
  'tchad': 'Tchad', 'togo-fr': 'Togo', 'benin-fr': 'B\u00E9nin'
};

// Tool slug → readable name
function slugToName(slug) {
  return slug
    .replace(/\.[^.]+$/, '')       // strip extension
    .replace(/^[a-z]{2}-/, '')     // strip country code prefix (ng-, dz-, etc.)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const SEO_NAV_MARKER = '<!-- seo-internal-links -->';
const RELATED_START = '<!-- RELATED_TOOLS_SSR_START -->';
const RELATED_END = '<!-- RELATED_TOOLS_SSR_END -->';
const RELATED_BLOCK_RE = /<!-- RELATED_TOOLS_SSR_START -->[\s\S]*?<!-- RELATED_TOOLS_SSR_END -->/g;
const RELATED_DATA_SCRIPT_RE = /\s*<script\b[^>]*src=["'][^"']*related-tools-data(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>\s*/gi;
const RELATED_LAZY_SCRIPT_RE = /\s*<script\b[^>]*src=["'][^"']*lazy-related-tools\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>\s*/gi;
const RELATED_INLINE_ASSET_LINE_RE = /^\s*["']\/assets\/js\/components\/related-tools(?:-data)?(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'],?\s*$/gmi;
const RELATED_COMPONENT_SCRIPT_RE = /<script\b[^>]*src=["'][^"']*related-tools(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>/i;
const TOOL_DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const RELATED_COMPONENT_PATH = path.join(ROOT, 'assets', 'js', 'components', 'related-tools.min.js');

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function routeToRelativeFile(route) {
  const pathname = String(route || '').split(/[?#]/)[0];
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return '';
  const relative = pathname.replace(/^\/+/, '');
  return (pathname.endsWith('/') ? path.posix.join(relative, 'index.html') : `${relative}.html`).replace(/\\/g, '/');
}

function initials(value) {
  return String(value || 'AT')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('') || 'AT';
}

function directoryTools() {
  const rows = JSON.parse(fs.readFileSync(TOOL_DIRECTORY_PATH, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('data/tool-directory.json must contain an array');
  return rows.filter((tool) => tool && tool.language === 'en' && String(tool.status).toLowerCase() === 'live' && routeToRelativeFile(tool.url));
}

function sortDirectoryTools(a, b) {
  return Number(b.priority || 0) - Number(a.priority || 0) || String(a.name).localeCompare(String(b.name));
}

function relatedForTool(current, allTools) {
  const sameCategory = allTools
    .filter((tool) => tool.id !== current.id && tool.url !== current.url && tool.category_key === current.category_key)
    .sort(sortDirectoryTools);
  const selected = sameCategory.slice(0, 6);
  if (selected.length < 4) {
    const selectedIds = new Set(selected.map((tool) => tool.id));
    const fallback = allTools
      .filter((tool) => tool.id !== current.id && tool.url !== current.url && !selectedIds.has(tool.id))
      .sort(sortDirectoryTools)
      .slice(0, 4 - selected.length);
    selected.push(...fallback);
  }
  return selected.slice(0, 6);
}

function relatedNav(tool, related) {
  const links = related.map((item) => {
    const description = String(item.description || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    return `<li><a href="${escapeHtml(item.url)}" data-related-tool data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}" data-category="${escapeHtml(item.category_key || '')}" data-icon="${escapeHtml(initials(item.name))}" data-desc="${escapeHtml(description)}">${escapeHtml(item.name)}</a></li>`;
  }).join('');
  return `${RELATED_START}
<nav class="seo-links related-tools-ssr" data-related-tools-ssr aria-label="Related tools">
<h2 class="seo-links-title">Related tools</h2>
<ul class="seo-links-list">${links}</ul>
</nav>
${RELATED_END}`;
}

function setAttribute(attributes, name, value) {
  const pattern = new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, 'i');
  const next = ` ${name}="${escapeHtml(value)}"`;
  return pattern.test(attributes) ? attributes.replace(pattern, next) : `${attributes}${next}`;
}

function insertBeforeFirst(html, anchors, block) {
  for (const anchor of anchors) {
    // For the </body> fallback, target the LAST occurrence — the real page
    // close — so we never inject inside an earlier `document.write('...</body>...')`
    // string literal (which would break that inline script with a raw </script>).
    const index = anchor === '</body>' ? html.lastIndexOf(anchor) : html.indexOf(anchor);
    if (index !== -1) return `${html.slice(0, index).replace(/\s*$/, '\n')}${block}\n${html.slice(index)}`;
  }
  return html;
}

let relatedComponentTag = '';
function getRelatedComponentTag() {
  if (relatedComponentTag) return relatedComponentTag;
  const content = fs.readFileSync(RELATED_COMPONENT_PATH, 'utf8').replace(/\r\n?/g, '\n');
  const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  relatedComponentTag = `<script src="/assets/js/components/related-tools.min.js?v=${hash}" defer></script>`;
  return relatedComponentTag;
}

function transformRelatedTools(html, tool, related) {
  const nav = relatedNav(tool, related);
  let output = html.replace(RELATED_BLOCK_RE, '');
  RELATED_BLOCK_RE.lastIndex = 0;
  const hostPattern = /<afro-related-tools\b([^>]*)>([\s\S]*?)<\/afro-related-tools>/i;
  const hostMatch = output.match(hostPattern);

  if (hostMatch) {
    let attributes = hostMatch[1];
    attributes = setAttribute(attributes, 'data-ssr', '1');
    attributes = setAttribute(attributes, 'category', tool.category_key || '');
    attributes = setAttribute(attributes, 'current', tool.id);
    const existingContent = hostMatch[2].trim();
    const replacement = `<afro-related-tools${attributes}>${existingContent ? `\n${existingContent}` : ''}\n${nav}\n</afro-related-tools>`;
    // Use a replacer function so dollar amounts in generated descriptions
    // (for example "$165") are never interpreted as $1 capture tokens.
    output = output.replace(hostPattern, () => replacement);
  } else {
    const host = `<afro-related-tools data-ssr="1" category="${escapeHtml(tool.category_key || '')}" current="${escapeHtml(tool.id)}">\n${nav}\n</afro-related-tools>`;
    output = insertBeforeFirst(output, ['<afro-newsletter-cta', '<afro-footer', '</body>'], host);
  }

  output = output.replace(RELATED_DATA_SCRIPT_RE, '\n');
  RELATED_DATA_SCRIPT_RE.lastIndex = 0;
  output = output.replace(RELATED_LAZY_SCRIPT_RE, '\n');
  RELATED_LAZY_SCRIPT_RE.lastIndex = 0;
  output = output.replace(RELATED_INLINE_ASSET_LINE_RE, '');
  RELATED_INLINE_ASSET_LINE_RE.lastIndex = 0;
  if (!RELATED_COMPONENT_SCRIPT_RE.test(output)) {
    output = insertBeforeFirst(output, ['</body>'], getRelatedComponentTag());
  }
  return output;
}

function processRelatedTools(options = {}) {
  const write = options.write !== false;
  const selectedFiles = options.files && options.files.length
    ? new Set(options.files.map((file) => String(file).replace(/\\/g, '/').replace(/^\.\//, '')))
    : null;
  const allTools = directoryTools();
  const stats = { targeted: 0, updated: 0, links: 0, dataScriptsRemoved: 0, componentScriptsAdded: 0, missing: [] };

  for (const tool of allTools) {
    const relative = routeToRelativeFile(tool.url);
    if (selectedFiles && !selectedFiles.has(relative)) continue;
    stats.targeted += 1;
    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute)) {
      stats.missing.push(relative);
      continue;
    }
    const original = fs.readFileSync(absolute, 'utf8');
    const related = relatedForTool(tool, allTools);
    const updated = transformRelatedTools(original, tool, related);
    stats.links += related.length;
    const hadDataScript = RELATED_DATA_SCRIPT_RE.test(original);
    RELATED_DATA_SCRIPT_RE.lastIndex = 0;
    const hasDataScript = RELATED_DATA_SCRIPT_RE.test(updated);
    RELATED_DATA_SCRIPT_RE.lastIndex = 0;
    if (hadDataScript && !hasDataScript) stats.dataScriptsRemoved += 1;
    if (!RELATED_COMPONENT_SCRIPT_RE.test(original) && RELATED_COMPONENT_SCRIPT_RE.test(updated)) stats.componentScriptsAdded += 1;
    if (updated === original) continue;
    stats.updated += 1;
    if (write) {
      writeFileSyncWithRetry(absolute, updated, 'utf8');
      const idempotent = transformRelatedTools(updated, tool, related);
      if (idempotent !== updated) throw new Error(`${relative}: related-tools injection is not idempotent`);
    }
  }

  if (selectedFiles) {
    for (const selected of selectedFiles) {
      if (!allTools.some((tool) => routeToRelativeFile(tool.url) === selected)) stats.missing.push(`${selected} (not in data/tool-directory.json)`);
    }
  }
  return stats;
}

const CATEGORY_CHILD_LINK_EXCLUSIONS = {
  health: new Set(['medical-aid', 'nhif'])
};

const TOOL_SUBPAGE_EXCLUSIONS = new Set([
  'admin.html'
]);

function isPublicHtmlSubPage(fileName) {
  return fileName.endsWith('.html') &&
    fileName !== 'index.html' &&
    !fileName.startsWith('_') &&
    !fileName.includes('_template') &&
    !fileName.includes('_old');
}

function injectLinks(indexPath, links, sectionTitle) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Remove existing injected block (idempotent)
  const markerStart = html.indexOf(SEO_NAV_MARKER);
  if (markerStart !== -1) {
    const markerEnd = html.lastIndexOf(SEO_NAV_MARKER);
    if (markerEnd !== -1) {
      html = html.slice(0, markerStart) + html.slice(markerEnd + SEO_NAV_MARKER.length);
    }
  }

  // Build link list
  const linkHtml = links.map(l =>
    `<li><a href="${l.href}">${l.text}</a></li>`
  ).join('');

  const navBlock = `${SEO_NAV_MARKER}
<nav class="seo-links" aria-label="${sectionTitle}">
<h2 class="seo-links-title">${sectionTitle}</h2>
<ul class="seo-links-list">${linkHtml}</ul>
</nav>
${SEO_NAV_MARKER}`;

  function insertGeneratedBlock(source, index, block) {
    const before = source.slice(0, index).replace(/\s*$/, '\n\n');
    const after = source.slice(index).replace(/^\s*/, '');
    return `${before}${block}\n${after}`;
  }

  // Inject before <afro-footer> or before </body>
  const footerIdx = html.indexOf('<afro-footer');
  if (footerIdx !== -1) {
    html = insertGeneratedBlock(html, footerIdx, navBlock);
  } else {
    const bodyIdx = html.lastIndexOf('</body>');
    if (bodyIdx !== -1) {
      html = insertGeneratedBlock(html, bodyIdx, navBlock);
    }
  }

  writeFileSyncWithRetry(indexPath, html, 'utf8');
}

// ── Process agriculture tool directories ──
function processAgriculture() {
  const agDir = path.join(ROOT, 'agriculture');
  if (!fs.existsSync(agDir)) return 0;

  let count = 0;
  const tools = fs.readdirSync(agDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const tool of tools) {
    const toolDir = path.join(agDir, tool.name);
    const indexPath = path.join(toolDir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;

    const countryFiles = fs.readdirSync(toolDir)
      .filter(f => isPublicHtmlSubPage(f))
      .sort();

    if (countryFiles.length === 0) continue;

    const toolName = slugToName(tool.name);
    const links = countryFiles.map(f => {
      const slug = f.replace('.html', '');
      const name = COUNTRY_NAMES[slug] || slugToName(slug);
      const filePath = path.join(toolDir, f);
      return {
        href: preferredRouteForFile(filePath),
        text: `${toolName} in ${name}`
      };
    });

    injectLinks(indexPath, links, `${toolName} \u2014 Available Countries`);
    count += countryFiles.length;
  }
  return count;
}

// ── Process country hub pages ──
function processCountryHubs() {
  let count = 0;
  const countryDirs = Object.keys(COUNTRY_NAMES);

  for (const dir of countryDirs) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir) || !fs.statSync(fullDir).isDirectory()) continue;

    const indexPath = path.join(fullDir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;

    const subPages = fs.readdirSync(fullDir)
      .filter(f => isPublicHtmlSubPage(f))
      .sort();

    if (subPages.length === 0) continue;

    const countryName = COUNTRY_NAMES[dir] || slugToName(dir);
    const links = subPages.map(f => {
      const name = slugToName(f);
      const filePath = path.join(fullDir, f);
      return {
        href: preferredRouteForFile(filePath),
        text: `${countryName} ${name} Calculator`
      };
    });

    injectLinks(indexPath, links, `${countryName} Tax Calculators`);
    count += subPages.length;
  }
  return count;
}

// ── Process tools with country sub-pages ──
function processToolSubPages() {
  const toolsDir = path.join(ROOT, 'tools');
  if (!fs.existsSync(toolsDir)) return 0;

  let count = 0;
  const tools = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const tool of tools) {
    const toolDir = path.join(toolsDir, tool.name);
    const indexPath = path.join(toolDir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;

    // Find country-named .html files
    const subFiles = fs.readdirSync(toolDir)
      .filter(f => isPublicHtmlSubPage(f))
      .filter(f => !TOOL_SUBPAGE_EXCLUSIONS.has(f))
      .filter(f => !(tool.name === 'africa-conflict' && f === 'detail.html'))
      .sort();

    if (subFiles.length < 2) continue;

    const toolName = slugToName(tool.name);

    // Separate country files from other sub-pages
    const countryFiles = subFiles.filter(f => COUNTRY_NAMES[f.replace('.html', '')] !== undefined);
    const otherFiles = subFiles.filter(f => COUNTRY_NAMES[f.replace('.html', '')] === undefined);

    const links = [];

    // Add non-country sub-pages first (e.g. actors.html, conflicts.html)
    for (const f of otherFiles) {
      const filePath = path.join(toolDir, f);
      links.push({
        href: preferredRouteForFile(filePath),
        text: `${toolName} \u2014 ${slugToName(f)}`
      });
    }

    // Then country pages
    for (const f of countryFiles) {
      const slug = f.replace('.html', '');
      const name = COUNTRY_NAMES[slug] || slugToName(slug);
      const filePath = path.join(toolDir, f);
      links.push({
        href: preferredRouteForFile(filePath),
        text: `${toolName} \u2014 ${name}`
      });
    }

    const title = countryFiles.length > otherFiles.length
      ? `${toolName} by Country`
      : `${toolName} \u2014 All Pages`;
    injectLinks(indexPath, links, title);
    count += countryFiles.length;
  }
  return count;
}

// ── Process French mirrors ──
function processFrench() {
  const frDir = path.join(ROOT, 'fr');
  if (!fs.existsSync(frDir)) return 0;

  let count = 0;

  // French country hubs
  const countryDirs = Object.keys(COUNTRY_NAMES);
  for (const dir of countryDirs) {
    const fullDir = path.join(frDir, dir);
    if (!fs.existsSync(fullDir) || !fs.statSync(fullDir).isDirectory()) continue;

    const indexPath = path.join(fullDir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;

    const subPages = fs.readdirSync(fullDir)
      .filter(f => isPublicHtmlSubPage(f))
      .sort();

    if (subPages.length === 0) continue;

    const countryName = COUNTRY_NAMES[dir] || slugToName(dir);
    const links = subPages.map(f => {
      const name = slugToName(f);
      const filePath = path.join(fullDir, f);
      return {
        href: preferredRouteForFile(filePath),
        text: `${countryName} ${name}`
      };
    });

    injectLinks(indexPath, links, `Calculateurs fiscaux \u2014 ${countryName}`);
    count += subPages.length;
  }

  // French agriculture
  const frAgDir = path.join(frDir, 'agriculture');
  if (fs.existsSync(frAgDir)) {
    const tools = fs.readdirSync(frAgDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const tool of tools) {
      const toolDir = path.join(frAgDir, tool.name);
      const indexPath = path.join(toolDir, 'index.html');
      if (!fs.existsSync(indexPath)) continue;

      const countryFiles = fs.readdirSync(toolDir)
        .filter(f => isPublicHtmlSubPage(f))
        .sort();

      if (countryFiles.length === 0) continue;

      const toolName = slugToName(tool.name);
      const links = countryFiles.map(f => {
        const slug = f.replace('.html', '');
        const name = COUNTRY_NAMES[slug] || slugToName(slug);
        const filePath = path.join(toolDir, f);
        return {
          href: preferredRouteForFile(filePath),
          text: `${toolName} \u2014 ${name}`
        };
      });

      injectLinks(indexPath, links, `${toolName} \u2014 Pays disponibles`);
      count += countryFiles.length;
    }
  }

  // French tools
  const frToolsDir = path.join(frDir, 'tools');
  if (fs.existsSync(frToolsDir)) {
    const tools = fs.readdirSync(frToolsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const tool of tools) {
      const toolDir = path.join(frToolsDir, tool.name);
      const indexPath = path.join(toolDir, 'index.html');
      if (!fs.existsSync(indexPath)) continue;

      const subFiles = fs.readdirSync(toolDir)
        .filter(f => isPublicHtmlSubPage(f))
        .sort();

      if (subFiles.length < 2) continue;

      const toolName = slugToName(tool.name);
      const countryFiles = subFiles.filter(f => COUNTRY_NAMES[f.replace('.html', '')] !== undefined);
      const otherFiles = subFiles.filter(f => COUNTRY_NAMES[f.replace('.html', '')] === undefined);

      const links = [];
      for (const f of otherFiles) {
        const filePath = path.join(toolDir, f);
        links.push({
          href: preferredRouteForFile(filePath),
          text: `${toolName} \u2014 ${slugToName(f)}`
        });
      }
      for (const f of countryFiles) {
        const slug = f.replace('.html', '');
        const name = COUNTRY_NAMES[slug] || slugToName(slug);
        const filePath = path.join(toolDir, f);
        links.push({
          href: preferredRouteForFile(filePath),
          text: `${toolName} \u2014 ${name}`
        });
      }

      const title = countryFiles.length > otherFiles.length
        ? `${toolName} par pays`
        : `${toolName} \u2014 Toutes les pages`;
      injectLinks(indexPath, links, title);
      count += countryFiles.length;
    }
  }

  return count;
}

// ── Process category hub pages ──
// Category hubs with sub-directories should link to their children
function processCategoryHubs() {
  const CATEGORY_DIRS = [
    'business', 'crypto', 'ecommerce', 'energy', 'engineering',
    'finance', 'fintech', 'government', 'health', 'health-insurance',
    'hr-payroll', 'insurance', 'jobs', 'legal', 'lifestyle',
    'manufacturing', 'mining', 'mortgage-property', 'personal-finance',
    'property', 'religious-cultural', 'security', 'sports', 'telecom',
    'trade', 'transport', 'travel', 'career', 'climate', 'creative',
    'diaspora', 'compare', 'education'
  ];

  let count = 0;

  for (const cat of CATEGORY_DIRS) {
    // English version
    for (const prefix of ['', 'fr/']) {
      const catDir = path.join(ROOT, prefix, cat);
      if (!fs.existsSync(catDir) || !fs.statSync(catDir).isDirectory()) continue;

      const indexPath = path.join(catDir, 'index.html');
      if (!fs.existsSync(indexPath)) continue;

      // Find sub-directories with index.html (child tools)
      const excludedChildren = CATEGORY_CHILD_LINK_EXCLUSIONS[cat] || new Set();

      const subDirs = fs.readdirSync(catDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && !excludedChildren.has(d.name) && fs.existsSync(path.join(catDir, d.name, 'index.html')));

      // Find sibling .html files
      const subFiles = fs.readdirSync(catDir)
        .filter(f => isPublicHtmlSubPage(f) && !excludedChildren.has(f.replace(/\.html$/, '')));

      const links = [];

      for (const d of subDirs) {
        links.push({
          href: `/${prefix}${cat}/${d.name}/`,
          text: slugToName(d.name)
        });
      }

      for (const f of subFiles) {
        links.push({
          href: `/${prefix}${cat}/${f}`,
          text: slugToName(f)
        });
      }

      if (links.length < 2) continue;

      const catName = slugToName(cat);
      const title = prefix ? `${catName} \u2014 Outils disponibles` : `${catName} \u2014 All Tools`;
      injectLinks(indexPath, links, title);
      count += links.length;
    }
  }

  return count;
}

// ══════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════
console.log('Injecting static internal links...\n');

const relatedOnly = process.argv.includes('--related-only');
const checkRelated = process.argv.includes('--check-related');
const filesArg = process.argv.find((arg) => arg.startsWith('--files='));
const selectedFiles = filesArg ? filesArg.slice('--files='.length).split(',').map((file) => file.trim()).filter(Boolean) : null;

let legacyTotal = 0;
if (!relatedOnly && !checkRelated && !selectedFiles) {
  const agCount = processAgriculture();
  console.log(`  Agriculture: ${agCount} country links injected`);

  const hubCount = processCountryHubs();
  console.log(`  Country hubs: ${hubCount} sub-page links injected`);

  const toolCount = processToolSubPages();
  console.log(`  Tools: ${toolCount} country links injected`);

  const frCount = processFrench();
  console.log(`  French: ${frCount} links injected`);

  const catCount = processCategoryHubs();
  console.log(`  Category hubs: ${catCount} child links injected`);
  legacyTotal = agCount + hubCount + toolCount + frCount + catCount;
}

const relatedStats = processRelatedTools({ write: !checkRelated, files: selectedFiles });
console.log(`  Related tools: ${relatedStats.links} links across ${relatedStats.targeted} English directory pages`);
console.log(`                 ${relatedStats.updated} pages ${checkRelated ? 'need regeneration' : 'updated'}`);
console.log(`                 ${relatedStats.dataScriptsRemoved} full related-data scripts removed, ${relatedStats.componentScriptsAdded} lightweight component scripts added`);
if (relatedStats.missing.length) {
  console.warn(`  Missing related-tool targets (${relatedStats.missing.length}):\n  - ${relatedStats.missing.join('\n  - ')}`);
}

console.log(`\n  Total links injected: ${legacyTotal + relatedStats.links}`);
console.log('  Done!');

if (checkRelated && (relatedStats.updated || relatedStats.missing.length)) process.exitCode = 1;
