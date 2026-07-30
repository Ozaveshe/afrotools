#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const registryApi = require('./lib/canonical-registry');
const widgets = require('../widgets/WIDGET-REGISTRY.js');
const toolDirectory = require('../data/tool-directory.json');
const { FRENCH_CATEGORIES } = require('./lib/french-category-directory');

const ROOT = path.resolve(__dirname, '..');
const START = '<!-- PROGRESSIVE_DIRECTORY_FALLBACK_START -->';
const END = '<!-- PROGRESSIVE_DIRECTORY_FALLBACK_END -->';
const FR_CATEGORY_META_START = '/* FRENCH_CATEGORY_META_START */';
const FR_CATEGORY_META_END = '/* FRENCH_CATEGORY_META_END */';

const EN_CATEGORY_ORDER = [
  'financial', 'hr-payroll', 'document-pdf', 'image-design', 'developer', 'education',
  'health', 'insurance', 'fintech', 'agriculture', 'ecommerce', 'legal',
  'data-productivity', 'language', 'african', 'trade', 'telecom', 'energy',
  'engineering', 'creative', 'security', 'government', 'small-business', 'transport',
  'travel-tourism', 'personal-finance', 'diaspora', 'career', 'religious-cultural',
  'climate', 'sports', 'mining'
];

// French labels for every category id in EN_CATEGORY_ORDER. Used for the
// no-JavaScript directory card pills so the French surface never renders a raw
// English category slug (e.g. "energy") before hydration.
const FR_CATEGORY_LABELS = {
  'financial': 'Finances',
  'hr-payroll': 'Paie & RH',
  'document-pdf': 'Documents & PDF',
  'image-design': 'Image & Design',
  'developer': 'Développeur',
  'education': 'Éducation',
  'health': 'Santé',
  'insurance': 'Assurance',
  'fintech': 'Fintech',
  'agriculture': 'Agriculture',
  'ecommerce': 'E-commerce',
  'legal': 'Juridique',
  'data-productivity': 'Données & productivité',
  'language': 'Langues',
  'african': 'Spécialités africaines',
  'trade': 'Commerce',
  'telecom': 'Télécom',
  'energy': 'Énergie',
  'engineering': 'Ingénierie',
  'creative': 'Création',
  'security': 'Sécurité',
  'government': 'Administration',
  'small-business': 'Petite entreprise',
  'transport': 'Transport',
  'travel-tourism': 'Voyage & tourisme',
  'personal-finance': 'Finances personnelles',
  'diaspora': 'Diaspora',
  'career': 'Carrière',
  'religious-cultural': 'Religion & culture',
  'climate': 'Climat',
  'sports': 'Sports',
  'mining': 'Mines'
};

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceBlock(html, file, fallback) {
  if (!html.includes(START) || !html.includes(END)) {
    throw new Error(`${file}: missing progressive directory fallback markers`);
  }
  return html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), `${START}\n${fallback}\n${END}`);
}

function replaceFrenchCategoryMetadata(html, file) {
  if (!html.includes(FR_CATEGORY_META_START) || !html.includes(FR_CATEGORY_META_END)) {
    throw new Error(`${file}: missing French category metadata markers`);
  }
  const serialized = JSON.stringify(FRENCH_CATEGORIES, null, 2);
  const pattern = new RegExp(
    `${escapeRegExp(FR_CATEGORY_META_START)}[\\s\\S]*?${escapeRegExp(FR_CATEGORY_META_END)}`
  );
  return html.replace(
    pattern,
    `${FR_CATEGORY_META_START}\nvar CATS_META = ${serialized};\n${FR_CATEGORY_META_END}`
  );
}

function replaceDerivedCounts(html, registry) {
  const directoryCounts = {
    'tools.locale.fr.category.developer.published': publishedTools(registry, 'fr', 'developer').length
  };
  return html.replace(
    /(<[^>]+\bdata-(directory|registry)-count="([^"]+)"[^>]*>)([^<]*)(<\/[^>]+>)/g,
    (match, open, kind, id, current, close) => {
      const value = kind === 'directory'
        ? directoryCounts[id]
        : (registryApi.getSelector(registry, id) || {}).value;
      if (!Number.isInteger(value)) throw new Error(`Unknown ${kind} count ${id}`);
      return `${open}${value}${close}`;
    }
  );
}

function publishedTools(registry, locale, categoryId) {
  return registry.tools.filter((tool) => {
    if (tool.publicationStatus !== 'published' || tool.deprecated || !tool.indexable) return false;
    if (!tool.localeCoverage.includes(locale)) return false;
    if (locale !== 'en' && !tool.route.startsWith(`/${locale}/`)) return false;
    return !categoryId || tool.categoryId === categoryId;
  });
}

