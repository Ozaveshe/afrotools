'use strict';

const fs = require('fs');
const path = require('path');
const { buildFrenchAiRouteMap, normalizeRoute } = require('./lib/french-ai-route-map.js');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json'),
  'utf8'
));
const REGISTRY = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js'), 'utf8');
const HUB = fs.readFileSync(path.join(ROOT, 'fr', 'fintech', 'index.html'), 'utf8');
const ENGLISH_HUB = fs.readFileSync(path.join(ROOT, 'fintech', 'index.html'), 'utf8');

function physicalFile(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function rowForRoute(route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = REGISTRY.match(new RegExp(`\\{[^{}]*href:\\s*['"]${escaped}['"][^{}]*\\}`));
  return match && match[0];
}

function alternate(html, locale, route) {
  return html.includes(`rel="alternate" hreflang="${locale}" href="https://afrotools.com${route}"`);
}

function alternateMap(html) {
  const map = new Map();
  for (const match of html.matchAll(/<link\b[^>]*\brel=["']alternate["'][^>]*>/gi)) {
    const tag = match[0];
    const locale = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (locale && href) map.set(locale[1], href[1]);
  }
  return map;
}

function verifyCompleteLocaleGroup(english, french, frenchRoute, label) {
  const englishAlternates = alternateMap(english);
  const frenchAlternates = alternateMap(french);
  const expectedFrenchUrl = `https://afrotools.com${frenchRoute}`;
  const missingOrChanged = Array.from(englishAlternates.entries()).filter(
    ([locale, href]) => frenchAlternates.get(locale) !== href
  );
  const unexpected = Array.from(frenchAlternates.keys()).filter((locale) => !englishAlternates.has(locale));
  if (missingOrChanged.length || unexpected.length || frenchAlternates.get('fr') !== expectedFrenchUrl) {
    throw new Error(`${label}: complete locale alternates differ from the English owner ${JSON.stringify({
      missingOrChanged,
      unexpected,
      expectedFrenchUrl
    })}`);
  }
  for (const [locale, href] of englishAlternates) {
    if (locale === 'en' || locale === 'fr' || locale === 'x-default') continue;
    const localizedRoute = new URL(href).pathname;
    const localizedFile = physicalFile(localizedRoute);
    if (!fs.existsSync(localizedFile)) {
      throw new Error(`${label}: ${locale} alternate is not physical at ${localizedRoute}`);
    }
    const localized = fs.readFileSync(localizedFile, 'utf8');
    if (alternateMap(localized).get('fr') !== expectedFrenchUrl) {
      throw new Error(`${label}: ${locale} route ${localizedRoute} does not reciprocate ${frenchRoute}`);
    }
  }
}

function main() {
  if (MANIFEST.expectedEnglishFreeApps !== 31 || MANIFEST.routes.length !== 31) {
    throw new Error(`denominator must remain 31, found ${MANIFEST.routes.length}`);
  }
  const hubLinks = [...HUB.matchAll(/<a class="tool" href="([^"]+)"/g)].map((match) => normalizeRoute(match[1]));
  if (hubLinks.length !== 31 || new Set(hubLinks).size !== 31) {
    throw new Error(`French hub must expose 31 unique cards, found ${hubLinks.length}/${new Set(hubLinks).size}`);
  }
  const hubRegistry = rowForRoute('/fr/fintech/');
  if (!hubRegistry || !/sourceId:\s*['"]fintech['"]/.test(hubRegistry)) {
    throw new Error('French Fintech hub registry ownership is missing');
  }
  if (!alternate(HUB, 'en', '/fintech/') || !alternate(HUB, 'fr', '/fr/fintech/') ||
      !alternate(HUB, 'x-default', '/fintech/') ||
      !alternate(ENGLISH_HUB, 'fr', '/fr/fintech/')) {
    throw new Error('Fintech hub reciprocal hreflang is incomplete');
  }
  verifyCompleteLocaleGroup(ENGLISH_HUB, HUB, '/fr/fintech/', 'fintech-hub');

  for (const record of MANIFEST.routes) {
    const frenchFile = physicalFile(record.frenchRoute);
    const englishFile = physicalFile(record.englishRoute);
    if (!fs.existsSync(frenchFile) || !fs.existsSync(englishFile)) {
      throw new Error(`${record.englishId}: physical route is missing`);
    }
    const french = fs.readFileSync(frenchFile, 'utf8');
    const english = fs.readFileSync(englishFile, 'utf8');
    const registryRow = rowForRoute(record.frenchRoute);
    if (!registryRow || !new RegExp(`sourceId:\\s*['"]${record.englishId}['"]`).test(registryRow)) {
      throw new Error(`${record.englishId}: French registry sourceId ownership mismatch`);
    }
    if (!hubLinks.includes(normalizeRoute(record.frenchRoute))) {
      throw new Error(`${record.englishId}: French hub link is missing`);
    }
    if (!alternate(french, 'en', record.englishRoute) ||
        !alternate(french, 'fr', record.frenchRoute) ||
        !alternate(french, 'x-default', record.englishRoute) ||
        !alternate(english, 'fr', record.frenchRoute)) {
      throw new Error(`${record.englishId}: reciprocal hreflang is incomplete`);
    }
    verifyCompleteLocaleGroup(english, french, record.frenchRoute, record.englishId);
    if (!french.includes(`<link rel="canonical" href="https://afrotools.com${record.frenchRoute}">`) ||
        !/"inLanguage"\s*:\s*"fr"/.test(french) ||
        !/Sources et limites|Source et limites|Sources? et fraîcheur|Sources, fraîcheur et limites/.test(french) ||
        !/Dernière revue(?: méthodologique)?\s*:\s*juillet 2026/.test(french)) {
      throw new Error(`${record.englishId}: canonical/schema/source/freshness contract is incomplete`);
    }
    if (!fs.existsSync(path.join(ROOT, record.artwork)) || /fallback/i.test(record.artwork)) {
      throw new Error(`${record.englishId}: artwork is missing or generic`);
    }
  }

  const aiMap = buildFrenchAiRouteMap();
  for (const record of MANIFEST.routes) {
    if (aiMap.routes[normalizeRoute(record.englishRoute)] !== normalizeRoute(record.frenchRoute)) {
      throw new Error(`${record.englishId}: French AI route ownership mismatch`);
    }
  }

  console.log(JSON.stringify({
    accepted: true,
    denominator: 31,
    hubLinks: 31,
    registryRows: 31,
    reciprocalHreflang: 31,
    completeExistingLocaleGroups: 31,
    canonicalSchemaSourceFreshness: 31,
    aiRoutes: 31,
    genericArtwork: 0,
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { main, rowForRoute };
