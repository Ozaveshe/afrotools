#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { buildRouteGraph } = require('./lib/route-contract');
const { decodeHtml } = require('./audit-search-snippets');
const ROOT = path.resolve(__dirname, '..');
const REQUIRED = ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card'];
const EXPLICIT = ['twitter:title', 'twitter:description', 'twitter:image'];
function attribute(tag, name) {
  const match = tag.match(new RegExp('\\b' + name + '\\s*=\\s*(["\u0027])([\\s\\S]*?)\\1', 'i'));
  return match ? decodeHtml(match[2]) : '';
}
function metadata(html) {
  const result = {};
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const name = (attribute(tag, 'property') || attribute(tag, 'name')).toLowerCase();
    if (name && !Object.hasOwn(result, name)) result[name] = attribute(tag, 'content');
  }
  return result;
}
function audit(graph = buildRouteGraph(), read = file => fs.readFileSync(path.join(ROOT, file), 'utf8')) {
  const counts = Object.fromEntries(REQUIRED.map(key => [key, 0]));
  const explicitTwitterOmissions = Object.fromEntries(EXPLICIT.map(key => [key, 0]));
  const rows = [];
  const pages = graph.routes.filter(r => r.state === 'page' && r.indexability === 'indexable');
  for (const page of pages) {
    const tags = metadata(read(page.source.file));
    const missing = REQUIRED.filter(key => !tags[key]);
    for (const key of missing) counts[key]++;
    for (const key of EXPLICIT) if (!tags[key]) explicitTwitterOmissions[key]++;
    if (missing.length) rows.push({ route: page.route, locale: page.locale, sourceFile: page.source.file, missing });
  }
  return { schemaVersion: 1, indexablePages: pages.length, missingRequired: counts,
    explicitTwitterOmissions, pagesWithRequiredOmissions: rows.length,
    evidenceBoundary: 'Static presence only. Explicit Twitter omissions are reported separately; image fetch/rendering, metadata accuracy and social crawler behavior need their own acceptance.', rows };
}
function main() {
  const report = audit();
  const flag = process.argv.indexOf('--output');
  if (flag !== -1) {
    const file = process.argv[flag + 1];
    if (!file) throw new Error('--output requires a path');
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify({ indexablePages: report.indexablePages, missingRequired: report.missingRequired,
    pagesWithRequiredOmissions: report.pagesWithRequiredOmissions, explicitTwitterOmissions: report.explicitTwitterOmissions }, null, 2));
  if (process.argv.includes('--check') && report.pagesWithRequiredOmissions) process.exitCode = 1;
}
if (require.main === module) main();
module.exports = { audit, metadata };
