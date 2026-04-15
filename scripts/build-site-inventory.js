#!/usr/bin/env node
/**
 * Build a storekeeper-style inventory of the AfroTools site.
 *
 * Outputs:
 * - /admin/data/site-inventory.json
 * - /admin/data/tool-registry-export.csv
 * - /admin/data/category-inventory.csv
 * - /admin/data/subcategory-inventory.csv
 * - /admin/data/site-pages-export.csv
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'admin', 'data');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.claude',
  '.agents',
  '.github',
  '.playwright',
  'test-results',
]);

const INTERNAL_ROUTE_SET = new Set([
  '/afrotools-mission-control.html',
  '/mc-7a2f9x.html',
]);

const COUNTRY_ROOTS = new Set([
  'algeria',
  'angola',
  'benin',
  'botswana',
  'burkina-faso',
  'burundi',
  'cabo-verde',
  'cameroon',
  'cape-verde',
  'car',
  'central-african-republic',
  'chad',
  'comoros',
  'congo',
  'cote-divoire',
  'djibouti',
  'dr-congo',
  'drc',
  'egypt',
  'eq-guinea',
  'equatorial-guinea',
  'eritrea',
  'eswatini',
  'ethiopia',
  'gabon',
  'gambia',
  'ghana',
  'guinea',
  'guinea-bissau',
  'kenya',
  'lesotho',
  'liberia',
  'libya',
  'madagascar',
  'malawi',
  'mali',
  'mauritania',
  'mauritius',
  'morocco',
  'mozambique',
  'namibia',
  'niger',
  'nigeria',
  'rwanda',
  'sao-tome',
  'senegal',
  'seychelles',
  'sierra-leone',
  'somalia',
  'south-africa',
  'south-sudan',
  'sudan',
  'tanzania',
  'togo',
  'tunisia',
  'uganda',
  'zambia',
  'zimbabwe',
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function escapeCsv(value) {
  if (value == null) return '';
  const raw = Array.isArray(value) ? value.join('|') : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function writeCsv(filePath, rows) {
  if (!rows.length) {
    fs.writeFileSync(filePath, '', 'utf8');
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ];

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function normalizeHref(href, fallback) {
  return String(href || fallback || '')
    .replace(/\/index\.html$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

function canonicalRoute(fileRoute) {
  if (fileRoute === '/index.html') return '/';
  if (fileRoute.endsWith('/index.html')) {
    return fileRoute.slice(0, -11) + '/';
  }
  return fileRoute;
}

function loadRegistry() {
  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');

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
      querySelector() {
        return null;
      },
    },
  };

  vm.runInNewContext(source, sandbox, { filename: 'tool-registry.js' });

  return {
    tools: Array.isArray(sandbox.AFRO_TOOLS) ? sandbox.AFRO_TOOLS : [],
    categories: sandbox.AFRO_CATEGORIES || {},
    getTotalToolCount:
      typeof sandbox.getTotalToolCount === 'function' ? sandbox.getTotalToolCount : null,
  };
}

function getInstanceDetails(tools, filterFn) {
  const englishTools = tools.filter((tool) => {
    const langOk = !tool.lang || tool.lang === 'en';
    return langOk && (typeof filterFn === 'function' ? filterFn(tool) : true);
  });

  const hrefs = [];
  const seen = new Set();
  const weightedFamilies = new Map();

  for (const tool of englishTools) {
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
    const explicitFamilyUrls = hrefs.filter((href) => href === familyHref || href.startsWith(`${familyHref}/`)).length;
    hiddenVariants += Math.max(0, declaredCount - explicitFamilyUrls);
  }

  return {
    entries: englishTools.length,
    uniqueUrls: hrefs.length,
    hiddenVariants,
    instances: hrefs.length + hiddenVariants,
  };
}

function pageExistsForHref(href) {
  const normalizedHref = String(href || '').replace(/\/$/, '');
  if (!normalizedHref) return false;

  const tries = [
    path.join(ROOT, normalizedHref.replace(/^\//, ''), 'index.html'),
    path.join(ROOT, `${normalizedHref.replace(/^\//, '')}.html`),
  ];

  return tries.some((targetPath) => fs.existsSync(targetPath));
}

function appExistsForHref(href) {
  const normalizedHref = String(href || '').replace(/\/$/, '');
  if (!normalizedHref) return false;
  return fs.existsSync(path.join(ROOT, normalizedHref.replace(/^\//, ''), 'app.html'));
}

function walkHtmlFiles(dirPath, rows) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, rows);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

    const fileRoute = `/${path.relative(ROOT, fullPath).replace(/\\/g, '/')}`;
    const route = canonicalRoute(fileRoute);
    const parts = route.split('/').filter(Boolean);
    const first = parts[0] || '(root)';
    const second = parts[1] || '';

    rows.push({
      fileRoute,
      route,
      filePath: fullPath,
      first,
      second,
    });
  }
}

function classifyPage(routeRow, categoryLandingRoutes) {
  const { route, fileRoute, first } = routeRow;

  if (INTERNAL_ROUTE_SET.has(route) || first === 'admin' || first === 'dashboard') return 'internal';
  if (first === 'fr') return 'french';
  if (first === 'sw') return 'swahili';
  if (first === 'widgets') return route.startsWith('/widgets/iframe/') ? 'widget-iframe' : 'widget';

  if (first === 'tools') {
    if (fileRoute.endsWith('/app.html')) return 'tool-app';
    if (/^\/tools\/[^/]+\/index\.html$/.test(fileRoute)) return 'tool';
    return 'tool-variant';
  }

  if (COUNTRY_ROOTS.has(first)) {
    if (/^\/[^/]+\/index\.html$/.test(fileRoute)) return 'country-hub';
    return 'country-page';
  }

  if (categoryLandingRoutes.has(route)) return 'category-landing';
  if (first === 'blog') return 'blog';
  if (first === 'docs') return 'docs';
  return 'site-page';
}

function getToolLang(tool) {
  return tool && tool.lang ? tool.lang : 'en';
}

function isLiveTool(tool) {
  return !!tool && (tool.status === 'live' || tool.status === 'new');
}

function routeToDir(route) {
  const normalizedRoute = String(route || '').replace(/^\/+|\/+$/g, '');
  return path.join(ROOT, normalizedRoute);
}

function loadHubConfig(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/window\.HUB_CONFIG\s*=\s*(\{[\s\S]*?\})\s*;/);
  if (!match) return null;

  try {
    return vm.runInNewContext(`(${match[1]})`);
  } catch (error) {
    return { error: error.message };
  }
}

function buildTaxonomy(tools, categories, categoryInventoryRows) {
  const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
  const registryCategoryMap = new Map((categoryInventoryRows || []).map((row) => [row.id, row]));
  const subcategoryRows = [];

  const categoryRows = Object.entries(categories)
    .map(([id, category]) => {
      const categoryRoute = String(category.href || '').endsWith('/') ? category.href : `${category.href}/`;
      const categoryDir = routeToDir(categoryRoute);
      const categoryTools = tools.filter((tool) => tool.category === id);
      const liveCategoryTools = categoryTools.filter(isLiveTool);
      const hubs = [];

      if (fs.existsSync(categoryDir) && fs.statSync(categoryDir).isDirectory()) {
        for (const entry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;

          const hubFile = path.join(categoryDir, entry.name, 'index.html');
          if (!fs.existsSync(hubFile)) continue;

          const hubConfig = loadHubConfig(hubFile);
          if (!hubConfig || hubConfig.error || !Array.isArray(hubConfig.toolIds)) continue;

          const toolIds = Array.from(
            new Set(
              hubConfig.toolIds
                .map((value) => String(value || '').trim())
                .filter(Boolean)
            )
          );
          const hubTools = toolIds.map((toolId) => toolsById.get(toolId)).filter(Boolean);
          const liveHubTools = hubTools.filter(isLiveTool);
          const row = {
            categoryId: id,
            categoryName: category.name,
            slug: entry.name,
            hubId: hubConfig.id || entry.name,
            label: hubConfig.label || entry.name,
            href: `${categoryRoute}${entry.name}/`,
            toolIds,
            liveToolIds: liveHubTools.map((tool) => tool.id),
            toolCount: toolIds.length,
            liveTools: liveHubTools.length,
            englishTools: hubTools.filter((tool) => getToolLang(tool) === 'en').length,
            frenchTools: hubTools.filter((tool) => getToolLang(tool) === 'fr').length,
            swahiliTools: hubTools.filter((tool) => getToolLang(tool) === 'sw').length,
            missingToolIds: toolIds.filter((toolId) => !toolsById.has(toolId)),
          };

          hubs.push(row);
          subcategoryRows.push(row);
        }
      }

      const assignedHubIds = new Set(hubs.flatMap((hub) => hub.toolIds));
      const assignedLiveHubIds = new Set(hubs.flatMap((hub) => hub.liveToolIds));
      const unassignedLiveTools = liveCategoryTools.filter((tool) => !assignedHubIds.has(tool.id));
      const registryRow = registryCategoryMap.get(id);

      return {
        id,
        name: category.name,
        href: categoryRoute,
        countingMode: hubs.length ? 'explicit-hubs+direct' : 'flat-registry',
        explicitHubCount: hubs.length,
        explicitHubTools: assignedHubIds.size,
        explicitHubLiveTools: assignedLiveHubIds.size,
        liveLeafTools: liveCategoryTools.length,
        liveEnglishTools: liveCategoryTools.filter((tool) => getToolLang(tool) === 'en').length,
        liveFrenchTools: liveCategoryTools.filter((tool) => getToolLang(tool) === 'fr').length,
        liveSwahiliTools: liveCategoryTools.filter((tool) => getToolLang(tool) === 'sw').length,
        directLiveTools: unassignedLiveTools.length,
        unassignedToolIds: hubs.length ? unassignedLiveTools.map((tool) => tool.id) : [],
        subcategoryPreview: hubs.slice(0, 6).map((hub) => `${hub.label} (${hub.liveTools})`),
        subcategoryOverflow: Math.max(0, hubs.length - 6),
        registryEntries: registryRow ? registryRow.totalEntries : categoryTools.length,
        englishEntries: registryRow ? registryRow.englishEntries : categoryTools.filter((tool) => getToolLang(tool) === 'en').length,
        englishInstances: registryRow ? registryRow.englishInstances : 0,
        frenchEntries: registryRow ? registryRow.frenchEntries : categoryTools.filter((tool) => getToolLang(tool) === 'fr').length,
        swahiliEntries: registryRow ? registryRow.swahiliEntries : categoryTools.filter((tool) => getToolLang(tool) === 'sw').length,
        landingPageExists: registryRow
          ? registryRow.landingPageExists
          : fs.existsSync(path.join(categoryDir, 'index.html')),
      };
    })
    .sort((a, b) => b.liveLeafTools - a.liveLeafTools || b.explicitHubCount - a.explicitHubCount || a.name.localeCompare(b.name));

  const explicitHubToolIds = Array.from(new Set(subcategoryRows.flatMap((row) => row.toolIds)));

  return {
    summary: {
      categoriesWithExplicitSubcategories: categoryRows.filter((row) => row.explicitHubCount > 0).length,
      explicitSubcategoryHubs: subcategoryRows.length,
      explicitSubcategoryAssignedTools: explicitHubToolIds.length,
      explicitCategoryDirectTools: categoryRows.reduce(
        (sum, row) => sum + (row.explicitHubCount > 0 ? row.directLiveTools : 0),
        0
      ),
    },
    categoryRows,
    subcategoryRows: subcategoryRows.sort(
      (a, b) => a.categoryName.localeCompare(b.categoryName) || a.label.localeCompare(b.label)
    ),
  };
}

function buildInventory() {
  const { tools, categories, getTotalToolCount } = loadRegistry();

  const categoryLandingRoutes = new Set(
    Object.values(categories).map((category) => (String(category.href || '').endsWith('/') ? category.href : `${category.href}/`))
  );

  const pageRows = [];
  walkHtmlFiles(ROOT, pageRows);

  for (const row of pageRows) {
    row.type = classifyPage(row, categoryLandingRoutes);
    row.language = row.type === 'french' ? 'fr' : row.type === 'swahili' ? 'sw' : 'base';
    row.isInternal = row.type === 'internal';
    row.isPublic = !row.isInternal;
  }

  const pageCountsByType = pageRows.reduce((acc, row) => {
    acc[row.type] = (acc[row.type] || 0) + 1;
    return acc;
  }, {});

  const topLevelRows = Object.entries(
    pageRows.reduce((acc, row) => {
      acc[row.first] = (acc[row.first] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([segment, count]) => ({ segment, count }))
    .sort((a, b) => b.count - a.count);

  const registryByLang = {};
  const registryByStatus = {};
  const registryByTier = {};
  const registryByCategory = {};

  for (const tool of tools) {
    const lang = tool.lang || 'en';
    registryByLang[lang] = (registryByLang[lang] || 0) + 1;
    registryByStatus[tool.status] = (registryByStatus[tool.status] || 0) + 1;
    registryByTier[tool.tier] = (registryByTier[tool.tier] || 0) + 1;
    registryByCategory[tool.category] = (registryByCategory[tool.category] || 0) + 1;
  }

  const totalInstanceDetails = getInstanceDetails(tools);
  const liveInstanceDetails = getInstanceDetails(tools, (tool) => tool.status === 'live' || tool.status === 'new');
  const toolInstances = typeof getTotalToolCount === 'function' ? getTotalToolCount() : totalInstanceDetails.instances;
  const liveToolInstances =
    typeof getTotalToolCount === 'function'
      ? getTotalToolCount((tool) => tool.status === 'live' || tool.status === 'new')
      : liveInstanceDetails.instances;

  const liveNewTools = tools.filter((tool) => tool.status === 'live' || tool.status === 'new');
  const liveNewWithPages = liveNewTools.filter((tool) => pageExistsForHref(tool.href));
  const liveNewWithApps = liveNewTools.filter((tool) => appExistsForHref(tool.href));

  const categoryRows = Object.entries(categories)
    .map(([id, category]) => {
      const categoryTools = tools.filter((tool) => tool.category === id);
      const instanceDetails = getInstanceDetails(tools, (tool) => tool.category === id);
      const liveEntries = categoryTools.filter((tool) => tool.status === 'live' || tool.status === 'new').length;
      const landingRoute = String(category.href || '').endsWith('/') ? category.href : `${category.href}/`;
      const landingFile = path.join(ROOT, landingRoute.replace(/^\//, ''), 'index.html');

      return {
        id,
        name: category.name,
        href: landingRoute,
        totalEntries: categoryTools.length,
        englishEntries: categoryTools.filter((tool) => !tool.lang || tool.lang === 'en').length,
        englishInstances: instanceDetails.instances,
        liveEntries,
        frenchEntries: categoryTools.filter((tool) => tool.lang === 'fr').length,
        swahiliEntries: categoryTools.filter((tool) => tool.lang === 'sw').length,
        landingPageExists: fs.existsSync(landingFile),
      };
    })
    .sort((a, b) => b.totalEntries - a.totalEntries);

  const taxonomy = buildTaxonomy(tools, categories, categoryRows);

  const otherPublicPages =
    (pageCountsByType['site-page'] || 0) +
    (pageCountsByType['category-landing'] || 0) +
    (pageCountsByType['blog'] || 0) +
    (pageCountsByType['docs'] || 0);

  const summary = {
    registryEntries: tools.length,
    registryLiveEntries: liveNewTools.length,
    registryQueuedEntries: tools.filter((tool) => tool.status === 'queued' || tool.status === 'planned').length,
    englishRegistryEntries: registryByLang.en || 0,
    englishUniqueToolUrls: totalInstanceDetails.uniqueUrls,
    englishToolInstances: toolInstances,
    englishLiveToolInstances: liveToolInstances,
    categories: Object.keys(categories).length,
    categoryLandingPagesPresent: categoryRows.filter((row) => row.landingPageExists).length,
    totalHtmlPages: pageRows.length,
    publicHtmlPages: pageRows.filter((row) => row.isPublic).length,
    internalHtmlPages: pageRows.filter((row) => row.isInternal).length,
    frenchHtmlPages: pageCountsByType.french || 0,
    swahiliHtmlPages: pageCountsByType.swahili || 0,
    languageHtmlPages: (pageCountsByType.french || 0) + (pageCountsByType.swahili || 0),
    toolBasePages: pageCountsByType.tool || 0,
    toolVariantPages: pageCountsByType['tool-variant'] || 0,
    toolAppPages: pageCountsByType['tool-app'] || 0,
    toolHtmlPages: (pageCountsByType.tool || 0) + (pageCountsByType['tool-variant'] || 0) + (pageCountsByType['tool-app'] || 0),
    countryHubPages: pageCountsByType['country-hub'] || 0,
    countryToolPages: pageCountsByType['country-page'] || 0,
    countryHtmlPages: (pageCountsByType['country-hub'] || 0) + (pageCountsByType['country-page'] || 0),
    widgetHtmlPages: (pageCountsByType.widget || 0) + (pageCountsByType['widget-iframe'] || 0),
    otherPublicPages,
    liveNewRegistryEntriesWithPages: liveNewWithPages.length,
    liveNewRegistryEntriesMissingPages: liveNewTools.length - liveNewWithPages.length,
    liveNewToolApps: liveNewWithApps.length,
    totalAppHtmlFiles: pageRows.filter((row) => row.fileRoute.endsWith('/app.html')).length,
    categoriesWithExplicitSubcategories: taxonomy.summary.categoriesWithExplicitSubcategories,
    explicitSubcategoryHubs: taxonomy.summary.explicitSubcategoryHubs,
    explicitSubcategoryAssignedTools: taxonomy.summary.explicitSubcategoryAssignedTools,
    explicitCategoryDirectTools: taxonomy.summary.explicitCategoryDirectTools,
  };

  const inventory = {
    generatedAt: new Date().toISOString(),
    generatedAtDisplay: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC'),
    source: {
      registryPath: path.relative(ROOT, REGISTRY_PATH).replace(/\\/g, '/'),
      excludedDirs: Array.from(EXCLUDED_DIRS),
    },
    definitions: {
      registryEntry: 'One row inside AFRO_TOOLS.',
      englishToolInstance:
        'The English-only tool count after collapsing duplicate URLs and then re-adding hidden country-family variants via toolCount.',
      subcategoryHub:
        'A hub page with explicit window.HUB_CONFIG.toolIds. It is a container page, not a leaf tool.',
      categoryLeafTool:
        'A live/new tool row that belongs directly to a category or is explicitly listed inside a subcategory hub.',
      htmlPage: 'A physical .html file on disk after excluding non-site folders such as node_modules and .playwright.',
      otherPublicPages: 'Public pages that are not tools, country routes, widgets, or internal dashboards. This is the closest bucket to "just pages".',
    },
    summary,
    registry: {
      byLang: registryByLang,
      byStatus: registryByStatus,
      byTier: registryByTier,
      byCategory: Object.entries(registryByCategory)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count),
      categoryRows,
    },
    pages: {
      byType: pageCountsByType,
      topLevelRows,
    },
    taxonomy,
  };

  const registryCsvRows = tools
    .slice()
    .sort((a, b) => {
      const langA = a.lang || 'en';
      const langB = b.lang || 'en';
      return langA.localeCompare(langB) || a.category.localeCompare(b.category) || a.id.localeCompare(b.id);
    })
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      lang: tool.lang || 'en',
      status: tool.status,
      phase: tool.phase || '',
      category: tool.category,
      category_name: categories[tool.category] ? categories[tool.category].name : '',
      tier: tool.tier || '',
      countries: (tool.countries || []).join('|'),
      country_count: (tool.countries || []).length,
      href: tool.href,
      revenue: tool.revenue || '',
      est_traffic: tool.estTraffic || '',
      est_revenue: tool.estRevenue || '',
      priority: tool.priority || '',
      is_new: tool.isNew ? 'yes' : '',
      pro_bundle: tool.proBundle ? 'yes' : '',
      tool_count: tool.toolCount || 1,
    }));

  const categoryCsvRows = categoryRows.map((row) => ({
    category_id: row.id,
    category_name: row.name,
    href: row.href,
    landing_page_exists: row.landingPageExists ? 'yes' : 'no',
    counting_mode: (taxonomy.categoryRows.find((taxRow) => taxRow.id === row.id) || {}).countingMode || 'flat-registry',
    explicit_subcategories: (taxonomy.categoryRows.find((taxRow) => taxRow.id === row.id) || {}).explicitHubCount || 0,
    hub_live_tools: (taxonomy.categoryRows.find((taxRow) => taxRow.id === row.id) || {}).explicitHubLiveTools || 0,
    direct_live_tools: (taxonomy.categoryRows.find((taxRow) => taxRow.id === row.id) || {}).directLiveTools || 0,
    subcategory_preview: ((taxonomy.categoryRows.find((taxRow) => taxRow.id === row.id) || {}).subcategoryPreview || []).join(' | '),
    total_entries: row.totalEntries,
    english_entries: row.englishEntries,
    english_instances: row.englishInstances,
    live_entries: row.liveEntries,
    french_entries: row.frenchEntries,
    swahili_entries: row.swahiliEntries,
  }));

  const subcategoryCsvRows = taxonomy.subcategoryRows.map((row) => ({
    category_id: row.categoryId,
    category_name: row.categoryName,
    subcategory_slug: row.slug,
    subcategory_name: row.label,
    href: row.href,
    tool_count: row.toolCount,
    live_tools: row.liveTools,
    english_tools: row.englishTools,
    french_tools: row.frenchTools,
    swahili_tools: row.swahiliTools,
    missing_tool_ids: row.missingToolIds.join('|'),
    tool_ids: row.toolIds.join('|'),
  }));

  const pageCsvRows = pageRows
    .slice()
    .sort((a, b) => a.fileRoute.localeCompare(b.fileRoute))
    .map((row) => ({
      route: row.route,
      file_route: row.fileRoute,
      type: row.type,
      language: row.language,
      top_level: row.first,
      second_level: row.second,
      internal: row.isInternal ? 'yes' : 'no',
      public: row.isPublic ? 'yes' : 'no',
      file_path: path.relative(ROOT, row.filePath).replace(/\\/g, '/'),
    }));

  return {
    inventory,
    registryCsvRows,
    categoryCsvRows,
    subcategoryCsvRows,
    pageCsvRows,
  };
}

function main() {
  ensureDir(OUTPUT_DIR);

  const { inventory, registryCsvRows, categoryCsvRows, subcategoryCsvRows, pageCsvRows } = buildInventory();

  const jsonPath = path.join(OUTPUT_DIR, 'site-inventory.json');
  const registryCsvPath = path.join(OUTPUT_DIR, 'tool-registry-export.csv');
  const categoryCsvPath = path.join(OUTPUT_DIR, 'category-inventory.csv');
  const subcategoryCsvPath = path.join(OUTPUT_DIR, 'subcategory-inventory.csv');
  const pagesCsvPath = path.join(OUTPUT_DIR, 'site-pages-export.csv');

  fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2) + '\n', 'utf8');
  writeCsv(registryCsvPath, registryCsvRows);
  writeCsv(categoryCsvPath, categoryCsvRows);
  writeCsv(subcategoryCsvPath, subcategoryCsvRows);
  writeCsv(pagesCsvPath, pageCsvRows);

  console.log('Built AfroTools site inventory');
  console.log(`  Registry entries: ${formatCount(inventory.summary.registryEntries)}`);
  console.log(`  EN tool instances: ${formatCount(inventory.summary.englishToolInstances)}`);
  console.log(`  Total HTML pages: ${formatCount(inventory.summary.totalHtmlPages)}`);
  console.log(`  French HTML pages: ${formatCount(inventory.summary.frenchHtmlPages)}`);
  console.log(`  Output JSON: ${path.relative(ROOT, jsonPath).replace(/\\/g, '/')}`);
  console.log(`  Output CSV: ${path.relative(ROOT, registryCsvPath).replace(/\\/g, '/')}`);
  console.log(`  Output CSV: ${path.relative(ROOT, categoryCsvPath).replace(/\\/g, '/')}`);
  console.log(`  Output CSV: ${path.relative(ROOT, subcategoryCsvPath).replace(/\\/g, '/')}`);
  console.log(`  Output CSV: ${path.relative(ROOT, pagesCsvPath).replace(/\\/g, '/')}`);
}

main();
