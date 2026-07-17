const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'registry', 'locale-manifest.json');
const COVERAGE_POLICY_PATH = path.join(ROOT, 'data', 'registry', 'locale-coverage-policy.json');
const YORUBA_ROUTE_MANIFEST_PATH = path.join(ROOT, 'data', 'registry', 'yoruba-route-manifest.json');
const COUNTRY_PATH = path.join(ROOT, 'data', 'registry', 'countries.json');
const CATALOG_DIR = path.join(ROOT, 'lang');
const COVERAGE_STATES = new Set(['native', 'localized-shell', 'english-fallback', 'unavailable', 'deprecated']);
const PUBLIC_STATUSES = new Set(['default', 'launched', 'partial']);
const LAUNCH_STATUSES = new Set(['default', 'launched', 'partial', 'planned', 'retired']);
const MOJIBAKE_RE = /(?:\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2\u20ac|\u00f0\u0178|\ufffd)/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadLocaleManifest() {
  return readJson(MANIFEST_PATH);
}

function loadCoveragePolicy() {
  const policy = readJson(COVERAGE_POLICY_PATH);
  if (!fs.existsSync(YORUBA_ROUTE_MANIFEST_PATH)) return policy;
  const yorubaManifest = loadYorubaRouteManifest();
  const yorubaOverrides = (yorubaManifest.routes || []).map((record) => ({
    route: record.route,
    state: record.state,
    sourceOwner: record.sourceOwner,
    engineLocaleNeutral: Boolean(record.engineLocaleNeutral),
    equivalentRoute: record.englishEquivalent || null,
    fallbackRoute: record.fallbackRoute || null
  }));
  policy.overrides = [
    ...yorubaOverrides,
    ...(policy.overrides || []).filter((record) => !String(record.route || '').startsWith('/yo/'))
  ];
  return policy;
}

function loadYorubaRouteManifest() {
  return readJson(YORUBA_ROUTE_MANIFEST_PATH);
}

function getLocale(manifest, localeId) {
  return (manifest.locales || []).find((locale) => locale.id === localeId) || null;
}

function getPublicLocaleIds(manifest) {
  return (manifest.locales || [])
    .filter((locale) => PUBLIC_STATUSES.has(locale.launchStatus))
    .map((locale) => locale.id);
}

function catalogPath(localeId) {
  return path.join(CATALOG_DIR, `${localeId}.json`);
}

function loadCatalogs(manifest = loadLocaleManifest()) {
  const catalogs = {};
  for (const locale of manifest.locales || []) {
    const file = catalogPath(locale.id);
    if (fs.existsSync(file)) catalogs[locale.id] = readJson(file);
  }
  return catalogs;
}

function loadRawCatalogs(manifest = loadLocaleManifest()) {
  const catalogs = {};
  for (const locale of manifest.locales || []) {
    const file = catalogPath(locale.id);
    if (fs.existsSync(file)) catalogs[locale.id] = fs.readFileSync(file, 'utf8');
  }
  return catalogs;
}

function flatten(value, prefix = '', output = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output);
    }
  } else if (prefix) {
    output[prefix] = value;
  }
  return output;
}

function issue(code, owner, field, message, extra = {}) {
  return { code, owner, field, message, ...extra };
}

function result(errors, warnings = []) {
  return { ok: errors.length === 0, errors, warnings };
}

function formatIssue(entry) {
  const context = [
    entry.locale ? `locale=${entry.locale}` : '',
    entry.route ? `route=${entry.route}` : '',
    entry.key ? `key=${entry.key}` : '',
    `owner=${entry.owner || 'unknown'}`,
    `field=${entry.field || 'unknown'}`
  ].filter(Boolean).join(' ');
  return `[${entry.code}] ${context} - ${entry.message}`;
}

