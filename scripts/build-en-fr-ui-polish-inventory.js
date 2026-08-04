#!/usr/bin/env node
'use strict';

// Broad candidate inventory; the narrow fail-closed accent guard remains
// scripts/audit-ui-accent-patterns.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}

const ROOT = path.resolve(valueAfter('--root') || path.join(__dirname, '..'));
const SHOULD_WRITE = args.includes('--write');
const SHOULD_CHECK = args.includes('--check');
const JSON_STDOUT = args.includes('--json');
const OUTPUT = path.resolve(
  valueAfter('--output') || path.join(ROOT, 'reports', 'en-fr-ui-polish-candidates.json')
);

const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');

const PATTERNS = {
  accentRail: [
    /border-(?:left|top|inline-start|block-start)\s*:\s*(?:[2-9]|\d{2,})px\s+(?:solid|double)\b/gi,
    /border-(?:left|top|inline-start|block-start)-width\s*:\s*(?:[2-9]|\d{2,})px\b/gi
  ],
  gradient: [/(?:linear|radial|conic)-gradient\s*\(/gi],
  glowShadow: [
    /box-shadow\s*:[^;}]{0,220}(?:rgba?\s*\(|#[0-9a-f]{3,8}\b)/gi,
    /filter\s*:\s*drop-shadow\s*\(/gi
  ],
  uppercase: [/text-transform\s*:\s*uppercase\b/gi],
  cardClass: [/\bclass\s*=\s*["'][^"']*\b[\w-]*card[\w-]*\b[^"']*["']/gi],
  badgeClass: [/\bclass\s*=\s*["'][^"']*\b[\w-]*(?:badge|pill|chip)[\w-]*\b[^"']*["']/gi],
  genericCopy: [
    /\b(?:unlock|supercharge|all-in-one|seamless|powerful|effortless|game-changing|next-level|revolutioni[sz]e|everything you need|action-ready|smart insights?|at your fingertips)\b/gi,
    /\b(?:tout-en-un|sans effort|révolutionn\w*|puissant\w*|boostez|intelligent\w*|prêt(?:e)? à l['’]emploi|tout ce dont vous avez besoin|à portée de main)\b/gi
  ],
  decorativeEmoji: [/\p{Extended_Pictographic}/gu]
};

const CSS_PATTERN_NAMES = new Set(['accentRail', 'gradient', 'glowShadow', 'uppercase']);
const MARKUP_PATTERN_NAMES = new Set(['cardClass', 'badgeClass']);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function normalizeRoute(rawRoute) {
  if (!rawRoute || typeof rawRoute !== 'string') return null;
  let route = rawRoute.trim();
  if (!route || /^(?:https?:|mailto:|tel:|javascript:|#)/i.test(route)) return null;
  route = route.split(/[?#]/)[0].replace(/\\/g, '/');
  if (!route.startsWith('/')) route = `/${route}`;
  route = route.replace(/\/index\.html$/i, '/').replace(/\/{2,}/g, '/');
  return route;
}

function routeFileCandidates(route) {
  const relative = route.replace(/^\/+|\/+$/g, '');
  if (!relative) return ['index.html'];
  if (/\.html?$/i.test(relative)) return [relative];
  return [
    path.join(relative, 'index.html'),
    `${relative}.html`,
    relative
  ];
}

function resolveRouteFile(route) {
  for (const candidate of routeFileCandidates(route)) {
    const absolute = path.join(ROOT, candidate);
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
      return path.resolve(absolute);
    }
  }
  return null;
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Missing registry: ${REGISTRY_PATH}`);
  }
  const context = {
    console: { log() {}, warn() {}, error() {} }
  };
  vm.createContext(context);
  vm.runInContext(read(REGISTRY_PATH), context, { filename: REGISTRY_PATH });
  if (!Array.isArray(context.AFRO_TOOLS)) {
    throw new Error('tool-registry.js did not expose AFRO_TOOLS');
  }
  return context.AFRO_TOOLS;
}

function localeForRow(row) {
  return row.lang || 'en';
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function addFile(map, file, locale, pageType, route) {
  if (!file) return;
  const key = path.resolve(file).toLowerCase();
  if (!map.has(key)) {
    map.set(key, {
      file: path.resolve(file),
      locale,
      pageTypes: new Set(),
      routes: new Set()
    });
  }
  const record = map.get(key);
  record.pageTypes.add(pageType);
  if (route) record.routes.add(route);
}

function topLevelIndexFiles(baseDirectory, locale) {
  if (!fs.existsSync(baseDirectory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(baseDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const indexFile = path.join(baseDirectory, entry.name, 'index.html');
    if (fs.existsSync(indexFile)) {
      files.push({
        file: indexFile,
        locale,
        route: locale === 'fr' ? `/fr/${entry.name}/` : `/${entry.name}/`
      });
    }
  }
  return files;
}

function collectFiles(registry) {
  const files = new Map();
  const missingRoutes = [];

  const homepage = path.join(ROOT, 'index.html');
  if (fs.existsSync(homepage)) {
    addFile(files, homepage, 'en', 'top-level-hub-candidate', '/');
  }

  for (const row of registry) {
    const locale = localeForRow(row);
    if (locale !== 'en' && locale !== 'fr') continue;
    const route = normalizeRoute(row.href);
    if (!route) continue;
    const file = resolveRouteFile(route);
    if (!file) {
      missingRoutes.push({ locale, id: row.id || null, route });
      continue;
    }
    addFile(files, file, locale, 'registry-app', route);
  }

  for (const candidate of topLevelIndexFiles(ROOT, 'en')) {
    addFile(files, candidate.file, candidate.locale, 'top-level-hub-candidate', candidate.route);
  }
  for (const candidate of topLevelIndexFiles(path.join(ROOT, 'fr'), 'fr')) {
    addFile(files, candidate.file, candidate.locale, 'top-level-hub-candidate', candidate.route);
  }

  return {
    files: [...files.values()],
    missingRoutes
  };
}

function countMatches(source, regex) {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

function htmlSurfaces(html) {
  const inlineCss = [];
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    inlineCss.push(match[1]);
  }
  for (const match of html.matchAll(/\bstyle\s*=\s*["']([^"']*)["']/gi)) {
    inlineCss.push(match[1]);
  }

  const markup = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ');
  const visibleText = markup
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  return {
    css: inlineCss.join('\n'),
    markup,
    visibleText
  };
}

function sourceHints(html, pageFile) {
  const hints = new Set();
  const patterns = [
    /<link\b[^>]*\bhref\s*=\s*["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi,
    /<script\b[^>]*\bsrc\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = match[1].split(/[?#]/)[0];
      if (!value || /^(?:https?:)?\/\//i.test(value)) continue;
      if (value.startsWith('/')) {
        hints.add(value);
        continue;
      }
      const absolute = path.resolve(path.dirname(pageFile), value);
      const relativeSource = path.relative(ROOT, absolute).replace(/\\/g, '/');
      if (!relativeSource.startsWith('../') && relativeSource !== '..') {
        hints.add(`/${relativeSource}`);
      }
    }
  }
  return [...hints].sort();
}

function declaredOwners(html) {
  const owners = new Set();
  const patterns = [
    /<meta\b[^>]*\bname\s*=\s*["']afrotools-source-owner["'][^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*>/gi,
    /<meta\b[^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*\bname\s*=\s*["']afrotools-source-owner["'][^>]*>/gi,
    /\bdata-source-owner\s*=\s*["']([^"']+)["']/gi
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      owners.add(match[1].trim());
    }
  }
  return [...owners].sort();
}

function scanFile(record) {
  const html = read(record.file);
  const surfaces = htmlSurfaces(html);
  const signals = {};
  for (const [name, regexes] of Object.entries(PATTERNS)) {
    const source = CSS_PATTERN_NAMES.has(name)
      ? surfaces.css
      : MARKUP_PATTERN_NAMES.has(name)
        ? surfaces.markup
        : surfaces.visibleText;
    signals[name] = regexes.reduce((total, regex) => total + countMatches(source, regex), 0);
  }
  const totalSignals = Object.values(signals).reduce((sum, count) => sum + count, 0);
  return {
    locale: record.locale,
    file: relative(record.file),
    routes: [...record.routes].sort(),
    pageTypes: [...record.pageTypes].sort(),
    signals,
    totalSignals,
    declaredOwners: declaredOwners(html),
    sourceHints: sourceHints(html, record.file)
  };
}

function resolveLocalSource(source) {
  if (!source || !source.startsWith('/') || source.startsWith('//')) return null;
  const file = path.resolve(ROOT, source.replace(/^\/+/, ''));
  const rootPrefix = `${ROOT.toLowerCase()}${path.sep}`;
  if (file.toLowerCase() !== ROOT.toLowerCase() && !file.toLowerCase().startsWith(rootPrefix)) return null;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return file;
}

function canonicalLocalSource(source) {
  let canonicalSource = source;
  let file = resolveLocalSource(canonicalSource);
  const unminified = source.replace(/\.min\.(css|js)$/i, '.$1');
  if (unminified !== source) {
    const unminifiedFile = resolveLocalSource(unminified);
    if (unminifiedFile) {
      canonicalSource = unminified;
      file = unminifiedFile;
    }
  }
  if (!file) return null;
  return {
    source: canonicalSource,
    file,
    generated: /^\/assets\/js\/bundles\//i.test(canonicalSource)
  };
}

function scanSource(file) {
  const source = read(file);
  const signals = {};
  for (const [name, regexes] of Object.entries(PATTERNS)) {
    signals[name] = regexes.reduce((total, regex) => total + countMatches(source, regex), 0);
  }
  return {
    signals,
    totalSignals: Object.values(signals).reduce((sum, count) => sum + count, 0)
  };
}

function summarizeOwners(records) {
  const declared = new Map();
  const shared = new Map();
  const generated = new Map();

  for (const record of records) {
    for (const owner of record.declaredOwners) {
      if (!declared.has(owner)) {
        declared.set(owner, {
          owner,
          files: new Set(),
          enFiles: new Set(),
          frFiles: new Set()
        });
      }
      const entry = declared.get(owner);
      entry.files.add(record.file);
      entry[`${record.locale}Files`].add(record.file);
    }

    for (const source of record.sourceHints) {
      const localSource = canonicalLocalSource(source);
      if (!localSource) continue;
      const target = localSource.generated ? generated : shared;
      if (!target.has(localSource.source)) {
        target.set(localSource.source, {
          source: localSource.source,
          file: localSource.file,
          files: new Set(),
          enFiles: new Set(),
          frFiles: new Set()
        });
      }
      const entry = target.get(localSource.source);
      entry.files.add(record.file);
      entry[`${record.locale}Files`].add(record.file);
    }
  }

  const declaredOwnersList = [...declared.values()]
    .map((entry) => ({
      owner: entry.owner,
      files: entry.files.size,
      enFiles: entry.enFiles.size,
      frFiles: entry.frFiles.size,
      sampleFiles: [...entry.files].slice(0, 8)
    }))
    .sort((a, b) => b.files - a.files || a.owner.localeCompare(b.owner));

  const sharedSourceCandidates = [...shared.values()]
    .map((entry) => {
      const sourceScan = scanSource(entry.file);
      return {
        source: entry.source,
        referencedByFiles: entry.files.size,
        enFiles: entry.enFiles.size,
        frFiles: entry.frFiles.size,
        signals: sourceScan.signals,
        totalSignals: sourceScan.totalSignals,
        sampleFiles: [...entry.files].slice(0, 8)
      };
    })
    .filter((entry) => entry.totalSignals > 0)
    .sort((a, b) => (
      (b.referencedByFiles * b.totalSignals) - (a.referencedByFiles * a.totalSignals)
      || b.referencedByFiles - a.referencedByFiles
      || a.source.localeCompare(b.source)
    ));

  const generatedSourceReferences = [...generated.values()]
    .map((entry) => ({
      source: entry.source,
      referencedByFiles: entry.files.size,
      enFiles: entry.enFiles.size,
      frFiles: entry.frFiles.size
    }))
    .sort((a, b) => b.referencedByFiles - a.referencedByFiles || a.source.localeCompare(b.source));

  return {
    candidateFiles: records.length,
    filesWithDeclaredOwner: records.filter((record) => record.declaredOwners.length > 0).length,
    filesWithoutDeclaredOwner: records.filter((record) => record.declaredOwners.length === 0).length,
    declaredOwners: declaredOwnersList,
    sharedSourceCandidates,
    generatedSourceReferences
  };
}

function summarize(records, locale) {
  const localeRecords = records.filter((record) => record.locale === locale);
  const patternSummary = {};
  for (const name of Object.keys(PATTERNS)) {
    const affected = localeRecords.filter((record) => record.signals[name] > 0);
    patternSummary[name] = {
      occurrences: affected.reduce((sum, record) => sum + record.signals[name], 0),
      files: affected.length
    };
  }
  return {
    physicalFilesScanned: localeRecords.length,
    registryAppFiles: localeRecords.filter((record) => record.pageTypes.includes('registry-app')).length,
    topLevelHubCandidates: localeRecords.filter((record) => record.pageTypes.includes('top-level-hub-candidate')).length,
    candidateFiles: localeRecords.filter((record) => record.totalSignals > 0).length,
    patterns: patternSummary
  };
}

function main() {
  const registry = loadRegistry();
  const collected = collectFiles(registry);
  const scanned = collected.files.map(scanFile);
  const candidates = scanned
    .filter((record) => record.totalSignals > 0)
    .sort((a, b) => b.totalSignals - a.totalSignals || a.file.localeCompare(b.file));

  const report = {
    schemaVersion: 1,
    root: '.',
    scope: {
      locales: ['en', 'fr'],
      registryRows: registry.filter((row) => ['en', 'fr'].includes(localeForRow(row))).length,
      note: 'Signals are review candidates, not automatic violations. Classify semantic state before editing.'
    },
    summary: {
      en: summarize(scanned, 'en'),
      fr: summarize(scanned, 'fr'),
      unresolvedRegistryRoutes: collected.missingRoutes.length
    },
    ownerSummary: summarizeOwners(candidates),
    unresolvedRegistryRoutes: collected.missingRoutes,
    candidates
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (SHOULD_CHECK) {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== serialized) {
      process.stderr.write(`UI polish inventory is stale. Run: node scripts/build-en-fr-ui-polish-inventory.js --write\n`);
      process.exitCode = 1;
      return;
    }
  } else if (SHOULD_WRITE) {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, serialized, 'utf8');
  }

  if (JSON_STDOUT) {
    process.stdout.write(serialized);
    return;
  }

  const printable = {
    output: SHOULD_WRITE ? OUTPUT : null,
    summary: report.summary,
    ownership: {
      candidateFiles: report.ownerSummary.candidateFiles,
      filesWithDeclaredOwner: report.ownerSummary.filesWithDeclaredOwner,
      filesWithoutDeclaredOwner: report.ownerSummary.filesWithoutDeclaredOwner,
      declaredOwners: report.ownerSummary.declaredOwners.length,
      sharedSourceCandidates: report.ownerSummary.sharedSourceCandidates.length,
      generatedSourceReferences: report.ownerSummary.generatedSourceReferences.length,
      topSharedSources: report.ownerSummary.sharedSourceCandidates.slice(0, 12).map((entry) => ({
        source: entry.source,
        referencedByFiles: entry.referencedByFiles,
        totalSignals: entry.totalSignals
      }))
    }
  };
  process.stdout.write(`${JSON.stringify(printable, null, 2)}\n`);
}

main();
