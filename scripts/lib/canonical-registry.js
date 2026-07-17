'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const localizationApi = require('./localization-platform');

const ROOT = path.resolve(__dirname, '..', '..');
const POLICY_PATH = path.join(ROOT, 'data', 'registry', 'catalog-policy.json');
const TOOL_REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const COUNTRY_REGISTRY_PATH = path.join(ROOT, 'data', 'registry', 'countries.json');
const WIDGET_REGISTRY_PATH = path.join(ROOT, 'widgets', 'WIDGET-REGISTRY.js');
const PRODUCT_PLAN_PATH = path.join(ROOT, 'assets', 'js', 'lib', 'pro-plan.js');
const API_PLAN_PATH = path.join(ROOT, 'netlify', 'functions', '_shared', 'api-plans.js');
const PRO_APP_REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'lib', 'pro-app-registry.js');

const VALID_PUBLICATION_STATES = new Set(['published', 'draft', 'unpublished', 'redirect', 'retired']);
const VALID_LOCALE_STATES = new Set(['default', 'published', 'partial', 'build-only', 'unsupported']);
const VALID_COUNTRY_REGIONS = new Set(['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa', 'Indian Ocean']);
const VALID_COUNTRY_LOCALE_STATES = new Set(['native', 'localized-shell', 'english-fallback', 'unavailable', 'deprecated']);
const PUBLIC_COUNTRY_LOCALES = ['en', 'fr', 'sw', 'yo', 'ha'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function registrySandbox() {
  return {
    window: {},
    CustomEvent: function CustomEvent() {},
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '' }),
      head: { appendChild: () => {} },
      addEventListener: () => {},
      dispatchEvent: () => {},
      querySelector: () => null
    }
  };
}

function loadToolRegistry() {
  const sandbox = registrySandbox();
  try {
    vm.runInNewContext(fs.readFileSync(TOOL_REGISTRY_PATH, 'utf8'), sandbox, { filename: TOOL_REGISTRY_PATH });
  } catch (error) {
    throw new Error(`Unable to parse ${path.relative(ROOT, TOOL_REGISTRY_PATH)}: ${error.message}`);
  }
  if (!Array.isArray(sandbox.AFRO_TOOLS) || !sandbox.AFRO_CATEGORIES) {
    throw new Error(`${path.relative(ROOT, TOOL_REGISTRY_PATH)} did not expose AFRO_TOOLS and AFRO_CATEGORIES`);
  }
  return {
    tools: sandbox.AFRO_TOOLS,
    categories: sandbox.AFRO_CATEGORIES,
    getTotalToolCount: sandbox.getTotalToolCount
  };
}

function loadCountryRegistry() {
  try {
    const countries = readJson(COUNTRY_REGISTRY_PATH);
    if (!Array.isArray(countries)) throw new Error('expected an array');
    return countries;
  } catch (error) {
    throw new Error(`Unable to parse ${path.relative(ROOT, COUNTRY_REGISTRY_PATH)}: ${error.message}`);
  }
}

function loadProApps() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  try {
    vm.runInNewContext(fs.readFileSync(PRO_APP_REGISTRY_PATH, 'utf8'), sandbox, { filename: PRO_APP_REGISTRY_PATH });
  } catch (error) {
    throw new Error(`Unable to parse ${path.relative(ROOT, PRO_APP_REGISTRY_PATH)}: ${error.message}`);
  }
  if (!sandbox.AfroProAppRegistry || typeof sandbox.AfroProAppRegistry.getApps !== 'function') {
    throw new Error(`${path.relative(ROOT, PRO_APP_REGISTRY_PATH)} did not expose AfroProAppRegistry`);
  }
  return sandbox.AfroProAppRegistry.getApps();
}