function validateLocaleManifest(manifest, options = {}) {
  const errors = [];
  const countries = options.countries || readJson(COUNTRY_PATH);
  const countryIds = new Set(countries.map((country) => country.id));
  countryIds.add('ALL');
  const localeIds = new Set();
  const prefixes = new Set();

  if (!manifest || !Array.isArray(manifest.locales)) {
    return result([issue('LOCALE_MANIFEST_INVALID', 'data/registry/locale-manifest.json', 'locales', 'Manifest must contain a locales array.')]);
  }
  if (manifest.normalization !== 'NFC') {
    errors.push(issue('LOCALE_NORMALIZATION_INVALID', 'data/registry/locale-manifest.json', 'normalization', 'User-facing normalization must be NFC.'));
  }

  for (const locale of manifest.locales) {
    const owner = 'data/registry/locale-manifest.json';
    const id = locale && locale.id;
    if (typeof id !== 'string' || !/^[a-z]{2,3}$/.test(id)) {
      errors.push(issue('LOCALE_CODE_INVALID', owner, 'id', `Locale code ${JSON.stringify(id)} must be a lowercase ISO 639 language code.`, { locale: id }));
    }
    if (typeof id === 'string' && countryIds.has(id.toUpperCase())) {
      errors.push(issue('COUNTRY_CODE_USED_AS_LOCALE', owner, 'id', `${id} is also a country code and is not accepted as a locale identifier here.`, { locale: id }));
    }
    if (localeIds.has(id)) errors.push(issue('LOCALE_ID_DUPLICATE', owner, 'id', `Duplicate locale ${id}.`, { locale: id }));
    localeIds.add(id);
    if (!LAUNCH_STATUSES.has(locale.launchStatus)) {
      errors.push(issue('LOCALE_LAUNCH_STATUS_INVALID', owner, 'launchStatus', `Unknown launch status ${locale.launchStatus}.`, { locale: id }));
    }
    for (const field of ['displayName', 'nativeName', 'direction', 'contentOwner', 'marketFocus', 'formatting', 'minimumIndexableCoverage']) {
      if (locale[field] === undefined || locale[field] === null || locale[field] === '') {
        errors.push(issue('LOCALE_FIELD_MISSING', owner, field, `${id} requires ${field}.`, { locale: id }));
      }
    }
    if (!['ltr', 'rtl'].includes(locale.direction)) {
      errors.push(issue('LOCALE_DIRECTION_INVALID', owner, 'direction', `${id} direction must be ltr or rtl.`, { locale: id }));
    }
    if (typeof locale.nativeName === 'string' && locale.nativeName !== locale.nativeName.normalize('NFC')) {
      errors.push(issue('UNICODE_NOT_NFC', owner, 'nativeName', `${id} native name is not NFC.`, { locale: id }));
    }
    if (MOJIBAKE_RE.test(String(locale.displayName || '')) || MOJIBAKE_RE.test(String(locale.nativeName || ''))) {
      errors.push(issue('UNICODE_MOJIBAKE', owner, 'nativeName', `${id} contains a mojibake signature.`, { locale: id }));
    }
    const publicLocale = PUBLIC_STATUSES.has(locale.launchStatus);
    if (publicLocale && typeof locale.routePrefix !== 'string') {
      errors.push(issue('LOCALE_LAUNCH_ROUTE_MISSING', owner, 'routePrefix', `${id} is public but has no route prefix contract.`, { locale: id }));
    }
    if (publicLocale && !fs.existsSync(catalogPath(id))) {
      errors.push(issue('LOCALE_LAUNCH_CATALOG_MISSING', owner, 'catalog', `${id} is public but has no shared catalog.`, { locale: id }));
    }
    if (locale.launchStatus === 'planned' && locale.routePrefix !== null) {
      errors.push(issue('LOCALE_PLANNED_ROUTE_EXPOSED', owner, 'routePrefix', `${id} is planned and must not expose a public route prefix.`, { locale: id }));
    }
    if (typeof locale.routePrefix === 'string') {
      if (prefixes.has(locale.routePrefix)) errors.push(issue('LOCALE_ROUTE_PREFIX_DUPLICATE', owner, 'routePrefix', `Duplicate route prefix ${locale.routePrefix}.`, { locale: id }));
      prefixes.add(locale.routePrefix);
    }
    if (!Array.isArray(locale.countryRefs) || !locale.countryRefs.length) {
      errors.push(issue('LOCALE_COUNTRY_REFS_MISSING', owner, 'countryRefs', `${id} requires at least one country or ALL.`, { locale: id }));
    } else {
      for (const countryId of locale.countryRefs) {
        if (!countryIds.has(countryId)) errors.push(issue('LOCALE_COUNTRY_UNKNOWN', owner, 'countryRefs', `${id} references unknown country ${countryId}.`, { locale: id }));
      }
    }
    if (locale.fallbackLocale && !manifest.locales.some((candidate) => candidate.id === locale.fallbackLocale)) {
      errors.push(issue('LOCALE_FALLBACK_UNKNOWN', owner, 'fallbackLocale', `${id} references unknown fallback ${locale.fallbackLocale}.`, { locale: id }));
    }
    try {
      const formatting = locale.formatting || {};
      new Intl.NumberFormat(formatting.localeTag);
      new Intl.DateTimeFormat(formatting.localeTag);
      if (formatting.currency && formatting.currency.defaultCurrency) {
        new Intl.NumberFormat(formatting.localeTag, { style: 'currency', currency: formatting.currency.defaultCurrency });
      }
    } catch (error) {
      errors.push(issue('LOCALE_FORMATTING_INVALID', owner, 'formatting', `${id} has invalid Intl formatting metadata: ${error.message}`, { locale: id }));
    }
  }

  if (!localeIds.has(manifest.defaultLocale)) {
    errors.push(issue('LOCALE_DEFAULT_UNKNOWN', 'data/registry/locale-manifest.json', 'defaultLocale', `Unknown default locale ${manifest.defaultLocale}.`));
  }
  const defaultRows = manifest.locales.filter((locale) => locale.launchStatus === 'default');
  if (defaultRows.length !== 1 || defaultRows[0].id !== manifest.defaultLocale) {
    errors.push(issue('LOCALE_DEFAULT_INVALID', 'data/registry/locale-manifest.json', 'defaultLocale', 'Exactly one default locale must match defaultLocale.'));
  }
  return result(errors);
}

