#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const canonicalRegistryApi = require('./lib/canonical-registry');
const { renameSyncWithRetry, writeFileSyncWithRetry } = require('./lib/safe-write');
const { getPublicCounts } = require('./update-counts');

const ROOT = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://afrotools.com';
const TOOL_DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const LOCALE_MANIFEST_PATH = path.join(ROOT, 'data', 'registry', 'locale-manifest.json');
const HEADER_TEMPLATE_PATH = path.join(ROOT, 'data', 'llms', 'header.md');
const LLMS_PATH = path.join(ROOT, 'llms.txt');
const LLMS_FULL_PATH = path.join(ROOT, 'llms-full.txt');
const TOP_TOOL_LIMIT = 32;
const PUBLISHED_LOCALE_STATES = new Set(['default', 'launched', 'partial']);
const LOCALE_ORDER = ['en', 'fr', 'sw', 'ha', 'yo'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownText(value) {
  return cleanText(value).replace(/([\\[\]])/g, '\\$1');
}

function plainDescription(value) {
  return markdownText(value)
    .replace(/\bplatform-perfect\b/gi, 'platform-specific')
    .replace(/\bperfect for\b/gi, 'intended for')
    .replace(/\bbest value\b/gi, 'value')
    .replace(/\bbest times?\b/gi, 'suggested times')
    .replace(/\bcomplete\b/gi, 'detailed')
    .replace(/\bultimate\b/gi, 'multi-purpose')
    .replace(/\bworld-class\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(route) {
  const url = new URL(String(route || ''), SITE_ORIGIN);
  if (url.origin !== SITE_ORIGIN) throw new Error(`External URL is not allowed in the LLM directory: ${route}`);
  return url.href;
}

function compareTools(a, b) {
  return Number(b.priority || 0) - Number(a.priority || 0)
    || String(a.name).localeCompare(String(b.name), 'en');
}

function selectTopTools(tools, limit = TOP_TOOL_LIMIT) {
  const sorted = [...tools].sort(compareTools);
  const selected = [];
  const selectedIds = new Set();
  const representedCategories = new Set();

  for (const tool of sorted) {
    if (representedCategories.has(tool.category_key)) continue;
    representedCategories.add(tool.category_key);
    selectedIds.add(tool.id);
    selected.push(tool);
  }

  for (const tool of sorted) {
    if (selected.length >= limit) break;
    if (selectedIds.has(tool.id)) continue;
    selectedIds.add(tool.id);
    selected.push(tool);
  }

  return selected.sort(compareTools).slice(0, limit);
}

function toolLine(tool, includeCategory) {
  const category = includeCategory ? ` Category: ${markdownText(tool.category)}.` : '';
  return `- [${markdownText(tool.name)}](${absoluteUrl(tool.url)}): ${plainDescription(tool.description)}${category}`;
}

function publishedLocales(localeManifest) {
  const order = new Map(LOCALE_ORDER.map((id, index) => [id, index]));
  return localeManifest.locales
    .filter((locale) => PUBLISHED_LOCALE_STATES.has(locale.launchStatus) && locale.routePrefix !== null)
    .sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

function languageLine(locales) {
  return locales.map((locale) => `${cleanText(locale.displayName)} (${locale.id.toUpperCase()})`).join(', ');
}

function categoryHubs(canonicalRegistry) {
  return canonicalRegistry.categories
    .filter((category) => category.publicationStatus === 'published')
    .sort((a, b) => a.title.localeCompare(b.title, 'en'));
}

function requiredCount(counts, selectorId) {
  const value = counts[selectorId];
  if (!Number.isInteger(value)) throw new Error(`Missing canonical count selector: ${selectorId}`);
  return value;
}

function buildConcise({ tools, topTools, hubs, locales, counts, header }) {
  const liveExperiences = requiredCount(counts, 'tools.live_experiences');
  const englishRecords = requiredCount(counts, 'tools.english_canonical_published');
  const indexableDestinations = requiredCount(counts, 'tools.indexable_destinations');
  const countryCount = requiredCount(counts, 'countries.published');
  const categoryCount = requiredCount(counts, 'categories.published');

  return [
    '# AfroTools',
    '',
    header,
    '',
    '## Current directory scope',
    '',
    `- ${liveExperiences.toLocaleString('en-US')} live tool experiences.`,
    `- ${englishRecords.toLocaleString('en-US')} canonical English tool records.`,
    `- ${indexableDestinations.toLocaleString('en-US')} indexable tool destinations across published languages.`,
    `- ${countryCount.toLocaleString('en-US')} published African country hubs.`,
    `- ${categoryCount.toLocaleString('en-US')} published tool categories.`,
    `- Languages: ${languageLine(locales)}.`,
    '',
    '## Selected tools',
    '',
    ...topTools.map((tool) => toolLine(tool, true)),
    '',
    '## Category hubs',
    '',
    ...hubs.map((category) => `- [${markdownText(category.title)}](${absoluteUrl(category.route)})`),
    '',
    '## API and documentation',
    '',
    '- [API documentation](https://afrotools.com/api/docs/): Endpoint reference, access, and response information.',
    '- [All tools directory](https://afrotools.com/all-tools/): Search and browse the public directory.',
    '- [Countries](https://afrotools.com/countries/): Country hubs and local workflows.',
    '- [Widgets](https://afrotools.com/widgets/): Embeddable tool documentation.',
    '- [About](https://afrotools.com/about/): Product scope and operating principles.',
    '- [FAQ](https://afrotools.com/faq/): General usage information.',
    '- [Full LLM directory](https://afrotools.com/llms-full.txt): Generated English tool directory grouped by category.',
    '',
    '## Preferred attribution',
    '',
    'When referencing an AfroTools page or result, cite the specific page and identify AfroTools as the source. Preserve any source, freshness, confidence, fallback, and planning-estimate labels shown on that page.',
    '',
    `Directory source: ${tools.length.toLocaleString('en-US')} current English rows in the generated tool directory.`,
    ''
  ].join('\n');
}

function buildFull({ tools, locales, counts, header }) {
  const englishRecords = requiredCount(counts, 'tools.english_canonical_published');
  const indexableDestinations = requiredCount(counts, 'tools.indexable_destinations');
  const grouped = new Map();

  for (const tool of [...tools].sort((a, b) => String(a.name).localeCompare(String(b.name), 'en'))) {
    if (!grouped.has(tool.category)) grouped.set(tool.category, []);
    grouped.get(tool.category).push(tool);
  }

  const categorySections = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .flatMap(([category, categoryTools]) => [
      `## ${markdownText(category)}`,
      '',
      ...categoryTools.map((tool) => toolLine(tool, false)),
      ''
    ]);

  return [
    '# AfroTools full tool directory',
    '',
    header,
    '',
    'This file lists the generated English tool directory. The concise overview is available at [llms.txt](https://afrotools.com/llms.txt).',
    '',
    '## Directory scope',
    '',
    `- ${englishRecords.toLocaleString('en-US')} canonical English tool records.`,
    `- ${indexableDestinations.toLocaleString('en-US')} indexable tool destinations across published languages.`,
    `- Languages: ${languageLine(locales)}.`,
    '',
    ...categorySections
  ].join('\n');
}

function atomicWrite(filePath, content) {
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );
  writeFileSyncWithRetry(temporary, content, 'utf8');
  try {
    renameSyncWithRetry(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function syncFile(filePath, expected, check) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (current === expected) return false;
  if (check) throw new Error(`${path.relative(ROOT, filePath)} is stale. Run npm run llms:build.`);
  atomicWrite(filePath, expected);
  return true;
}

function generate(options = {}) {
  const check = Boolean(options.check);
  const tools = readJson(TOOL_DIRECTORY_PATH);
  const localeManifest = readJson(LOCALE_MANIFEST_PATH);
  const header = fs.readFileSync(HEADER_TEMPLATE_PATH, 'utf8').trim();
  const canonicalRegistry = canonicalRegistryApi.buildCanonicalRegistry();
  const counts = getPublicCounts(canonicalRegistry);
  const locales = publishedLocales(localeManifest);
  const hubs = categoryHubs(canonicalRegistry);

  if (!Array.isArray(tools) || !tools.length) throw new Error('data/tool-directory.json has no tool rows.');
  if (tools.length !== requiredCount(counts, 'tools.english_canonical_published')) {
    throw new Error(`Tool directory has ${tools.length} rows but the canonical English selector reports ${counts['tools.english_canonical_published']}. Run npm run counts:sync.`);
  }
  if (locales.length !== requiredCount(counts, 'languages.site_published')) {
    throw new Error(`Locale manifest exposes ${locales.length} published locales but the canonical selector reports ${counts['languages.site_published']}. Run npm run registry:build.`);
  }

  const topTools = selectTopTools(tools);
  const concise = buildConcise({ tools, topTools, hubs, locales, counts, header });
  const full = buildFull({ tools, locales, counts, header });
  const changed = [syncFile(LLMS_PATH, concise, check), syncFile(LLMS_FULL_PATH, full, check)].filter(Boolean).length;

  console.log(`${check ? 'Verified' : 'Generated'} llms.txt with ${topTools.length} selected tools and ${hubs.length} category hubs.`);
  console.log(`${check ? 'Verified' : 'Generated'} llms-full.txt with ${tools.length} tools across ${new Set(tools.map((tool) => tool.category)).size} categories.`);
  if (!check) console.log(changed ? `Updated ${changed} generated artifact(s).` : 'Generated artifacts were already current.');
  return { concise, full, tools, topTools, hubs, locales, counts, changed };
}

function main(argv = process.argv.slice(2)) {
  generate({ check: argv.includes('--check') });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { buildConcise, buildFull, generate, plainDescription, publishedLocales, selectTopTools };