function loadSources() {
  const toolSource = loadToolRegistry();
  const productPlanApi = require(PRODUCT_PLAN_PATH);
  const apiPlanApi = require(API_PLAN_PATH);
  const policy = readJson(POLICY_PATH);
  policy.locales = localizationApi.loadLocaleManifest().locales;
  return {
    policy,
    tools: toolSource.tools,
    categories: toolSource.categories,
    getTotalToolCount: toolSource.getTotalToolCount,
    countries: loadCountryRegistry(),
    widgets: require(WIDGET_REGISTRY_PATH),
    productPlans: productPlanApi.plans,
    apiPlans: apiPlanApi.API_PLAN_LIMITS,
    proApps: loadProApps()
  };
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeRoute(value) {
  let route = String(value || '').trim();
  if (!route) return '';
  try {
    if (/^https?:\/\//i.test(route)) route = new URL(route).pathname;
  } catch (_) {
    // The validator reports invalid paths through missing destinations.
  }
  route = route.split(/[?#]/)[0].replace(/\\/g, '/');
  route = `/${route.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
  route = route.replace(/\/index\.html\/?$/i, '/').replace(/\/+$/, '');
  return (route || '/').toLowerCase();
}

function publicRoute(value) {
  let route = String(value || '').trim();
  if (!route) return '';
  try {
    if (/^https?:\/\//i.test(route)) route = new URL(route).pathname;
  } catch (_) {
    // Destination validation reports malformed routes.
  }
  route = route.split(/[?#]/)[0].replace(/\\/g, '/');
  route = `/${route.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
  return route.replace(/\/index\.html$/i, '/');
}

function routeExists(route) {
  const clean = String(route || '').split(/[?#]/)[0].replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean) return fs.existsSync(path.join(ROOT, 'index.html'));
  const candidates = [
    path.join(ROOT, clean),
    path.join(ROOT, `${clean}.html`),
    path.join(ROOT, clean, 'index.html')
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

function normalizeCountry(country, policy) {
  const id = String(country.id).toUpperCase();
  return {
    id,
    isoCode: String(country.isoCode || id).toUpperCase(),
    displayNames: { ...(country.displayNames || {}) },
    title: country.title,
    flag: country.flag || id.replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))),
    route: publicRoute(country.route),
    routeSlug: country.routeSlug || publicRoute(country.route).replace(/^\/+|\/+$/g, ''),
    region: country.region || null,
    currency: country.currency || null,
    currencySymbol: country.currencySymbol || null,
    sourceJurisdiction: String(country.sourceJurisdiction || id).toUpperCase(),
    supportedToolTypes: Array.isArray(country.supportedToolTypes) ? [...new Set(country.supportedToolTypes)].sort() : [],
    localeCoverage: Object.fromEntries(Object.entries(country.localeCoverage || {}).map(([locale, coverage]) => [locale, {
      state: coverage.state,
      route: coverage.route ? publicRoute(coverage.route) : null,
      indexable: Boolean(coverage.indexable)
    }])),
    languages: Array.isArray(country.languages) ? country.languages.slice() : [],
    publicationStatus: country.publicationStatus,
    source: 'data/registry/countries.json'
  };
}

function normalizeLocale(locale) {
  const launchStatus = locale.launchStatus || locale.state;
  const state = launchStatus === 'launched' ? 'published'
    : launchStatus === 'planned' || launchStatus === 'retired' ? 'unsupported'
      : launchStatus;
  const published = ['default', 'launched', 'partial'].includes(launchStatus);
  return {
    id: locale.id,
    title: locale.displayName || locale.name,
    nativeName: locale.nativeName || locale.name,
    direction: locale.direction || 'ltr',
    state,
    routePrefix: locale.routePrefix,
    published,
    generated: Boolean(locale.generated || launchStatus === 'launched'),
    publicationStatus: published ? 'published' : 'unpublished',
    source: 'data/registry/locale-manifest.json'
  };
}

function availabilityFor(tool) {
  const revenue = String(tool.revenue || '').toLowerCase();
  if (revenue === 'pro' || tool.proBundle === true) return 'pro';
  if (revenue.includes('freemium') || revenue.includes('pro')) return 'free-and-pro';
  return 'free';
}

function normalizeFreshness(tool) {
  const asOf = tool.dataAsOf || tool.lastUpdated || tool.updatedAt || null;
  return {
    status: asOf ? 'current' : 'unknown',
    asOf
  };
}

function buildWidgetLinks(widgets) {
  const byRoute = new Map();
  widgets.forEach((widget) => {
    const key = normalizeRoute(widget.fullToolLink);
    if (!key) return;
    if (!byRoute.has(key)) byRoute.set(key, []);
    byRoute.get(key).push(widget.id);
  });
  return byRoute;
}

function normalizeTool(tool, context) {
  const locale = tool.lang || 'en';
  const aliasTargetId = context.policy.toolRouteAliases[tool.id] || null;
  const target = aliasTargetId ? context.sourceToolsById.get(aliasTargetId) : null;
  const route = publicRoute(tool.href);
  const canonicalRoute = publicRoute(target ? target.href : tool.href);
  const rawCountries = Array.isArray(tool.countries) ? tool.countries.slice() : [];
  const panAfrican = rawCountries.includes(context.policy.regionalSentinel);
  const countryIds = panAfrican ? [] : rawCountries.map((id) => String(id).toUpperCase());
  const currencies = panAfrican
    ? ['MULTI']
    : [...new Set(countryIds.map((id) => context.countryById.get(id)).filter(Boolean).map((country) => country.currency).filter(Boolean))].sort();
  const widgetIds = context.widgetLinks.get(normalizeRoute(canonicalRoute)) || [];
  return {
    id: tool.id,
    route,
    canonicalRoute,
    title: tool.name,
    description: tool.desc,
    categoryId: tool.category,
    applicability: {
      scope: panAfrican ? 'pan-african' : (countryIds.length ? 'countries' : 'regional'),
      countryIds,
      regionIds: []
    },
    currencies,
    units: Array.isArray(tool.units) ? tool.units.slice() : [],
    publicationStatus: aliasTargetId ? 'redirect' : (['live', 'new'].includes(tool.status) ? 'published' : 'unpublished'),
    localeCoverage: [locale],
    calculatorVersion: tool.calculatorVersion || tool.version || null,
    sourceVersion: tool.sourceVersion || null,
    dataFreshness: normalizeFreshness(tool),
    widgetEligibility: {
      eligible: widgetIds.length > 0,
      widgetIds: widgetIds.slice().sort()
    },
    availability: availabilityFor(tool),
    deprecated: Boolean(aliasTargetId),
    redirectTarget: aliasTargetId ? { toolId: aliasTargetId, route: canonicalRoute } : null,
    routeAliases: [],
    indexable: !aliasTargetId && ['live', 'new'].includes(tool.status),
    source: {
      owner: 'assets/js/components/tool-registry.js',
      status: tool.status,
      phase: tool.phase || null,
      countries: rawCountries,
      toolCount: Number(tool.toolCount || 1),
      sourceId: tool.sourceId || null,
      tier: tool.tier || null,
      revenue: tool.revenue || null,
      priority: Number(tool.priority || 0),
      icon: tool.icon || null,
      tags: Array.isArray(tool.tags) ? tool.tags.slice() : [],
      aliases: Array.isArray(tool.aliases) ? tool.aliases.slice() : []
    }
  };
}

function normalizeWidget(widget) {
  return {
    id: widget.id,
    route: publicRoute(widget.iframePath),
    canonicalRoute: publicRoute(widget.iframePath),
    title: widget.name,
    description: widget.description,
    categoryId: widget.category,
    fullToolRoute: publicRoute(widget.fullToolLink),
    scriptPath: widget.scriptPath,
    publicationStatus: 'published',
    availability: 'free',
    source: widget.source || 'widgets/WIDGET-REGISTRY.js'
  };
}

function normalizeCategory(id, category) {
  return {
    id,
    title: category.name,
    description: category.desc,
    route: publicRoute(category.href),
    publicationStatus: 'published',
    source: 'assets/js/components/tool-registry.js'
  };
}

function normalizeApiPlans(plans) {
  const canonicalTiers = new Map();
  Object.entries(plans).forEach(([sourceId, plan]) => {
    const tier = plan.tier || sourceId;
    if (!canonicalTiers.has(tier)) {
      canonicalTiers.set(tier, {
        id: `api:${tier}`,
        tier,
        title: plan.label,
        limits: { daily: plan.day, monthly: plan.month },
        unlimited: plan.day === -1 || plan.month === -1,
        aliases: [],
        publicationStatus: 'published',
        source: 'netlify/functions/_shared/api-plans.js'
      });
    }
    if (sourceId !== tier) canonicalTiers.get(tier).aliases.push(sourceId);
  });
  return [...canonicalTiers.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeProductPlans(plans) {
  return Object.values(plans).map((plan) => ({
    id: `product:${plan.id}`,
    interval: plan.interval,
    currency: plan.currency,
    amountMinor: plan.amount,
    title: plan.label,
    suffix: plan.suffix,
    detail: plan.detail,
    paymentPlanId: plan.paystackPlanId,
    publicationStatus: 'published',
    source: 'assets/js/lib/pro-plan.js'
  })).sort((a, b) => a.id.localeCompare(b.id));
}

function normalizeProApps(apps) {
  return apps.map((app) => ({
    id: app.id,
    title: app.name,
    route: publicRoute(app.route),
    publicationStatus: app.routeExists === false ? 'unpublished' : 'published',
    routeStatus: app.routeStatus,
    shellState: app.shellState,
    readiness: app.readiness,
    source: 'assets/js/lib/pro-app-registry.js'
  })).sort((a, b) => a.id.localeCompare(b.id));
}

function selector(id, label, definition, records, valueOverride) {
  return {
    id,
    label,
    definition,
    value: Number.isInteger(valueOverride) ? valueOverride : records.length,
    recordIds: records.map((record) => typeof record === 'string' ? record : record.id).filter(Boolean).sort()
  };
}

function buildSelectors(registry, sources) {
  const canonicalPublished = registry.tools.filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated);
  const localized = canonicalPublished.filter((tool) => !tool.localeCoverage.includes('en'));
  const canonicalEnglish = canonicalPublished.filter((tool) => tool.localeCoverage.includes('en'));
  const indexable = canonicalPublished.filter((tool) => tool.indexable);
  const unpublished = registry.tools.filter((tool) => !['published', 'redirect'].includes(tool.publicationStatus));
  const widgets = registry.widgets.filter((widget) => widget.publicationStatus === 'published');
  const widgetCategoryIds = [...new Set(widgets.map((widget) => widget.categoryId))].sort();
  const countryPaye = widgets.filter((widget) => /-paye$/.test(widget.id));
  const countryTax = widgets.filter((widget) => /-(?:paye|vat)$/.test(widget.id));
  const siteLanguages = registry.locales.filter((locale) => locale.published);
  const selectors = [
    selector('tools.raw_rows', 'Raw tool registry rows', 'Every row in the legacy browser tool registry, including localized rows and explicit redirect aliases.', registry.tools),
    selector('tools.canonical_published', 'Canonical published tool records', 'Published non-deprecated tool records after explicit route aliases are excluded.', canonicalPublished),
    selector('tools.english_canonical_published', 'Canonical published English tool records', 'Canonical published non-redirect tool records whose locale coverage includes English.', canonicalEnglish),
    selector('tools.live_experiences', 'Live tool experiences', 'Unique English published destinations plus declared hidden country variants from toolCount families.', [], sources.getTotalToolCount((tool) => ['live', 'new'].includes(tool.status))),
    selector('tools.localized_records', 'Localized published tool records', 'Canonical published tool records whose locale coverage does not include English.', localized),
    selector('tools.indexable_destinations', 'Indexable tool destinations', 'Canonical published non-redirect tool records marked indexable.', indexable),
    selector('tools.unpublished', 'Unpublished tool records', 'Canonical tool records that are neither published nor redirect aliases.', unpublished),
    selector('tools.widget_enabled', 'Widget-enabled tool records', 'Canonical published tool records linked to at least one published widget by canonical full-tool route.', canonicalPublished.filter((tool) => tool.widgetEligibility.eligible)),
    selector('widgets.published', 'Published widgets', 'Widget registry records with a published iframe destination.', widgets),
    selector('widgets.categories', 'Widget categories', 'Distinct category identifiers represented by published widgets.', widgetCategoryIds),
    selector('widgets.country_paye', 'Country PAYE widgets', 'Published widgets whose stable ID ends in -paye.', countryPaye),
    selector('widgets.country_tax', 'Country PAYE and VAT widgets', 'Published widgets whose stable ID ends in -paye or -vat.', countryTax),
    selector('categories.published', 'Published tool categories', 'Canonical category records with published hubs.', registry.categories.filter((category) => category.publicationStatus === 'published')),
    selector('countries.published', 'Published African country hubs', 'Canonical African jurisdictions with published country hubs; the ALL sentinel is excluded.', registry.countries.filter((country) => country.publicationStatus === 'published')),
    selector('currencies.country', 'Country currencies', 'Distinct currency codes assigned to canonical published African jurisdictions.', [...new Set(registry.countries.map((country) => country.currency).filter(Boolean))]),
    selector('languages.site_published', 'Published site languages', 'Site locales marked published, including the default English locale and partial public locales.', siteLanguages),
    selector('plans.api', 'API plans', 'Canonical API quota tiers after aliases such as starter are collapsed.', registry.apiPlans),
    selector('plans.product_options', 'Product subscription options', 'Published currency and billing-interval options in the Pro product plan module.', registry.productPlans),
    selector('pro.apps', 'Pro apps', 'Published Pro application records with repository routes.', registry.proApps.filter((app) => app.publicationStatus === 'published'))
  ];

  registry.locales.filter((locale) => locale.published).forEach((locale) => {
    const records = canonicalPublished.filter((tool) => tool.localeCoverage.includes(locale.id));
    selectors.push(selector(
      `tools.locale.${locale.id}.published`,
      `${locale.id} published tool records`,
      `Canonical published non-redirect tool records whose locale coverage includes ${locale.id}.`,
      records
    ));
  });

  widgetCategoryIds.forEach((categoryId) => {
    const records = widgets.filter((widget) => widget.categoryId === categoryId);
    selectors.push(selector(`widgets.category.${categoryId}.published`, `${categoryId} published widgets`, `Published widgets in widget category ${categoryId}.`, records));
  });

  registry.categories.forEach((category) => {
    const records = canonicalPublished.filter((tool) => tool.categoryId === category.id);
    selectors.push(selector(`tools.category.${category.id}.published`, `${category.title} published tool records`, `Canonical published non-redirect tool records in category ${category.id}.`, records));
  });
  registry.featureCollections.forEach((collection) => {
    const records = collection.toolIds.filter((id) => canonicalPublished.some((tool) => tool.id === id));
    selectors.push(selector(`features.${collection.id}`, collection.label, collection.description, records));
  });
  return selectors.sort((a, b) => a.id.localeCompare(b.id));
}

function buildCanonicalRegistry(sourceOverride) {
  const sources = sourceOverride || loadSources();
  const policy = sources.policy;
  const countries = sources.countries.map((country) => normalizeCountry(country, policy));
  const countryById = new Map(countries.map((country) => [country.id, country]));
  const sourceToolsById = new Map(sources.tools.map((tool) => [tool.id, tool]));
  const widgetLinks = buildWidgetLinks(sources.widgets);
  const context = { policy, countryById, sourceToolsById, widgetLinks };
  const registry = {
    schemaVersion: policy.schemaVersion,
    definitions: {
      tool: 'A stable normalized source record. Localized records are separate tools; explicit redirect aliases are records but are excluded from published counts.',
      liveTool: 'A canonical published non-redirect record with a repository destination.',
      liveToolExperience: 'A unique English published destination plus explicitly declared hidden country variants.',
      widget: 'A published widget registry record with a working iframe destination.',
      country: 'One of the 54 canonical African jurisdictions; ALL is a regional sentinel, not a country.',
      language: 'A site locale marked published; AI input languages and source-language claims are separate capabilities.'
    },
    tools: sources.tools.map((tool) => normalizeTool(tool, context)),
    widgets: sources.widgets.map(normalizeWidget),
    categories: Object.entries(sources.categories).map(([id, category]) => normalizeCategory(id, category)).sort((a, b) => a.id.localeCompare(b.id)),
    countries: countries.sort((a, b) => a.id.localeCompare(b.id)),
    locales: policy.locales.map(normalizeLocale).sort((a, b) => a.id.localeCompare(b.id)),
    apiPlans: normalizeApiPlans(sources.apiPlans),
    productPlans: normalizeProductPlans(sources.productPlans),
    proApps: normalizeProApps(sources.proApps),
    featureCollections: policy.featureCollections.map((collection) => ({ ...collection, source: 'data/registry/catalog-policy.json' })),
    selectors: []
  };
  const normalizedToolsById = new Map(registry.tools.map((tool) => [tool.id, tool]));
  registry.tools.filter((tool) => tool.publicationStatus === 'redirect' && tool.redirectTarget).forEach((alias) => {
    const target = normalizedToolsById.get(alias.redirectTarget.toolId);
    if (target) target.routeAliases.push(alias.id);
  });
  registry.tools.forEach((tool) => tool.routeAliases.sort());
  registry.selectors = buildSelectors(registry, sources);
  return registry;
}

function issue(code, recordType, recordId, field, message) {
  return { code, recordType, recordId, field, message };
}

function duplicates(records, keyFn) {
  const groups = new Map();
  records.forEach((record) => {
    const key = keyFn(record);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });
  return [...groups.entries()].filter(([, matches]) => matches.length > 1);
}

function validateCanonicalRegistry(registry) {
  const errors = [];
  const warnings = [];
  const categoryIds = new Set(registry.categories.map((record) => record.id));
  const countryIds = new Set(registry.countries.map((record) => record.id));
  const localeIds = new Set(registry.locales.map((record) => record.id));
  const toolsById = new Map(registry.tools.map((record) => [record.id, record]));

  duplicates(registry.tools, (record) => record.id).forEach(([id]) => errors.push(issue('TOOL_ID_DUPLICATE', 'tool', id, 'id', 'Tool IDs must be unique.')));
  const canonicalPublished = registry.tools.filter((record) => record.publicationStatus === 'published' && !record.deprecated);
  duplicates(canonicalPublished, (record) => normalizeRoute(record.canonicalRoute)).forEach(([route, records]) => {
    records.forEach((record) => errors.push(issue('TOOL_CANONICAL_ROUTE_DUPLICATE', 'tool', record.id, 'canonicalRoute', `Canonical route ${route} is also used by ${records.filter((other) => other.id !== record.id).map((other) => other.id).join(', ')}.`)));
  });

  registry.tools.forEach((tool) => {
    ['id', 'route', 'canonicalRoute', 'title', 'description', 'categoryId'].forEach((field) => {
      if (!tool[field]) errors.push(issue('TOOL_FIELD_REQUIRED', 'tool', tool.id || '(missing)', field, `${field} is required.`));
    });
    if (!VALID_PUBLICATION_STATES.has(tool.publicationStatus)) errors.push(issue('TOOL_PUBLICATION_STATE_INVALID', 'tool', tool.id, 'publicationStatus', `Unknown publication state ${tool.publicationStatus}.`));
    if (!categoryIds.has(tool.categoryId)) errors.push(issue('TOOL_CATEGORY_UNKNOWN', 'tool', tool.id, 'categoryId', `Category ${tool.categoryId} is not in the canonical category registry.`));
    tool.applicability.countryIds.forEach((countryId) => {
      if (!countryIds.has(countryId)) errors.push(issue('TOOL_COUNTRY_UNKNOWN', 'tool', tool.id, 'applicability.countryIds', `Country ${countryId} is not in the canonical country registry.`));
    });
    tool.localeCoverage.forEach((localeId) => {
      if (!localeIds.has(localeId)) errors.push(issue('TOOL_LOCALE_UNKNOWN', 'tool', tool.id, 'localeCoverage', `Locale ${localeId} is not in the canonical locale registry.`));
    });
    if (tool.publicationStatus === 'published' && !routeExists(tool.route)) errors.push(issue('TOOL_DESTINATION_MISSING', 'tool', tool.id, 'route', `Published destination ${tool.route} does not exist.`));
    if (tool.publicationStatus === 'redirect') {
      const target = tool.redirectTarget && toolsById.get(tool.redirectTarget.toolId);
      if (!target) errors.push(issue('TOOL_ALIAS_TARGET_UNKNOWN', 'tool', tool.id, 'redirectTarget', 'Redirect aliases require a valid canonical tool target.'));
      else if (target.publicationStatus !== 'published' || target.deprecated) errors.push(issue('TOOL_ALIAS_TARGET_INVALID', 'tool', tool.id, 'redirectTarget', `Target ${target.id} must be a canonical published record.`));
      else if (normalizeRoute(tool.route) !== normalizeRoute(target.route)) errors.push(issue('TOOL_ALIAS_ROUTE_MISMATCH', 'tool', tool.id, 'route', `Alias route must normalize to target ${target.id} route ${target.route}.`));
      if (tool.indexable) errors.push(issue('TOOL_ALIAS_INDEXABLE', 'tool', tool.id, 'indexable', 'Redirect aliases must not be included in indexable counts.'));
    }
  });

  duplicates(registry.widgets, (record) => record.id).forEach(([id]) => errors.push(issue('WIDGET_ID_DUPLICATE', 'widget', id, 'id', 'Widget IDs must be unique.')));
  duplicates(registry.widgets, (record) => normalizeRoute(record.canonicalRoute)).forEach(([route, records]) => {
    records.forEach((record) => errors.push(issue('WIDGET_ROUTE_DUPLICATE', 'widget', record.id, 'canonicalRoute', `Widget route ${route} is shared by another widget.`)));
  });
  registry.widgets.forEach((widget) => {
    if (widget.publicationStatus === 'published' && !routeExists(widget.route)) errors.push(issue('WIDGET_DESTINATION_MISSING', 'widget', widget.id, 'route', `Published iframe destination ${widget.route} does not exist.`));
    if (widget.publicationStatus === 'published' && !routeExists(widget.fullToolRoute)) errors.push(issue('WIDGET_TOOL_DESTINATION_MISSING', 'widget', widget.id, 'fullToolRoute', `Full-tool destination ${widget.fullToolRoute} does not exist.`));
  });

  registry.categories.forEach((category) => {
    if (category.publicationStatus === 'published' && !routeExists(category.route)) errors.push(issue('CATEGORY_DESTINATION_MISSING', 'category', category.id, 'route', `Published category destination ${category.route} does not exist.`));
  });
  duplicates(registry.categories, (record) => record.id).forEach(([id]) => errors.push(issue('CATEGORY_ID_DUPLICATE', 'category', id, 'id', 'Category IDs must be unique.')));
  duplicates(registry.categories, (record) => normalizeRoute(record.route)).forEach(([route, records]) => {
    records.forEach((record) => errors.push(issue('CATEGORY_ROUTE_DUPLICATE', 'category', record.id, 'route', `Category route ${route} is shared by another category.`)));
  });
  duplicates(registry.countries, (record) => record.id).forEach(([id]) => errors.push(issue('COUNTRY_ID_DUPLICATE', 'country', id, 'id', 'Country IDs must be unique.')));
  duplicates(registry.countries, (record) => normalizeRoute(record.route)).forEach(([route, records]) => {
    records.forEach((record) => errors.push(issue('COUNTRY_ROUTE_DUPLICATE', 'country', record.id, 'route', `Country route ${route} is shared by another country.`)));
  });
  registry.countries.forEach((country) => {
    const recordId = country.id || '(missing)';
    const requiredFields = ['id', 'isoCode', 'title', 'flag', 'route', 'routeSlug', 'region', 'currency', 'sourceJurisdiction'];
    requiredFields.forEach((field) => {
      if (!country[field]) errors.push(issue('COUNTRY_FIELD_REQUIRED', 'country', recordId, field, `${field} is required.`));
    });
    if (!/^[A-Z]{2}$/.test(country.id || '')) errors.push(issue('COUNTRY_ISO_INVALID', 'country', recordId, 'id', 'Country id must be an ISO 3166-1 alpha-2 code.'));
    if (country.isoCode !== country.id) errors.push(issue('COUNTRY_ISO_MISMATCH', 'country', recordId, 'isoCode', `ISO code ${country.isoCode} must match stable id ${country.id}.`));
    if (country.sourceJurisdiction !== country.id) errors.push(issue('COUNTRY_SOURCE_JURISDICTION_MISMATCH', 'country', recordId, 'sourceJurisdiction', `Source jurisdiction ${country.sourceJurisdiction} must match country id ${country.id}.`));
    if (country.routeSlug !== country.route.replace(/^\/+|\/+$/g, '')) errors.push(issue('COUNTRY_ROUTE_SLUG_MISMATCH', 'country', recordId, 'routeSlug', `Route slug ${country.routeSlug} does not match route ${country.route}.`));
    const expectedFlag = String(country.id || '').replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
    if (country.flag !== expectedFlag) errors.push(issue('COUNTRY_FLAG_MISMATCH', 'country', recordId, 'flag', `Flag ${country.flag} does not match ${country.id}.`));
    if (!VALID_COUNTRY_REGIONS.has(country.region)) errors.push(issue('COUNTRY_REGION_INVALID', 'country', recordId, 'region', `Unknown region ${country.region}.`));
    if (!/^[A-Z]{3}$/.test(country.currency || '')) errors.push(issue('COUNTRY_CURRENCY_INVALID', 'country', recordId, 'currency', `Currency ${country.currency} must be an ISO 4217 code.`));
    PUBLIC_COUNTRY_LOCALES.forEach((localeId) => {
      if (!country.displayNames || !country.displayNames[localeId]) errors.push(issue('COUNTRY_DISPLAY_NAME_MISSING', 'country', recordId, `displayNames.${localeId}`, `Display name for ${localeId} is required.`));
      const coverage = country.localeCoverage && country.localeCoverage[localeId];
      if (!coverage) {
        errors.push(issue('COUNTRY_LOCALE_COVERAGE_MISSING', 'country', recordId, `localeCoverage.${localeId}`, `Locale coverage for ${localeId} is required.`));
      } else {
        if (!VALID_COUNTRY_LOCALE_STATES.has(coverage.state)) errors.push(issue('COUNTRY_LOCALE_COVERAGE_INVALID', 'country', recordId, `localeCoverage.${localeId}.state`, `Unknown country locale state ${coverage.state}.`));
        if (coverage.indexable && (!coverage.route || coverage.state === 'english-fallback' || coverage.state === 'unavailable')) errors.push(issue('COUNTRY_LOCALE_INDEXABILITY_INVALID', 'country', recordId, `localeCoverage.${localeId}.indexable`, `Indexable country locale coverage requires a native or localized-shell route.`));
      }
    });
    country.supportedToolTypes.forEach((categoryId) => {
      if (!categoryIds.has(categoryId)) errors.push(issue('COUNTRY_TOOL_TYPE_UNKNOWN', 'country', recordId, 'supportedToolTypes', `Tool type ${categoryId} is not a canonical category.`));
    });
    const expectedToolTypes = [...new Set(registry.tools
      .filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated && tool.applicability.countryIds.includes(country.id))
      .map((tool) => tool.categoryId))].sort();
    if (JSON.stringify(country.supportedToolTypes) !== JSON.stringify(expectedToolTypes)) {
      errors.push(issue('COUNTRY_TOOL_TYPES_STALE', 'country', recordId, 'supportedToolTypes', `Expected ${expectedToolTypes.join(', ') || '(none)'} from published tool applicability; found ${country.supportedToolTypes.join(', ') || '(none)'}.`));
    }
    Object.entries(country.localeCoverage || {}).forEach(([localeId, coverage]) => {
      if (!localeIds.has(localeId)) errors.push(issue('COUNTRY_LOCALE_UNKNOWN', 'country', recordId, `localeCoverage.${localeId}`, `Locale ${localeId} is not in the locale manifest.`));
      if (coverage.route && !routeExists(coverage.route)) errors.push(issue('COUNTRY_LOCALE_DESTINATION_MISSING', 'country', recordId, `localeCoverage.${localeId}.route`, `Locale route ${coverage.route} does not exist.`));
    });
    if (country.publicationStatus === 'published' && !routeExists(country.route)) errors.push(issue('COUNTRY_DESTINATION_MISSING', 'country', country.id, 'route', `Published country destination ${country.route} does not exist.`));
  });
  registry.locales.forEach((locale) => {
    if (!VALID_LOCALE_STATES.has(locale.state)) errors.push(issue('LOCALE_STATE_INVALID', 'locale', locale.id, 'state', `Locale state ${locale.state} is invalid.`));
  });
  duplicates(registry.locales, (record) => record.id).forEach(([id]) => errors.push(issue('LOCALE_ID_DUPLICATE', 'locale', id, 'id', 'Locale IDs must be unique.')));
  if (registry.locales.filter((locale) => locale.state === 'default').length !== 1) errors.push(issue('LOCALE_DEFAULT_COUNT', 'locale', '(registry)', 'state', 'Exactly one locale must have the default state.'));
  registry.featureCollections.forEach((collection) => {
    collection.toolIds.forEach((toolId) => {
      if (!toolsById.has(toolId)) errors.push(issue('FEATURE_TOOL_UNKNOWN', 'featureCollection', collection.id, 'toolIds', `Tool ${toolId} is not in the canonical registry.`));
    });
  });
  duplicates(registry.selectors, (record) => record.id).forEach(([id]) => errors.push(issue('SELECTOR_ID_DUPLICATE', 'selector', id, 'id', 'Selector IDs must be unique.')));
  const aliases = new Set(registry.tools.filter((tool) => tool.publicationStatus === 'redirect').map((tool) => tool.id));
  registry.selectors.filter((record) => record.id.startsWith('tools.') && record.id !== 'tools.raw_rows').forEach((selected) => {
    selected.recordIds.filter((id) => aliases.has(id)).forEach((id) => errors.push(issue('SELECTOR_INCLUDES_REDIRECT', 'selector', selected.id, 'recordIds', `Redirect alias ${id} must not be included without an explicit alias-count policy.`)));
  });
  return { ok: errors.length === 0, errors, warnings };
}

function getSelector(registry, selectorId) {
  return registry.selectors.find((candidate) => candidate.id === selectorId) || null;
}

function buildRegistryReport(registry) {
  const selectorValue = (id) => {
    const found = getSelector(registry, id);
    return found ? found.value : 0;
  };
  const aliases = registry.tools.filter((tool) => tool.publicationStatus === 'redirect').map((tool) => ({
    id: tool.id,
    route: tool.route,
    redirectTarget: tool.redirectTarget
  })).sort((a, b) => a.id.localeCompare(b.id));
  return {
    schemaVersion: registry.schemaVersion,
    summary: {
      rawToolRows: selectorValue('tools.raw_rows'),
      redirectAliases: aliases.length,
      canonicalPublishedTools: selectorValue('tools.canonical_published'),
      canonicalEnglishTools: selectorValue('tools.english_canonical_published'),
      localizedTools: selectorValue('tools.localized_records'),
      expandedLiveToolExperiences: selectorValue('tools.live_experiences'),
      indexableToolDestinations: selectorValue('tools.indexable_destinations'),
      widgetEnabledTools: selectorValue('tools.widget_enabled'),
      publishedWidgets: selectorValue('widgets.published'),
      widgetCategories: selectorValue('widgets.categories'),
      categories: selectorValue('categories.published'),
      countries: selectorValue('countries.published'),
      siteLanguages: selectorValue('languages.site_published'),
      apiPlans: selectorValue('plans.api'),
      productPlanOptions: selectorValue('plans.product_options'),
      proApps: selectorValue('pro.apps')
    },
    definitions: registry.definitions,
    aliases,
    selectors: registry.selectors.map((item) => ({ id: item.id, label: item.label, definition: item.definition, value: item.value })),
    localeCoverage: registry.locales.map((locale) => ({ id: locale.id, state: locale.state, published: locale.published, toolRecords: registry.tools.filter((tool) => tool.localeCoverage.includes(locale.id) && tool.publicationStatus === 'published').length })),
    categoryCoverage: registry.categories.map((category) => ({ id: category.id, title: category.title, toolRecords: selectorValue(`tools.category.${category.id}.published`) }))
  };
}

function formatIssue(item) {
  return `[${item.code}] ${item.recordType}:${item.recordId} field=${item.field} - ${item.message}`;
}

function cloneCanonicalRegistry(registry) {
  return JSON.parse(JSON.stringify(registry));
}

module.exports = {
  ROOT,
  loadSources,
  buildCanonicalRegistry,
  validateCanonicalRegistry,
  getSelector,
  buildRegistryReport,
  formatIssue,
  cloneCanonicalRegistry,
  normalizeRoute,
  publicRoute,
  routeExists
};