function findDuplicateJsonKeys(raw) {
  const duplicates = [];
  const stack = [];
  let i = 0;
  function skipWhitespace() { while (i < raw.length && /\s/.test(raw[i])) i += 1; }
  function readString() {
    const start = i;
    i += 1;
    let escaped = false;
    while (i < raw.length) {
      const char = raw[i];
      i += 1;
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') break;
    }
    return JSON.parse(raw.slice(start, i));
  }
  while (i < raw.length) {
    skipWhitespace();
    const char = raw[i];
    if (char === '{') { stack.push({ type: 'object', keys: new Set(), expectKey: true }); i += 1; continue; }
    if (char === '[') { stack.push({ type: 'array' }); i += 1; continue; }
    if (char === '}' || char === ']') { stack.pop(); i += 1; continue; }
    if (char === ',') { const top = stack[stack.length - 1]; if (top && top.type === 'object') top.expectKey = true; i += 1; continue; }
    if (char === '"') {
      const value = readString();
      const top = stack[stack.length - 1];
      skipWhitespace();
      if (top && top.type === 'object' && top.expectKey && raw[i] === ':') {
        if (top.keys.has(value)) duplicates.push(value);
        top.keys.add(value);
        top.expectKey = false;
      }
      continue;
    }
    i += 1;
  }
  return duplicates;
}

function variablesFor(value) {
  if (typeof value !== 'string') return [];
  return Array.from(value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g), (match) => match[1]).sort();
}

function validateCatalogs(manifest, options = {}) {
  const errors = [];
  const catalogs = options.catalogs || loadCatalogs(manifest);
  const rawCatalogs = options.rawCatalogs || loadRawCatalogs(manifest);
  const defaultCatalog = catalogs[manifest.defaultLocale];
  if (!defaultCatalog) return result([issue('CATALOG_DEFAULT_MISSING', `lang/${manifest.defaultLocale}.json`, 'catalog', 'Default catalog is missing.')]);
  const defaultFlat = flatten(defaultCatalog);
  const comparableDefaultKeys = Object.keys(defaultFlat).filter((key) => !key.startsWith('_meta.')).sort();

  for (const localeId of getPublicLocaleIds(manifest)) {
    const owner = `lang/${localeId}.json`;
    const catalog = catalogs[localeId];
    if (!catalog) {
      errors.push(issue('CATALOG_MISSING', owner, 'catalog', `Missing catalog for ${localeId}.`, { locale: localeId }));
      continue;
    }
    for (const domain of manifest.requiredCatalogDomains || []) {
      if (!catalog[domain] || typeof catalog[domain] !== 'object' || Array.isArray(catalog[domain])) {
        errors.push(issue('CATALOG_DOMAIN_MISSING', owner, domain, `${localeId} is missing required domain ${domain}.`, { locale: localeId }));
      }
    }
    const flat = flatten(catalog);
    const keys = Object.keys(flat).filter((key) => !key.startsWith('_meta.')).sort();
    for (const key of comparableDefaultKeys) {
      if (!Object.prototype.hasOwnProperty.call(flat, key)) errors.push(issue('CATALOG_KEY_MISSING', owner, key, `${localeId} is missing key ${key}.`, { locale: localeId, key }));
    }
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(defaultFlat, key)) errors.push(issue('CATALOG_KEY_ORPHAN', owner, key, `${localeId} contains orphan key ${key}.`, { locale: localeId, key }));
    }
    for (const [key, value] of Object.entries(flat)) {
      if (key.startsWith('_meta.')) continue;
      if (typeof value !== 'string') {
        errors.push(issue('CATALOG_VALUE_TYPE_INVALID', owner, key, `${key} must be a string.`, { locale: localeId, key }));
        continue;
      }
      if (value !== value.normalize('NFC')) errors.push(issue('UNICODE_NOT_NFC', owner, key, `${key} is not NFC.`, { locale: localeId, key }));
      if (MOJIBAKE_RE.test(value)) errors.push(issue('UNICODE_MOJIBAKE', owner, key, `${key} contains a mojibake or replacement-character signature.`, { locale: localeId, key }));
      if (/<\/?[A-Za-z][^>]*>|javascript\s*:/i.test(value)) errors.push(issue('CATALOG_HTML_UNSAFE', owner, key, `${key} contains HTML; shared catalogs are text-only.`, { locale: localeId, key }));
      const opening = (value.match(/\{/g) || []).length;
      const closing = (value.match(/\}/g) || []).length;
      if (opening !== closing || /\{[^{}]*$|^[^{}]*\}/.test(value)) errors.push(issue('CATALOG_VARIABLE_MALFORMED', owner, key, `${key} has malformed interpolation braces.`, { locale: localeId, key }));
      if (Object.prototype.hasOwnProperty.call(defaultFlat, key)) {
        const expected = variablesFor(defaultFlat[key]);
        const actual = variablesFor(value);
        if (expected.join('\0') !== actual.join('\0')) errors.push(issue('CATALOG_VARIABLE_MISMATCH', owner, key, `${key} variables ${actual.join(', ') || '(none)'} do not match ${expected.join(', ') || '(none)'}.`, { locale: localeId, key }));
      }
    }
    if (rawCatalogs[localeId]) {
      let duplicateKeys = [];
      try { duplicateKeys = findDuplicateJsonKeys(rawCatalogs[localeId]); } catch (error) {
        errors.push(issue('CATALOG_JSON_INVALID', owner, 'catalog', error.message, { locale: localeId }));
      }
      for (const key of duplicateKeys) errors.push(issue('CATALOG_KEY_DUPLICATE', owner, key, `Duplicate JSON key ${key}.`, { locale: localeId, key }));
    }
  }
  return result(errors);
}

