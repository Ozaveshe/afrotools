#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const PRODUCTION_ORIGIN = 'https://afrotools.com';
const TARGET_CATEGORIES = Object.freeze([
  'document-pdf',
  'image-design',
  'developer',
  'education',
  'health',
  'language',
]);
const BASE_PER_CATEGORY = 3;
const SAMPLE_SIZE = 20;

function loadRegistry(registryPath = REGISTRY_PATH) {
  const source = fs.readFileSync(registryPath, 'utf8');
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(`${source}\nglobalThis.__AFROTOOLS_REGISTRY__ = AFRO_TOOLS;`, context, {
    filename: registryPath,
  });
  return Array.from(context.__AFROTOOLS_REGISTRY__);
}

function normalizeRoute(route) {
  const pathname = new URL(String(route || ''), PRODUCTION_ORIGIN).pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function routeToSourceFile(route, repoRoot = REPO_ROOT) {
  const pathname = normalizeRoute(route);
  return path.join(repoRoot, ...pathname.split('/').filter(Boolean), 'index.html');
}

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? match[1].trim() : '';
}

function canonicalRouteFromHtml(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const canonical = linkTags.find((tag) =>
    attributeValue(tag, 'rel').split(/\s+/).includes('canonical'));
  if (!canonical) return '';
  const href = attributeValue(canonical, 'href');
  return href ? normalizeRoute(href) : '';
}

function hasNoindex(html) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  return metaTags.some((tag) =>
    attributeValue(tag, 'name').toLowerCase() === 'robots'
      && attributeValue(tag, 'content').toLowerCase().split(/[\s,]+/).includes('noindex'));
}

function isHubRow(row) {
  const id = String(row.id || '').toLowerCase();
  const name = String(row.name || '').toLowerCase();
  const route = String(row.href || '').toLowerCase();
  return id === 'document-pdf'
    || id === 'dev-tools'
    || id.endsWith('-hub')
    || route.includes('/education-hub/')
    || /\b(category hub|tools hub)\b/.test(name);
}

function inspectCandidate(row, repoRoot = REPO_ROOT) {
  if (!TARGET_CATEGORIES.includes(row.category)) return { eligible: false, reason: 'category' };
  if (row.lang && row.lang !== 'en') return { eligible: false, reason: 'localized' };
  if (row.sourceId) return { eligible: false, reason: 'alias-or-localized' };
  if (!['live', 'new'].includes(row.status)) return { eligible: false, reason: 'status' };
  if (!/^\/tools\/[^/]+\/$/.test(String(row.href || ''))) {
    return { eligible: false, reason: 'non-tool-route' };
  }
  if (isHubRow(row)) return { eligible: false, reason: 'hub' };

  const route = normalizeRoute(row.href);
  const sourceFile = routeToSourceFile(route, repoRoot);
  if (!fs.existsSync(sourceFile)) return { eligible: false, reason: 'missing-route' };

  const html = fs.readFileSync(sourceFile, 'utf8');
  if (hasNoindex(html)) return { eligible: false, reason: 'noindex' };
  if (canonicalRouteFromHtml(html) !== route) {
    return { eligible: false, reason: 'noncanonical-route' };
  }

  return {
    eligible: true,
    candidate: {
      category: row.category,
      id: String(row.id),
      name: String(row.name),
      description: String(row.desc || ''),
      route,
      sourceFile,
      productionUrl: `${PRODUCTION_ORIGIN}${route}`,
    },
  };
}

function buildEligiblePools(registry = loadRegistry(), repoRoot = REPO_ROOT) {
  const pools = Object.fromEntries(TARGET_CATEGORIES.map((category) => [category, []]));
  const seenRoutes = new Set();

  for (const row of registry) {
    const result = inspectCandidate(row, repoRoot);
    if (!result.eligible || seenRoutes.has(result.candidate.route)) continue;
    seenRoutes.add(result.candidate.route);
    pools[result.candidate.category].push(result.candidate);
  }

  for (const category of TARGET_CATEGORIES) {
    pools[category].sort((left, right) =>
      left.route.localeCompare(right.route) || left.id.localeCompare(right.id));
  }
  return pools;
}

function hashSeed(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashSeed(seed);
  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, seed) {
  const output = items.slice();
  const random = seededRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [output[index], output[other]] = [output[other], output[index]];
  }
  return output;
}