function priorityOrder(tools) {
  return tools.slice().sort((a, b) => Number(b.source.priority || 0) - Number(a.source.priority || 0));
}

function widgetFallback() {
  return widgets.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 24).map((widget) => {
    const route = widget.id === 'break-even-lite'
      ? '/tools/break-even/'
      : widget.fullToolLink && widget.fullToolLink.startsWith('/') ? widget.fullToolLink : '/widgets/';
    return `        <article class="widget-card" data-initial-record="${escapeHtml(widget.id)}">
          <div class="widget-card__meta"><span class="widget-card__cat">${escapeHtml(widget.category)}</span><span class="widget-card__source">${widget.source === 'lite-pack' ? 'Lite' : 'Core'}</span></div>
          <h2><a href="${escapeHtml(route)}" data-directory-record>${escapeHtml(widget.name)}</a></h2>
          <p>${escapeHtml(widget.description)}</p>
        </article>`;
  }).join('\n');
}

function categoryFallback(registry, locale) {
  const categoryById = new Map(registry.categories.map((category) => [category.id, category]));
  if (locale === 'fr') {
    return FRENCH_CATEGORIES.map((category) => {
      const count = publishedTools(registry, 'fr', category.key).length;
      return `        <a class="cc" href="${escapeHtml(category.href)}" data-directory-record data-category="${escapeHtml(category.key)}" data-hub-state="${category.nativeHub ? 'native' : 'filtered-directory'}"><div class="cc-n">${escapeHtml(category.title)}</div><div class="cc-count">${count} fiches françaises publiées</div><div class="cc-d">${escapeHtml(category.description)}</div></a>`;
    }).join('\n');
  }
  return EN_CATEGORY_ORDER.map((id) => categoryById.get(id)).filter(Boolean).map((category) => {
    const count = registryApi.getSelector(registry, `tools.category.${category.id}.published`);
    return `        <a class="cc" href="${escapeHtml(category.route)}" data-directory-record data-category="${escapeHtml(category.id)}"><div class="cc-n">${escapeHtml(category.title)}</div><div class="cc-count">${count ? count.value : 0} canonical records</div><div class="cc-d">${escapeHtml(category.description)}</div></a>`;
  }).join('\n');
}

function developerFallback(registry, locale) {
  let tools = publishedTools(registry, locale, 'developer');
  if (locale === 'en') {
    const flagship = ['api-tester', 'african-api-directory', 'ussd-flow-builder', 'ussd-simulator', 'sql-playground', 'hosting-compare', 'docker-compose-gen', 'pwa-manifest'];
    tools = flagship.map((id) => tools.find((tool) => tool.id === id || tool.source.sourceId === id)).filter(Boolean);
  } else {
    tools = priorityOrder(tools).slice(0, 12);
  }
  return tools.map((tool) => {
    if (locale === 'fr') {
      return `        <a class="tc" href="${escapeHtml(tool.route)}" data-directory-record data-id="${escapeHtml(tool.id)}"><span class="tc-badge live">Actif</span><h3>${escapeHtml(tool.title)}</h3><p>${escapeHtml(tool.description)}</p></a>`;
    }
    return `        <a class="tool-card is-flagship" href="${escapeHtml(tool.route)}" data-directory-record data-id="${escapeHtml(tool.id)}"><div class="tool-top"><div class="tool-icon" aria-hidden="true">AT</div><span class="tool-chip">Deep app</span></div><h3>${escapeHtml(tool.title)}</h3><p>${escapeHtml(tool.description)}</p></a>`;
  }).join('\n');
}

