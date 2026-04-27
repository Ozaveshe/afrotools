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

const { ROOT, preferredRouteForFile } = require('./lib/canonical-aliases');

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

  fs.writeFileSync(indexPath, html, 'utf8');
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
      .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template'))
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
      .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template') && !f.includes('_old'))
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
      .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template'))
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
      .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template') && !f.includes('_old'))
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
        .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template'))
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
        .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template'))
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
      const subDirs = fs.readdirSync(catDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && fs.existsSync(path.join(catDir, d.name, 'index.html')));

      // Find sibling .html files
      const subFiles = fs.readdirSync(catDir)
        .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.includes('_template'));

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

const total = agCount + hubCount + toolCount + frCount + catCount;
console.log(`\n  Total links injected: ${total}`);
console.log('  Done!');