function validateYorubaRouteManifest(routeManifest = loadYorubaRouteManifest()) {
  const errors = [];
  const owner = 'data/registry/yoruba-route-manifest.json';
  const allowedStates = new Set(['native', 'localized-shell', 'english-fallback', 'unavailable']);
  const routeRecords = routeManifest && Array.isArray(routeManifest.routes) ? routeManifest.routes : [];
  const aliasRecords = routeManifest && Array.isArray(routeManifest.redirectAliases) ? routeManifest.redirectAliases : [];
  const seen = new Set();

  if (!routeManifest || routeManifest.locale !== 'yo') {
    errors.push(issue('YORUBA_ROUTE_MANIFEST_INVALID', owner, 'locale', 'The Yoruba route manifest must declare locale yo.'));
  }
  if (!routeManifest || routeManifest.normalization !== 'NFC') {
    errors.push(issue('YORUBA_ROUTE_NORMALIZATION_INVALID', owner, 'normalization', 'Yoruba route metadata must use NFC.'));
  }

  for (const record of routeRecords) {
    const route = normalizeRoute(record.route);
    if (seen.has(route)) errors.push(issue('YORUBA_ROUTE_DUPLICATE', owner, 'route', `Duplicate Yoruba route ${route}.`, { route, locale: 'yo' }));
    seen.add(route);
    if (!route.startsWith('/yo/')) errors.push(issue('YORUBA_ROUTE_PREFIX_INVALID', owner, 'route', `${route} must use the /yo/ prefix.`, { route, locale: 'yo' }));
    if (!allowedStates.has(record.state)) errors.push(issue('YORUBA_ROUTE_STATE_INVALID', owner, 'state', `Unknown state ${record.state} for ${route}.`, { route, locale: 'yo' }));
    if (!record.sourceOwner || !fs.existsSync(path.join(ROOT, record.sourceOwner))) {
      errors.push(issue('YORUBA_ROUTE_OWNER_MISSING', owner, 'sourceOwner', `${route} requires an existing sourceOwner file.`, { route, locale: 'yo' }));
    }
    if (record.state === 'localized-shell' && !record.engineLocaleNeutral) {
      errors.push(issue('YORUBA_ROUTE_ENGINE_UNDECLARED', owner, 'engineLocaleNeutral', `${route} must declare a language-neutral engine.`, { route, locale: 'yo' }));
    }
    if (['native', 'localized-shell'].includes(record.state) && !record.englishEquivalent) {
      errors.push(issue('YORUBA_EQUIVALENT_MISSING', owner, 'englishEquivalent', `${route} requires an English equivalent for reciprocal hreflang.`, { route, locale: 'yo' }));
    }
    if (record.state === 'english-fallback' && !record.fallbackRoute) {
      errors.push(issue('YORUBA_FALLBACK_MISSING', owner, 'fallbackRoute', `${route} requires an explicit English fallback route.`, { route, locale: 'yo' }));
    }
  }

  const actualRoutes = walkFiles(path.join(ROOT, 'yo'), (file) => file.endsWith('.html'))
    .map((file) => normalizeRoute(`/${path.relative(ROOT, file).replace(/\\/g, '/').replace(/index\.html$/i, '').replace(/\.html$/i, '')}`));
  for (const route of actualRoutes) {
    if (!seen.has(route)) errors.push(issue('YORUBA_ROUTE_UNINVENTORIED', owner, 'routes', `Existing page ${route} is missing from the Yoruba route manifest.`, { route, locale: 'yo' }));
  }
  for (const route of seen) {
    if (!actualRoutes.includes(route)) errors.push(issue('YORUBA_ROUTE_SOURCE_ABSENT', owner, 'routes', `Manifest route ${route} has no HTML page.`, { route, locale: 'yo' }));
  }

  for (const alias of aliasRecords) {
    const route = alias.route || alias.routePattern;
    if (!route || !String(route).startsWith('/yo/')) {
      errors.push(issue('YORUBA_ALIAS_INVALID', owner, 'redirectAliases', 'Every Yoruba redirect alias must use /yo/.'));
    }
    if (alias.state !== 'redirect-alias' || !alias.redirectTarget) {
      errors.push(issue('YORUBA_ALIAS_TARGET_MISSING', owner, 'redirectAliases', `${route || '(missing)'} requires redirect-alias state and a target.`));
    }
    if (alias.indexableEligible !== false || alias.hreflangEligible !== false) {
      errors.push(issue('YORUBA_ALIAS_SEARCH_EXPOSED', owner, 'redirectAliases', `${route} must be excluded from indexability and hreflang.`));
    }
  }
  return result(errors);
}

