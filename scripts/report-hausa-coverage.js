#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GRAPH_PATH = path.join(ROOT, 'data/registry/route-graph.json');
const JSON_PATH = path.join(ROOT, 'reports/hausa-localization-coverage.json');
const MD_PATH = path.join(ROOT, 'reports/hausa-localization-coverage.md');

function stable(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function markdown(report) {
  const lines = [
    '# Hausa Localization Coverage', '',
    'Generated from the canonical route graph by `node scripts/report-hausa-coverage.js --write`.', '',
    `- Public Hausa routes: ${report.summary.total}`,
    `- Native: ${report.summary.native || 0}`,
    `- Localized shells: ${report.summary['localized-shell'] || 0}`,
    `- Explicit English fallbacks: ${report.summary['english-fallback'] || 0}`,
    `- Indexable: ${report.summary.indexable}`,
    `- Sitemap members: ${report.summary.sitemapIncluded}`, '',
    '| Route | State | Indexable | Sitemap | Equivalent or fallback | Owner |',
    '|---|---|---:|---:|---|---|'
  ];
  report.records.forEach((record) => lines.push(`| ${record.route} | ${record.state} | ${record.indexable ? 'yes' : 'no'} | ${record.sitemapIncluded ? 'yes' : 'no'} | ${record.equivalentRoute || record.fallbackRoute || ''} | ${record.ownerFile || ''} |`));
  return `${lines.join('\n')}\n`;
}

function buildReport() {
  const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
  const records = graph.routes.filter((route) => route.state === 'page' && route.locale === 'ha').map((route) => ({
    route: route.route,
    state: route.localeCoverage && route.localeCoverage.state || 'unavailable',
    indexable: route.indexability === 'indexable',
    sitemapIncluded: Boolean(route.sitemap && route.sitemap.included),
    equivalentRoute: route.localeCoverage && route.localeCoverage.equivalentRoute || null,
    fallbackRoute: route.localeCoverage && route.localeCoverage.fallbackRoute || null,
    advertisedHreflangs: Object.keys(route.hreflangs || {}),
    ownerFile: route.localeCoverage && route.localeCoverage.ownerFile || route.source && route.source.owner || null
  })).sort((a, b) => a.route.localeCompare(b.route));
  const summary = { total: records.length, indexable: records.filter((record) => record.indexable).length, sitemapIncluded: records.filter((record) => record.sitemapIncluded).length };
  records.forEach((record) => { summary[record.state] = (summary[record.state] || 0) + 1; });
  return { schemaVersion: 1, routeGraphSchemaVersion: graph.schemaVersion, summary, records };
}

function run(options = {}) {
  const report = buildReport();
  const expected = [[JSON_PATH, stable(report)], [MD_PATH, markdown(report)]];
  const stale = expected.filter(([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content);
  if (options.write) stale.forEach(([file, content]) => fs.writeFileSync(file, content, 'utf8'));
  else if (stale.length) throw new Error(`Hausa coverage report is stale: ${stale.map(([file]) => path.relative(ROOT, file)).join(', ')}`);
  const falseFallback = report.records.filter((record) => record.state === 'english-fallback' && (record.indexable || record.sitemapIncluded || record.advertisedHreflangs.length));
  if (falseFallback.length) throw new Error(`Hausa English fallbacks are advertised as native: ${falseFallback.map((record) => record.route).join(', ')}`);
  console.log(`Hausa coverage report: ${report.summary.total} routes; ${report.summary.native || 0} native, ${report.summary['localized-shell'] || 0} localized shell, ${report.summary['english-fallback'] || 0} explicit English fallback.`);
  return { report, stale: stale.map(([file]) => path.relative(ROOT, file)) };
}

if (require.main === module) {
  try { run({ write: process.argv.includes('--write') }); } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { run, buildReport, markdown };
