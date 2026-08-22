#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const coverageApi = require('./report-hausa-coverage');
const visibleAudit = require('./audit-hausa-visible-copy');
const registryApi = require('./lib/canonical-registry');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT_PATH = path.join(ROOT, 'data/localization/ha-launch-readiness.json');
const LOCALE_PATH = path.join(ROOT, 'data/registry/locale-manifest.json');
const JSON_PATH = path.join(ROOT, 'reports/hausa-launch-readiness.json');
const MD_PATH = path.join(ROOT, 'reports/hausa-launch-readiness.md');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function stable(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function routeToFile(route) {
  const clean = new URL(route, 'https://afrotools.com').pathname.replace(/^\/+|\/+$/g, '');
  return path.join(ROOT, clean, 'index.html');
}
function htmlMatch(html, regex) { const match = html.match(regex); return match ? match[1].trim() : ''; }
function routeMetadata(route, html, equivalentRoute) {
  const canonical = htmlMatch(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || htmlMatch(html, /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  const title = htmlMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = htmlMatch(html, /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const h1 = htmlMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
  const robots = htmlMatch(html, /<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const coverage = htmlMatch(html, /<meta\b[^>]*name=["']afrotools-locale-coverage["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const alternates = Object.fromEntries(Array.from(html.matchAll(/<link\b[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi)).map((match) => [match[1], match[2]]));
  const gaps = [];
  if (!/<html\b[^>]*\blang=["']ha["']/i.test(html)) gaps.push('html-lang');
  if (!/<meta\b[^>]*name=["']content-language["'][^>]*content=["']ha["']/i.test(html)) gaps.push('content-language');
  if (!title) gaps.push('title');
  if (!description) gaps.push('description');
  if (!h1) gaps.push('h1');
  if (canonical !== `https://afrotools.com${route}`) gaps.push('self-canonical');
  if (/noindex/i.test(robots)) gaps.push('noindex');
  if (coverage === 'english-fallback') gaps.push('fallback-marker');
  if (alternates.ha !== `https://afrotools.com${route}`) gaps.push('ha-hreflang');
  if (!alternates.en) gaps.push('en-hreflang');
  if (!/"inLanguage"\s*:\s*"ha"/i.test(html)) gaps.push('schema-language');
  const interactive = /<(?:form|input|select|textarea|button)\b/i.test(html);
  const feedback = /\baria-live\s*=|<(?:output)\b|\b(?:result|error|status)[-_A-Za-z0-9]*\b/i.test(html);
  if (!interactive) gaps.push('interactive-journey');
  if (!feedback) gaps.push('localized-feedback-state');
  let reciprocal = false;
  if (equivalentRoute && fs.existsSync(routeToFile(equivalentRoute))) {
    const source = fs.readFileSync(routeToFile(equivalentRoute), 'utf8');
    reciprocal = new RegExp(`hreflang=["']ha["'][^>]*href=["']https://afrotools\\.com${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(source);
  }
  if (equivalentRoute && !reciprocal) gaps.push('reciprocal-en-hreflang');
  return { title, description, h1, canonical, coverage, alternates, interactive, feedback, reciprocal, gaps };
}

function sharedShellChecks() {
  const checks = [
    ['navbar-search', 'assets/js/components/navbar.js', 'Bincika kayan aiki'],
    ['navbar-empty', 'assets/js/components/navbar.js', 'Ba a sami ƙasar da ta dace ba'],
    ['navbar-tools', 'assets/js/components/navbar.js', 'Kayan aikin Hausa'],
    ['footer-pdf', 'assets/js/components/footer.js', 'Takardu da PDF'],
    ['footer-language', 'assets/js/components/footer.js', 'Harshe da Fassara'],
    ['footer-health', 'assets/js/components/footer.js', 'Lafiya'],
    ['footer-agriculture', 'assets/js/components/footer.js', 'Noma'],
    ['directory-fallback', 'ha/kayan-aiki/index.html', 'Shafi na Turanci'],
    ['directory-native', 'ha/kayan-aiki/index.html', 'Akwai da Hausa']
  ];
  return checks.map(([id, relative, text]) => ({ id, file: relative, text, pass: fs.readFileSync(path.join(ROOT, relative), 'utf8').includes(text) }));
}

function buildReport() {
  const contract = readJson(CONTRACT_PATH);
  const coverage = coverageApi.buildReport();
  const visible = visibleAudit.buildReport();
  const locale = readJson(LOCALE_PATH).locales.find((entry) => entry.id === 'ha');
  const routeMap = new Map(coverage.records.map((record) => [record.route, record]));
  const visibleMap = new Map(visible.routeSummaries.map((record) => [record.route, record]));
  const core25 = contract.core25.map((entry) => {
    const record = routeMap.get(entry.route) || null;
    const file = routeToFile(entry.route);
    const exists = fs.existsSync(file) && registryApi.routeExists(entry.route);
    const metadata = exists ? routeMetadata(entry.route, fs.readFileSync(file, 'utf8'), record && record.equivalentRoute) : { gaps: ['broken-route'] };
    const visibleRecord = visibleMap.get(entry.route);
    const blockers = visibleRecord ? visibleRecord.blockerCount : null;
    const issues = [...metadata.gaps];
    if (!record) issues.push('missing-route-graph-record');
    else {
      if (!contract.launchGates.allowCoreStates.includes(record.state)) issues.push(`coverage-state:${record.state}`);
      if (!record.indexable) issues.push('not-indexable');
      if (!record.sitemapIncluded) issues.push('not-in-sitemap');
    }
    if (blockers === null) issues.push('missing-visible-copy-record');
    else if (blockers > contract.launchGates.maximumCoreVisibleEnglishBlockers) issues.push(`visible-english:${blockers}`);
    return { ...entry, exists, state: record && record.state, indexable: record && record.indexable, sitemapIncluded: record && record.sitemapIncluded, visibleEnglishBlockers: blockers, metadata, issues };
  });
  const shell = sharedShellChecks();
  const fallbackViolations = coverage.records.filter((record) => record.state === 'english-fallback' && (record.indexable || record.sitemapIncluded || record.advertisedHreflangs.length));
  const brokenCore = core25.filter((entry) => !entry.exists);
  const brokenRoutes = coverage.records.filter((record) => !fs.existsSync(routeToFile(record.route)) || !registryApi.routeExists(record.route));
  const metadataGapNames = new Set(['html-lang', 'content-language', 'title', 'description', 'h1', 'self-canonical', 'noindex', 'fallback-marker', 'ha-hreflang', 'en-hreflang', 'schema-language', 'reciprocal-en-hreflang']);
  const localizedMetadataGaps = coverage.records.filter((record) => record.indexable).map((record) => {
    const file = routeToFile(record.route);
    const gaps = fs.existsSync(file)
      ? routeMetadata(record.route, fs.readFileSync(file, 'utf8'), record.equivalentRoute).gaps.filter((gap) => metadataGapNames.has(gap))
      : ['broken-route'];
    return { route: record.route, gaps };
  }).filter((entry) => entry.gaps.length);
  const browserEvidence = contract.validationEvidence && contract.validationEvidence.browserMobile;
  const gates = {
    core25Exact: core25.length === contract.launchGates.coreRouteCount,
    core25Complete: core25.every((entry) => entry.issues.length === 0),
    coreVisibleEnglishClean: core25.every((entry) => entry.visibleEnglishBlockers === 0),
    sharedNavigationComplete: shell.every((entry) => entry.pass),
    noBrokenCoreRoutes: brokenCore.length === 0,
    noBrokenHausaRoutes: brokenRoutes.length === 0,
    localizedMetadataClean: localizedMetadataGaps.length === 0,
    indexableRoutesLocalized: coverage.records.filter((entry) => entry.indexable).every((entry) => entry.state === 'native' || entry.state === 'localized-shell'),
    fallbacksHonest: fallbackViolations.length === 0,
    languageCountryIndependent: locale.formatting.currency.defaultCurrency === null,
    browserMobileValidated: !contract.launchGates.requireBrowserMobile || Boolean(browserEvidence && browserEvidence.passed && browserEvidence.testsFailed === 0)
  };
  const launchStatusConsistent = locale.launchStatus !== 'launched' || Object.values(gates).every(Boolean);
  gates.launchStatusConsistent = launchStatusConsistent;
  const blockers = [];
  Object.entries(gates).filter(([, pass]) => !pass).forEach(([gate]) => blockers.push({ gate }));
  core25.filter((entry) => entry.issues.length).forEach((entry) => blockers.push({ gate: 'core25Complete', route: entry.route, issues: entry.issues }));
  shell.filter((entry) => !entry.pass).forEach((entry) => blockers.push({ gate: 'sharedNavigationComplete', file: entry.file, missing: entry.text }));
  const eligibleToLaunch = Object.entries(gates).filter(([key]) => key !== 'launchStatusConsistent').every(([, pass]) => pass);
  return {
    schemaVersion: 1,
    baseline: contract.baseline,
    summary: coverage.summary,
    launchStatus: locale.launchStatus,
    eligibleToLaunch,
    launchReady: eligibleToLaunch && locale.launchStatus === 'launched',
    gates,
    core25,
    sharedShell: shell,
    visibleCopy: visible.counts,
    fallbackViolations,
    brokenRoutes,
    localizedMetadataGaps,
    validationEvidence: contract.validationEvidence || {},
    blockers
  };
}

function markdown(report) {
  const lines = [
    '# Hausa Launch Readiness', '',
    `- Launch-ready: ${report.launchReady ? 'yes' : 'no'}`,
    `- Eligible to change launch status: ${report.eligibleToLaunch ? 'yes' : 'no'}`,
    `- Manifest launchStatus: ${report.launchStatus}`,
    `- Routes: ${report.summary.total}; native ${report.summary.native || 0}; localized shell ${report.summary['localized-shell'] || 0}; English fallback ${report.summary['english-fallback'] || 0}`,
    `- Indexable/sitemap: ${report.summary.indexable}/${report.summary.sitemapIncluded}`,
    `- Visible English blockers across Hausa: ${report.visibleCopy.blockers}`, '',
    '## Gates', '',
    ...Object.entries(report.gates).map(([gate, pass]) => `- ${pass ? 'PASS' : 'FAIL'}: ${gate}`), '',
    '## Core 25', '',
    '| Route | Journey | State | Indexable | Sitemap | Issues |',
    '|---|---|---|---:|---:|---|',
    ...report.core25.map((entry) => `| ${entry.route} | ${entry.journey} | ${entry.state || 'missing'} | ${entry.indexable ? 'yes' : 'no'} | ${entry.sitemapIncluded ? 'yes' : 'no'} | ${entry.issues.join(', ')} |`), '',
    '## Remaining Blockers', '',
    ...(report.blockers.length ? report.blockers.map((entry) => `- ${entry.gate}${entry.route ? `: ${entry.route}` : ''}${entry.issues ? ` — ${entry.issues.join(', ')}` : ''}`) : ['- None.']), ''
  ];
  return lines.join('\n');
}

function run(options = {}) {
  const report = buildReport();
  const expected = [[JSON_PATH, stable(report)], [MD_PATH, markdown(report)]];
  const stale = expected.filter(([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content);
  if (options.write) stale.forEach(([file, content]) => fs.writeFileSync(file, content, 'utf8'));
  else if (stale.length) throw new Error(`Hausa launch-readiness report is stale: ${stale.map(([file]) => path.relative(ROOT, file)).join(', ')}`);
  console.log(`Hausa launch gate: ${report.launchReady ? 'LAUNCH_READY' : report.eligibleToLaunch ? 'ELIGIBLE_PENDING_STATUS' : 'NOT_READY'}; Core 25 issues: ${report.core25.filter((entry) => entry.issues.length).length}.`);
  return report;
}

if (require.main === module) {
  try { run({ write: process.argv.includes('--write') }); } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { buildReport, markdown, run };