function walkFiles(directory, predicate, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(file, predicate, output);
    else if (entry.isFile() && predicate(file)) output.push(file);
  }
  return output;
}

function validateUnicodeAndRouteSources(manifest) {
  const errors = [];
  const publicIds = new Set(getPublicLocaleIds(manifest));
  const localizedFiles = [];
  for (const localeId of publicIds) {
    if (localeId === manifest.defaultLocale) continue;
    walkFiles(path.join(ROOT, localeId), (file) => file.endsWith('.html'), localizedFiles);
  }
  const sourceFiles = [
    COUNTRY_PATH,
    MANIFEST_PATH,
    COVERAGE_POLICY_PATH,
    YORUBA_ROUTE_MANIFEST_PATH,
    path.join(ROOT, 'data', 'search-index.json'),
    path.join(ROOT, 'assets', 'js', 'components', 'navbar.js'),
    path.join(ROOT, 'assets', 'js', 'ai', 'i18n.js'),
    path.join(ROOT, 'assets', 'js', 'i18n-detect.js'),
    path.join(ROOT, 'assets', 'js', 'lib', 'locale-route-resolver.js'),
    path.join(ROOT, 'assets', 'js', 'lib', 'localization.js'),
    path.join(ROOT, 'assets', 'js', 'lib', 'localize-shared-ui.js'),
    path.join(ROOT, 'assets', 'js', 'lib', 'export-tools.js'),
    path.join(ROOT, 'assets', 'js', 'result-card.js'),
    path.join(ROOT, 'assets', 'js', 'ai', 'workflow-export.js'),
    ...localizedFiles
  ].filter((file, index, all) => fs.existsSync(file) && all.indexOf(file) === index);
  for (const file of sourceFiles) {
    const owner = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('\uFFFD')) errors.push(issue('UNICODE_REPLACEMENT_CHARACTER', owner, 'content', 'File contains a UTF-8 replacement character.'));
    if (MOJIBAKE_RE.test(content)) errors.push(issue('UNICODE_MOJIBAKE', owner, 'content', 'File contains a known UTF-8 mojibake signature.'));
    if (content !== content.normalize('NFC')) errors.push(issue('UNICODE_NOT_NFC', owner, 'content', 'User-facing source or generated search text is not NFC.'));
    if (file.endsWith('.html')) {
      const prefix = owner.split('/')[0];
      const lang = ((content.match(/<html\b[^>]*\blang=["']([^"']+)["']/i) || [])[1] || '').toLowerCase().split('-')[0];
      if (!publicIds.has(lang)) errors.push(issue('HTML_LOCALE_UNKNOWN', owner, 'html.lang', `HTML declares unknown or missing locale ${lang || '(missing)'}.`, { locale: lang }));
      if (publicIds.has(prefix) && prefix !== lang) errors.push(issue('LOCALE_ROUTE_MISMATCH', owner, 'html.lang', `/${prefix}/ route declares ${lang}.`, { locale: lang, route: `/${owner.replace(/\/index\.html$|\.html$/g, '')}/` }));
      if (/\blang=["'](?:NG|KE|GH|ZA|TZ|UG|NE|BJ)["']/i.test(content)) errors.push(issue('COUNTRY_CODE_USED_AS_LOCALE', owner, 'lang', 'A country code is used as a language code.'));
    }
  }
  return result(errors);
}

function normalizeRoute(route) {
  const value = String(route || '/').split(/[?#]/)[0].replace(/\\/g, '/').replace(/\/+/g, '/');
  if (value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}/`;
}

function classifyPage(input, policy = loadCoveragePolicy(), manifest = loadLocaleManifest(), catalogs = null) {
  const route = normalizeRoute(input.route);
  const localeId = input.locale || manifest.defaultLocale;
  const locale = getLocale(manifest, localeId);
  const exact = (policy.overrides || []).find((entry) => normalizeRoute(entry.route) === route);
  let matchedRule = null;
  if (!exact) {
    matchedRule = (policy.rules || []).find((entry) => {
      if (entry.locale && entry.locale !== localeId) return false;
      if (entry.pageTypes && !entry.pageTypes.includes(input.pageType)) return false;
      if (entry.routePattern && !(new RegExp(entry.routePattern).test(route))) return false;
      return true;
    }) || null;
  }
  const selected = exact || matchedRule || {};
  const state = selected.state || policy.defaultStates[localeId] || (locale && locale.launchStatus === 'planned' ? 'unavailable' : 'native');
  const flat = catalogs && catalogs[localeId] ? flatten(catalogs[localeId]) : null;
  const defaultFlat = catalogs && catalogs[manifest.defaultLocale] ? flatten(catalogs[manifest.defaultLocale]) : null;
  const requiredKeys = defaultFlat ? Object.keys(defaultFlat).filter((key) => !key.startsWith('_meta.')) : [];
  const nativeKeys = flat ? requiredKeys.filter((key) => typeof flat[key] === 'string') : requiredKeys;
  const fallbackKeys = Array.isArray(selected.fallbackKeys) ? selected.fallbackKeys.slice() : [];
  const nativeKeyRatio = requiredKeys.length ? nativeKeys.length / requiredKeys.length : 1;
  const threshold = locale && locale.minimumIndexableCoverage || { eligibleStates: [] };
  const eligible = Boolean(
    locale &&
    PUBLIC_STATUSES.has(locale.launchStatus) &&
    (threshold.eligibleStates || []).includes(state) &&
    nativeKeyRatio >= Number(threshold.minimumNativeKeyRatio || 0) &&
    fallbackKeys.length <= Number(threshold.maximumFallbackKeys || 0) &&
    input.indexability !== 'noindex'
  );
  const sourceOwner = selected.sourceOwner || (input.source && input.source.owner) || input.ownerFile || 'derived locale coverage policy';
  return {
    id: `coverage:${crypto.createHash('sha1').update(`${localeId}\0${route}`).digest('hex').slice(0, 12)}`,
    route,
    locale: localeId,
    pageType: input.pageType || 'page',
    state,
    sourceOwner,
    evidence: [
      exact ? `exact override ${route}` : matchedRule ? `rule ${matchedRule.id}` : `locale default ${localeId}:${state}`,
      input.source && input.source.owner ? `route owner ${input.source.owner}` : null
    ].filter(Boolean),
    engineLocaleNeutral: Boolean(selected.engineLocaleNeutral),
    requiredUiDomains: (manifest.requiredCatalogDomains || []).slice(),
    nativeKeyRatio,
    fallbackKeys,
    indexableEligible: eligible,
    equivalentRoute: selected.equivalentRoute || (input.equivalents && input.equivalents[manifest.defaultLocale]) || null,
    fallbackRoute: selected.fallbackRoute || (state === 'unavailable' && input.declaredHreflangs && input.declaredHreflangs[manifest.defaultLocale]) || null,
    redirectTarget: selected.redirectTarget || null,
    ownerFile: sourceOwner
  };
}

function buildPageCoverage(routeGraph, options = {}) {
  const manifest = options.manifest || loadLocaleManifest();
  const policy = options.policy || loadCoveragePolicy();
  const catalogs = options.catalogs || loadCatalogs(manifest);
  const records = (routeGraph.routes || [])
    .filter((record) => record.state === 'page')
    .map((record) => classifyPage(record, policy, manifest, catalogs))
    .sort((a, b) => a.route.localeCompare(b.route));
  return { schemaVersion: '1.0.0', manifestSchemaVersion: manifest.schemaVersion, records };
}

function validatePageCoverage(registry, manifest = loadLocaleManifest(), options = {}) {
  const errors = [];
  const warnings = [];
  const routes = new Set();
  for (const record of registry && registry.records || []) {
    if (routes.has(record.route)) errors.push(issue('COVERAGE_ROUTE_DUPLICATE', record.ownerFile, 'route', `Duplicate coverage route ${record.route}.`, record));
    routes.add(record.route);
    if (!getLocale(manifest, record.locale)) errors.push(issue('COVERAGE_LOCALE_UNKNOWN', record.ownerFile, 'locale', `Unknown locale ${record.locale}.`, record));
    if (!COVERAGE_STATES.has(record.state)) errors.push(issue('COVERAGE_STATE_INVALID', record.ownerFile, 'state', `Unknown coverage state ${record.state}.`, record));
    if (!record.sourceOwner || !Array.isArray(record.evidence) || !record.evidence.length) errors.push(issue('COVERAGE_EVIDENCE_MISSING', record.ownerFile, 'evidence', `${record.route} requires a source owner and evidence.`, record));
    if (record.state === 'localized-shell' && !record.engineLocaleNeutral) errors.push(issue('LOCALIZED_SHELL_ENGINE_UNDECLARED', record.ownerFile, 'engineLocaleNeutral', `${record.route} must declare a language-neutral engine.`, record));
    if (record.state === 'english-fallback' && !record.fallbackRoute) errors.push(issue('ENGLISH_FALLBACK_ROUTE_MISSING', record.ownerFile, 'fallbackRoute', `${record.route} requires a documented fallback route.`, record));
    if (['english-fallback', 'unavailable', 'deprecated'].includes(record.state) && record.indexableEligible) errors.push(issue('COVERAGE_NON_NATIVE_INDEXABLE', record.ownerFile, 'indexableEligible', `${record.route} cannot be indexable with state ${record.state}.`, record));
    if (record.indexableEligible && record.fallbackKeys && record.fallbackKeys.length) errors.push(issue('INDEXABLE_PAGE_USES_FALLBACK_KEY', record.ownerFile, 'fallbackKeys', `${record.route} uses fallback keys: ${record.fallbackKeys.join(', ')}.`, record));
  }
  if (options.expectedRoutes) {
    for (const route of options.expectedRoutes) if (!routes.has(route)) errors.push(issue('COVERAGE_ROUTE_MISSING', 'generated coverage registry', 'route', `Missing coverage record for ${route}.`, { route }));
  }
  if (options.enforceVisibleAudits || (registry && registry.records && registry.records.length > 1000)) {
    const yorubaAudit = require('../audit-yoruba-visible-copy').buildReport();
    const byRoute = new Map((registry.records || []).map((record) => [record.route, record]));
    const blockerRoutes = new Set(yorubaAudit.routeSummaries.filter((row) => row.blockerCount > 0).map((row) => row.route));
    for (const route of blockerRoutes) {
      const record = byRoute.get(route);
      if (!record) {
        errors.push(issue('VISIBLE_COPY_BLOCKER_ROUTE_MISSING', 'scripts/audit-yoruba-visible-copy.js', 'route', `Blocker route ${route} is missing from page coverage.`, { route, locale: 'yo' }));
      } else if (!['unavailable', 'english-fallback', 'deprecated'].includes(record.state)) {
        errors.push(issue('INDEXABLE_PAGE_HAS_VISIBLE_ENGLISH', record.ownerFile, 'state', `${route} has visible-English blockers and must be quarantined or repaired before indexability.`, record));
      }
    }
    for (const record of (registry.records || []).filter((row) => row.locale === 'yo' && row.state === 'unavailable')) {
      if (!blockerRoutes.has(record.route)) warnings.push(issue('COVERAGE_QUARANTINE_STALE', record.ownerFile, 'state', `${record.route} is unavailable but the current Yoruba audit has no visible-English blocker.`, record));
    }
  }
  return result(errors, warnings);
}

function buildLocalizationReport(coverage, manifest, catalogs) {
  const summary = {
    rawPages: coverage.records.length,
    native: coverage.records.filter((record) => record.state === 'native').length,
    localizedShell: coverage.records.filter((record) => record.state === 'localized-shell').length,
    englishFallback: coverage.records.filter((record) => record.state === 'english-fallback').length,
    unavailable: coverage.records.filter((record) => record.state === 'unavailable').length,
    deprecated: coverage.records.filter((record) => record.state === 'deprecated').length,
    indexableEligible: coverage.records.filter((record) => record.indexableEligible).length,
    sitemapEligible: coverage.records.filter((record) => record.indexableEligible).length
  };
  const byLocale = {};
  for (const locale of manifest.locales) {
    const rows = coverage.records.filter((record) => record.locale === locale.id);
    const flat = catalogs[locale.id] ? flatten(catalogs[locale.id]) : {};
    byLocale[locale.id] = {
      launchStatus: locale.launchStatus,
      rawPages: rows.length,
      native: rows.filter((record) => record.state === 'native').length,
      localizedShell: rows.filter((record) => record.state === 'localized-shell').length,
      englishFallback: rows.filter((record) => record.state === 'english-fallback').length,
      unavailable: rows.filter((record) => record.state === 'unavailable').length,
      deprecated: rows.filter((record) => record.state === 'deprecated').length,
      indexableEligible: rows.filter((record) => record.indexableEligible).length,
      catalogKeys: Object.keys(flat).filter((key) => !key.startsWith('_meta.')).length
    };
  }
  const byPageType = {};
  for (const record of coverage.records) {
    const row = byPageType[record.pageType] || {
      rawPages: 0,
      native: 0,
      localizedShell: 0,
      englishFallback: 0,
      unavailable: 0,
      deprecated: 0,
      indexableEligible: 0
    };
    row.rawPages += 1;
    if (record.state === 'native') row.native += 1;
    if (record.state === 'localized-shell') row.localizedShell += 1;
    if (record.state === 'english-fallback') row.englishFallback += 1;
    if (record.state === 'unavailable') row.unavailable += 1;
    if (record.state === 'deprecated') row.deprecated += 1;
    if (record.indexableEligible) row.indexableEligible += 1;
    byPageType[record.pageType] = row;
  }
  return {
    schemaVersion: '1.0.0',
    summary,
    byLocale,
    byPageType,
    discrepancies: coverage.records
      .filter((record) => !record.indexableEligible || record.fallbackKeys.length)
      .map((record) => ({ route: record.route, locale: record.locale, state: record.state, owner: record.sourceOwner, fallbackRoute: record.fallbackRoute }))
  };
}

function normalizeDisplayString(value) {
  return String(value == null ? '' : value).normalize('NFC');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildReportMarkdown(report) {
  const lines = [
    '# Localization Coverage Report',
    '',
    'Generated from `data/registry/locale-manifest.json`, `data/registry/locale-coverage-policy.json`, shared catalogs, and the public route graph.',
    '',
    '## Summary',
    '',
    '| Metric | Count |',
    '|---|---:|',
    ...Object.entries(report.summary).map(([key, value]) => `| ${key} | ${value} |`),
    '',
    '## By locale',
    '',
    '| Locale | Launch | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable | Catalog keys |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...Object.entries(report.byLocale).map(([locale, row]) => `| ${locale} | ${row.launchStatus} | ${row.rawPages} | ${row.native} | ${row.localizedShell} | ${row.englishFallback} | ${row.unavailable} | ${row.deprecated} | ${row.indexableEligible} | ${row.catalogKeys} |`),
    '',
    '## By page type',
    '',
    '| Page type | Raw | Native | Shell | English fallback | Unavailable | Deprecated | Indexable |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...Object.entries(report.byPageType).sort(([left], [right]) => left.localeCompare(right)).map(([pageType, row]) => `| ${pageType} | ${row.rawPages} | ${row.native} | ${row.localizedShell} | ${row.englishFallback} | ${row.unavailable} | ${row.deprecated} | ${row.indexableEligible} |`),
    '',
    '## Definitions',
    '',
    '- `native`: primary content and required shared UI are authored in the declared locale.',
    '- `localizedShell`: localized UI around a declared language-neutral engine or dataset.',
    '- `englishFallback`: an explicit, labelled English destination; never a translated equivalent.',
    '- `unavailable`: no usable destination in the requested locale.',
    '- `deprecated`: a documented former localized destination.'
  ];
  return `${lines.join('\n')}\n`;
}

function writeIfChanged(file, content, write) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const changed = existing !== content;
  if (write && changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }
  return changed;
}

function generateLocalizationArtifacts(options = {}) {
  const write = Boolean(options.write);
  const manifest = options.manifest || loadLocaleManifest();
  const policy = options.policy || loadCoveragePolicy();
  const catalogs = options.catalogs || loadCatalogs(manifest);
  const manifestValidation = validateLocaleManifest(manifest);
  const catalogValidation = validateCatalogs(manifest, { catalogs });
  const sourceValidation = validateUnicodeAndRouteSources(manifest);
  const yorubaRouteValidation = validateYorubaRouteManifest();
  const preErrors = [...manifestValidation.errors, ...catalogValidation.errors, ...sourceValidation.errors, ...yorubaRouteValidation.errors];
  if (preErrors.length) return { ok: false, errors: preErrors, changedFiles: [] };
  const graph = options.routeGraph || require('./route-contract').buildRouteGraph();
  const coverage = buildPageCoverage(graph, { manifest, policy, catalogs });
  const expectedRoutes = graph.routes.filter((record) => record.state === 'page').map((record) => normalizeRoute(record.route));
  const coverageValidation = validatePageCoverage(coverage, manifest, { expectedRoutes });
  if (!coverageValidation.ok) return { ok: false, errors: coverageValidation.errors, changedFiles: [] };
  const report = buildLocalizationReport(coverage, manifest, catalogs);
  const publicLocales = manifest.locales.filter((locale) => PUBLIC_STATUSES.has(locale.launchStatus));
  const browserManifest = {
    schemaVersion: manifest.schemaVersion,
    defaultLocale: manifest.defaultLocale,
    normalization: manifest.normalization,
    requiredCatalogDomains: manifest.requiredCatalogDomains,
    locales: publicLocales
  };
  const browserCatalogs = Object.fromEntries(publicLocales.map((locale) => [locale.id, catalogs[locale.id]]));
  const yorubaRouteManifest = loadYorubaRouteManifest();
  const outputs = new Map([
    [path.join(ROOT, 'data', 'registry', 'locale-page-coverage.json'), stableJson(coverage)],
    [path.join(ROOT, 'reports', 'localization-coverage.json'), stableJson(report)],
    [path.join(ROOT, 'reports', 'localization-coverage.md'), buildReportMarkdown(report)],
    [path.join(ROOT, 'assets', 'js', 'data', 'locale-manifest.js'), `(function(root){root.AfroToolsLocaleManifest=${JSON.stringify(browserManifest)};})(typeof window!=="undefined"?window:globalThis);\n`],
    [path.join(ROOT, 'assets', 'js', 'data', 'ui-translations.js'), `(function(root){root.AfroToolsTranslations=${JSON.stringify(browserCatalogs)};})(typeof window!=="undefined"?window:globalThis);\n`],
    [path.join(ROOT, 'assets', 'js', 'data', 'yoruba-route-manifest.js'), `(function(root){root.AfroToolsYorubaRouteManifest=${JSON.stringify(yorubaRouteManifest)};})(typeof window!=="undefined"?window:globalThis);\n`]
  ]);
  const changedFiles = [];
  for (const [file, content] of outputs) if (writeIfChanged(file, content, write)) changedFiles.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  return { ok: write || changedFiles.length === 0, errors: write || changedFiles.length === 0 ? [] : [issue('LOCALIZATION_ARTIFACT_STALE', 'generated localization artifacts', 'artifacts', `Stale or missing artifacts: ${changedFiles.join(', ')}`)], changedFiles, coverage, report };
}

module.exports = {
  ROOT,
  COVERAGE_STATES,
  clone,
  flatten,
  formatIssue,
  loadLocaleManifest,
  loadCoveragePolicy,
  loadYorubaRouteManifest,
  loadCatalogs,
  loadRawCatalogs,
  getLocale,
  getPublicLocaleIds,
  validateLocaleManifest,
  validateCatalogs,
  validateYorubaRouteManifest,
  validateUnicodeAndRouteSources,
  findDuplicateJsonKeys,
  classifyPage,
  buildPageCoverage,
  validatePageCoverage,
  buildLocalizationReport,
  normalizeDisplayString,
  generateLocalizationArtifacts
};