function allToolsFallback(registry, locale) {
  if (locale === 'en') {
    const tools = toolDirectory
      .filter((tool) => tool && tool.language === 'en' && String(tool.status).toLowerCase() === 'live')
      .slice()
      .sort((a, b) => {
        const categoryDelta = EN_CATEGORY_ORDER.indexOf(a.category_key) - EN_CATEGORY_ORDER.indexOf(b.category_key);
        if (categoryDelta) return categoryDelta;
        return Number(b.priority || 0) - Number(a.priority || 0) || a.name.localeCompare(b.name);
      });
    const groups = new Map();
    tools.forEach((tool) => {
      const key = tool.category_key || 'other';
      if (!groups.has(key)) groups.set(key, { title: tool.category || key, tools: [] });
      groups.get(key).tools.push(tool);
    });
    const orderedKeys = [
      ...EN_CATEGORY_ORDER.filter((key) => groups.has(key)),
      ...Array.from(groups.keys()).filter((key) => !EN_CATEGORY_ORDER.includes(key)).sort()
    ];
    const sections = orderedKeys.map((key) => {
      const group = groups.get(key);
      const links = group.tools.map((tool) => {
        return `              <li><a href="${escapeHtml(tool.url)}" data-directory-record data-id="${escapeHtml(tool.id)}" data-category="${escapeHtml(key)}">${escapeHtml(tool.name)}</a></li>`;
      }).join('\n');
      return `          <section class="static-tool-category" data-static-tool-category="${escapeHtml(key)}" aria-labelledby="static-tool-category-${escapeHtml(key)}">
            <h2 id="static-tool-category-${escapeHtml(key)}">${escapeHtml(group.title)}</h2>
            <ul class="static-tool-links">
${links}
            </ul>
          </section>`;
    }).join('\n');
    return `        <div class="static-tool-directory" data-static-tool-directory data-static-tool-count="${tools.length}">
${sections}
        </div>`;
  }
  const tools = priorityOrder(publishedTools(registry, locale));
  const groups = new Map();
  tools.forEach((tool) => {
    const key = tool.categoryId || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tool);
  });
  const orderedKeys = [
    ...EN_CATEGORY_ORDER.filter((key) => groups.has(key)),
    ...Array.from(groups.keys()).filter((key) => !EN_CATEGORY_ORDER.includes(key)).sort()
  ];
  const sections = orderedKeys.map((key) => {
    const links = groups.get(key).map((tool) => {
      return `              <li><a href="${escapeHtml(tool.route)}" data-directory-record data-id="${escapeHtml(tool.id)}" data-category="${escapeHtml(key)}">${escapeHtml(tool.title)}</a></li>`;
    }).join('\n');
    return `          <section class="static-tool-category" data-static-tool-category="${escapeHtml(key)}" aria-labelledby="static-tool-category-${escapeHtml(key)}">
            <h2 id="static-tool-category-${escapeHtml(key)}">${escapeHtml(FR_CATEGORY_LABELS[key] || key)}</h2>
            <ul class="static-tool-links">
${links}
            </ul>
          </section>`;
  }).join('\n');
  return `        <div class="static-tool-directory" data-static-tool-directory data-static-tool-count="${tools.length}">
${sections}
        </div>`;
}

function targets(registry, scope) {
  const allTargets = [
    ['widgets/demo/index.html', widgetFallback()],
    ['categories/index.html', categoryFallback(registry, 'en')],
    ['developer-tools/index.html', developerFallback(registry, 'en')],
    ['all-tools/index.html', allToolsFallback(registry, 'en')],
    ['fr/categories/index.html', categoryFallback(registry, 'fr')],
    ['fr/developer-tools/index.html', developerFallback(registry, 'fr')],
    ['fr/all-tools/index.html', allToolsFallback(registry, 'fr')]
  ];
  return scope === 'fr'
    ? allTargets.filter(([relative]) => relative.startsWith('fr/'))
    : allTargets;
}

function run(options) {
  const write = Boolean(options && options.write);
  const scope = options && options.scope === 'fr' ? 'fr' : 'all';
  const registry = registryApi.buildCanonicalRegistry();
  const validation = registryApi.validateCanonicalRegistry(registry);
  if (!validation.ok) throw new Error(validation.errors.map(registryApi.formatIssue).join('\n'));
  const stale = [];
  targets(registry, scope).forEach(([relative, fallback]) => {
    const absolute = path.join(ROOT, relative);
    const current = fs.readFileSync(absolute, 'utf8');
    let expected = replaceDerivedCounts(replaceBlock(current, relative, fallback), registry);
    if (relative === 'fr/categories/index.html') {
      expected = replaceFrenchCategoryMetadata(expected, relative);
    }
    if (expected === current) return;
    stale.push(relative);
    if (write) writeFileSyncWithRetry(absolute, expected, 'utf8');
  });
  return { stale };
}

if (require.main === module) {
  try {
    const write = process.argv.includes('--write');
    const scope = process.argv.includes('--fr-only') ? 'fr' : 'all';
    const result = run({ write, scope });
    if (!write && result.stale.length) {
      throw new Error(`Progressive directory output is stale:\n- ${result.stale.join('\n- ')}\nRun node scripts/build-progressive-directories.js --write.`);
    }
    console.log(`${write ? 'Built' : 'Verified'} ${scope === 'fr' ? 'French ' : ''}progressive directory fallbacks${result.stale.length ? ` (${result.stale.length} updated)` : ''}.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  run,
  replaceBlock,
  replaceFrenchCategoryMetadata,
  widgetFallback,
  categoryFallback,
  developerFallback,
  allToolsFallback
};