function smokeAction(candidate) {
  const metadata = `${candidate.name} ${candidate.description}`.toLowerCase();
  if (candidate.category === 'document-pdf') {
    if (/\b(merge|split|reorder|page)\b/.test(metadata)) {
      return 'Load two synthetic PDFs, complete the page operation, and verify the downloaded PDF opens.';
    }
    if (/\b(cv|cover letter|invoice|receipt|minutes|business plan)\b/.test(metadata)) {
      return 'Enter synthetic details, create the document, and verify its local export opens correctly.';
    }
    return 'Load a synthetic PDF, run the primary action, and verify the local output or download.';
  }
  if (candidate.category === 'image-design') {
    if (/\b(color|colour|qr|favicon)\b/.test(metadata)) {
      return 'Create a small synthetic asset, change one setting, and verify the exported result.';
    }
    return 'Upload a synthetic image, apply one visible change, and verify the exported image.';
  }
  if (candidate.category === 'developer') {
    return 'Enter a small synthetic fixture, run the primary transform or validation, and verify copy/reset.';
  }
  if (candidate.category === 'education') {
    return 'Enter synthetic study data, complete the main workflow, and verify the result plus reset or export.';
  }
  if (candidate.category === 'health') {
    return 'Use non-identifying synthetic inputs, verify the result and safety boundary, then clear the data.';
  }
  return 'Use a short non-sensitive phrase, verify the result or consent path, then clear the text.';
}

function sampleApps({ seed, pools = buildEligiblePools() }) {
  if (seed === undefined || seed === null || String(seed).trim() === '') {
    throw new Error('An explicit non-empty seed is required.');
  }

  for (const category of TARGET_CATEGORIES) {
    if (!pools[category] || pools[category].length < BASE_PER_CATEGORY) {
      throw new Error(`${category} needs at least ${BASE_PER_CATEGORY} eligible canonical apps.`);
    }
  }

  const remainder = SAMPLE_SIZE - (TARGET_CATEGORIES.length * BASE_PER_CATEGORY);
  const remainderEligible = TARGET_CATEGORIES.filter(
    (category) => pools[category].length > BASE_PER_CATEGORY,
  );
  if (remainderEligible.length < remainder) {
    throw new Error('Not enough categories can receive the deterministic remainder.');
  }
  const remainderCategories = new Set(
    shuffled(remainderEligible, `${seed}:remainder`).slice(0, remainder),
  );

  const sample = [];
  for (const category of TARGET_CATEGORIES) {
    const count = BASE_PER_CATEGORY + (remainderCategories.has(category) ? 1 : 0);
    const choices = shuffled(pools[category], `${seed}:category:${category}`).slice(0, count);
    sample.push(...choices.map((candidate) => ({
      category: candidate.category,
      appName: candidate.name,
      productionUrl: candidate.productionUrl,
      smokeAction: smokeAction(candidate),
      route: candidate.route,
      id: candidate.id,
    })));
  }

  if (new Set(sample.map((item) => item.route)).size !== SAMPLE_SIZE) {
    throw new Error('Sampler produced duplicate routes.');
  }
  return sample;
}

function formatMarkdown(sample, seed) {
  const lines = [
    '# Day 4-5 post-deploy user-test sample',
    '',
    `Seed: \`${seed}\``,
    '',
    '> Sampling is not readiness acceptance. Run this only after the six categories pass final review and the accepted build is deployed.',
    '',
    '| Category | App | Production URL | Suggested smoke action |',
    '|---|---|---|---|',
  ];
  for (const item of sample) {
    const escapeCell = (value) => String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
    lines.push(`| ${escapeCell(item.category)} | ${escapeCell(item.appName)} | ${item.productionUrl} | ${escapeCell(item.smokeAction)} |`);
  }
  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  const seedIndex = argv.indexOf('--seed');
  const seed = seedIndex >= 0 ? argv[seedIndex + 1] : '';
  const json = argv.includes('--json');
  if (!seed || seed.startsWith('--')) {
    throw new Error('Usage: node scripts/sample-day45-user-tests.js --seed <explicit-seed> [--json]');
  }
  return { seed, json };
}

function main(argv = process.argv.slice(2), output = process.stdout) {
  const options = parseArgs(argv);
  const sample = sampleApps({ seed: options.seed });
  output.write(options.json
    ? `${JSON.stringify({ seed: options.seed, notice: 'Post-deploy sampling is not readiness acceptance.', sample }, null, 2)}\n`
    : formatMarkdown(sample, options.seed));
  return sample;
}

module.exports = {
  BASE_PER_CATEGORY,
  SAMPLE_SIZE,
  TARGET_CATEGORIES,
  buildEligiblePools,
  canonicalRouteFromHtml,
  formatMarkdown,
  hasNoindex,
  inspectCandidate,
  loadRegistry,
  main,
  normalizeRoute,
  parseArgs,
  routeToSourceFile,
  sampleApps,
  smokeAction,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
