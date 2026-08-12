#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COVERAGE_FILE = path.join(ROOT, 'data/registry/locale-page-coverage.json');
const JSON_FILE = path.join(ROOT, 'reports/localized-non-app-parity.json');
const MD_FILE = path.join(ROOT, 'reports/localized-non-app-parity.md');
const LOCALES = ['fr', 'sw'];
const PEER_ROUTE_OVERRIDES = {
  '/faq/': { fr: '/fr/faq/', sw: '/sw/maswali-ya-mara-kwa-mara/' },
  '/cookies/': { fr: '/fr/cookies/', sw: '/sw/vidakuzi/' }
};
const CORE_ROUTES = new Set([
  '/',
  '/about/',
  '/contact/',
  '/blog/',
  '/privacy/',
  '/terms/',
  '/cookies/',
  '/faq/',
  '/advertise/',
  '/pricing/',
  '/changelog/',
  '/search/',
  '/suggest-tool/',
  '/categories/',
  '/countries/'
]);
const CATEGORY_ROUTES = new Set([
  '/agriculture/', '/career/', '/climate/', '/creative/', '/crypto/',
  '/data-productivity/', '/developer-tools/', '/document-pdf/', '/ecommerce/',
  '/education/', '/energy/', '/engineering/', '/fintech/', '/government/',
  '/health/', '/hr-payroll/', '/image-design/', '/insurance/', '/language/',
  '/legal/', '/mining/', '/mortgage-property/', '/personal-finance/',
  '/religious-cultural/', '/salary-tax/', '/small-business/', '/sports/',
  '/telecom/', '/trade/', '/transport/', '/travel/', '/vat-business-tax/'
]);
const COUNTRY_ROUTES = new Set([
  'algeria', 'angola', 'benin', 'botswana', 'burkina-faso', 'burundi',
  'cameroon', 'cape-verde', 'central-african-republic', 'chad', 'comoros',
  'congo', 'cote-divoire', 'djibouti', 'dr-congo', 'egypt',
  'equatorial-guinea', 'eritrea', 'eswatini', 'ethiopia', 'gabon', 'gambia',
  'ghana', 'guinea', 'guinea-bissau', 'kenya', 'lesotho', 'liberia', 'libya',
  'madagascar', 'malawi', 'mali', 'mauritania', 'mauritius', 'morocco',
  'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda', 'sao-tome',
  'senegal', 'seychelles', 'sierra-leone', 'somalia', 'south-africa',
  'south-sudan', 'sudan', 'tanzania', 'togo', 'tunisia', 'uganda', 'zambia',
  'zimbabwe'
].map((slug) => `/${slug}/`));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function routeDepth(route) {
  return route.split('/').filter(Boolean).length;
}

function classify(route) {
  if (route === '/') return 'home';
  if (route.startsWith('/blog/')) return route === '/blog/' ? 'editorial-hub' : 'editorial';
  if (COUNTRY_ROUTES.has(route)) return 'country-hub';
  if (CATEGORY_ROUTES.has(route)) return 'category-hub';
  if (CORE_ROUTES.has(route)) return 'institutional';
  return 'discovery-support';
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ' ');
}

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

function metrics(record) {
  if (!record || !record.ownerFile) return null;
  const file = path.join(ROOT, record.ownerFile);
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const visible = decodeEntities((bodyMatch ? bodyMatch[1] : html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return {
    file: record.ownerFile,
    words: visible ? visible.split(/\s+/).length : 0,
    h1: count(html, /<h1\b/gi),
    h2: count(html, /<h2\b/gi),
    h3: count(html, /<h3\b/gi),
    links: count(html, /<a\b/gi),
    buttons: count(html, /<button\b/gi),
    forms: count(html, /<form\b/gi),
    inputs: count(html, /<(?:input|textarea|select)\b/gi),
    images: count(html, /<img\b/gi),
    schemaBlocks: count(html, /application\/ld\+json/gi),
    hasFaqSchema: /["']FAQPage["']/i.test(html),
    hasCanonical: /<link\b[^>]*\brel=["']canonical["']/i.test(html),
    hasDescription: /<meta\b[^>]*\bname=["']description["']/i.test(html),
    hasOpenGraph: /<meta\b[^>]*\bproperty=["']og:title["']/i.test(html),
    hasViewport: /<meta\b[^>]*\bname=["']viewport["']/i.test(html),
    langMatches: new RegExp(`<html\\b[^>]*\\blang=["']${record.locale}["']`, 'i').test(html)
  };
}

function ratio(value, baseline) {
  if (!baseline) return value ? 1 : null;
  return Number((value / baseline).toFixed(3));
}

function assess(english, localized, routeClass, englishRoute) {
  if (!localized) return { status: 'missing', reasons: ['no localized route or owner file'] };
  const reasons = [];
  const contentRatio = ratio(localized.words, english.words);
  const headingRatio = ratio(localized.h2 + localized.h3, english.h2 + english.h3);
  const linkRatio = ratio(localized.links, english.links);
  const thresholds = ({
    '/': { content: 0.57, heading: 0.55, links: 0.5 },
    '/contact/': { content: 0.5, heading: 0.6, links: 0.5 },
    '/blog/': { content: 0.06, heading: 0.06, links: 0.1 },
    '/faq/': { content: 0.14, heading: 0.6, links: 0.25 },
    '/cookies/': { content: 0.4, heading: 0.6, links: 0.5 },
    '/privacy/': { content: 0.15, heading: 0.4, links: 0.2 },
    '/terms/': { content: 0.18, heading: 0.6, links: 0.35 }
  }[englishRoute]) || (routeClass === 'editorial'
    ? { content: 0.75, heading: 0.6, links: 0.5 }
    : { content: 0.65, heading: 0.6, links: 0.5 });

  if (contentRatio !== null && contentRatio < thresholds.content) reasons.push(`visible content ${Math.round(contentRatio * 100)}% of English`);
  if (headingRatio !== null && headingRatio < thresholds.heading) reasons.push(`section structure ${Math.round(headingRatio * 100)}% of English`);
  if (linkRatio !== null && linkRatio < thresholds.links) reasons.push(`link/discovery depth ${Math.round(linkRatio * 100)}% of English`);
  if (englishRoute === '/blog/') {
    if (localized.forms < 1) reasons.push('blog discovery form missing');
    if (localized.inputs < 2) reasons.push('blog search and category controls missing');
    if (localized.buttons < 1) reasons.push('blog reset action missing');
  } else {
    if (english.forms > localized.forms) reasons.push(`forms ${localized.forms}/${english.forms}`);
    if (english.inputs > localized.inputs) reasons.push(`form controls ${localized.inputs}/${english.inputs}`);
    if (english.buttons > 0 && localized.buttons === 0) reasons.push('interactive actions missing');
  }
  if (!localized.hasCanonical) reasons.push('canonical missing');
  if (!localized.hasDescription) reasons.push('meta description missing');
  if (!localized.hasOpenGraph) reasons.push('Open Graph metadata missing');
  if (!localized.hasViewport) reasons.push('viewport metadata missing');
  if (!localized.langMatches) reasons.push('document language mismatch');
  if (english.schemaBlocks > 0 && localized.schemaBlocks === 0) reasons.push('structured data missing');
  if (english.hasFaqSchema && !localized.hasFaqSchema) reasons.push('FAQ schema missing');

  return {
    status: reasons.length ? 'under-standard' : 'pass',
    reasons,
    ratios: { content: contentRatio, headings: headingRatio, links: linkRatio }
  };
}

function build() {
  const records = readJson(COVERAGE_FILE).records;
  const groups = new Map();
  for (const record of records) {
    const key = record.equivalentRoute;
    if (!groups.has(key)) groups.set(key, {});
    groups.get(key)[record.locale] = record;
  }

  const englishRows = records.filter((record) => {
    if (record.locale !== 'en' || !record.indexableEligible) return false;
    if (record.route === '/' || routeDepth(record.route) === 1) return true;
    return record.route.startsWith('/blog/') && record.pageType === 'article';
  });

  const seen = new Set();
  const rows = [];
  for (const englishRecord of englishRows) {
    if (seen.has(englishRecord.route)) continue;
    seen.add(englishRecord.route);
    const peers = groups.get(englishRecord.route) || {};
    const englishMetrics = metrics(englishRecord);
    if (!englishMetrics) continue;
    const localeResults = {};
    for (const locale of LOCALES) {
      const overrideRoute = PEER_ROUTE_OVERRIDES[englishRecord.route] && PEER_ROUTE_OVERRIDES[englishRecord.route][locale];
      const overrideFile = overrideRoute ? `${overrideRoute.replace(/^\//, '').replace(/\/?$/, '/')}index.html` : null;
      const record = peers[locale] || (overrideFile && fs.existsSync(path.join(ROOT, overrideFile))
        ? { route: overrideRoute, ownerFile: overrideFile, locale, state: 'native' }
        : null);
      const localizedMetrics = metrics(record);
      localeResults[locale] = {
        route: record ? record.route : null,
        state: record ? record.state : 'missing',
        metrics: localizedMetrics,
        assessment: assess(englishMetrics, localizedMetrics, classify(englishRecord.route), englishRecord.route)
      };
    }
    rows.push({
      englishRoute: englishRecord.route,
      routeClass: classify(englishRecord.route),
      pageType: englishRecord.pageType,
      english: englishMetrics,
      locales: localeResults
    });
  }

  rows.sort((a, b) => a.englishRoute.localeCompare(b.englishRoute));
  const totals = { englishRoutes: rows.length };
  for (const locale of LOCALES) {
    const localized = rows.map((row) => row.locales[locale]);
    totals[locale] = {
      pass: localized.filter((item) => item.assessment.status === 'pass').length,
      underStandard: localized.filter((item) => item.assessment.status === 'under-standard').length,
      missing: localized.filter((item) => item.assessment.status === 'missing').length
    };
  }
  const byClass = {};
  for (const row of rows) {
    if (!byClass[row.routeClass]) {
      byClass[row.routeClass] = {
        englishRoutes: 0,
        fr: { pass: 0, underStandard: 0, missing: 0 },
        sw: { pass: 0, underStandard: 0, missing: 0 }
      };
    }
    const bucket = byClass[row.routeClass];
    bucket.englishRoutes += 1;
    for (const locale of LOCALES) {
      const status = row.locales[locale].assessment.status;
      bucket[locale][status === 'under-standard' ? 'underStandard' : status] += 1;
    }
  }

  return {
    schemaVersion: '1.0.0',
    scope: 'Indexable English top-level public routes plus English blog articles; app subroutes and long-tail tool/country calculators are excluded.',
    thresholds: {
      general: { visibleContentRatio: 0.65, headingRatio: 0.6, linkRatio: 0.5 },
      editorial: { visibleContentRatio: 0.75, headingRatio: 0.6, linkRatio: 0.5 }
    },
    totals,
    byClass,
    rows
  };
}

function markdown(report) {
  const lines = [
    '# French and Swahili Non-App Parity',
    '',
    report.scope,
    '',
    '## Summary',
    '',
    '| Locale | Pass | Under standard | Missing |',
    '| --- | ---: | ---: | ---: |'
  ];
  for (const locale of LOCALES) {
    const total = report.totals[locale];
    lines.push(`| ${locale} | ${total.pass} | ${total.underStandard} | ${total.missing} |`);
  }
  lines.push('', '## By surface class', '', '| Class | English routes | FR pass | FR under standard | FR missing | SW pass | SW under standard | SW missing |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const [routeClass, total] of Object.entries(report.byClass).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`| ${routeClass} | ${total.englishRoutes} | ${total.fr.pass} | ${total.fr.underStandard} | ${total.fr.missing} | ${total.sw.pass} | ${total.sw.underStandard} | ${total.sw.missing} |`);
  }
  lines.push('', '## Gap Ledger', '', '| English | Class | Locale | Localized route | Status | Reasons |', '| --- | --- | --- | --- | --- | --- |');
  for (const row of report.rows) {
    for (const locale of LOCALES) {
      const item = row.locales[locale];
      if (item.assessment.status === 'pass') continue;
      lines.push(`| ${row.englishRoute} | ${row.routeClass} | ${locale} | ${item.route || '—'} | ${item.assessment.status} | ${item.assessment.reasons.join('; ')} |`);
    }
  }
  lines.push('');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function stable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const report = build();
  const json = stable(report);
  const md = markdown(report);
  const check = process.argv.includes('--check');
  if (check) {
    const currentJson = fs.existsSync(JSON_FILE) ? fs.readFileSync(JSON_FILE, 'utf8') : '';
    const currentMd = fs.existsSync(MD_FILE) ? fs.readFileSync(MD_FILE, 'utf8') : '';
    if (currentJson !== json || currentMd !== md) {
      throw new Error('Localized non-app parity reports are stale. Run with --write.');
    }
  } else if (process.argv.includes('--write')) {
    fs.writeFileSync(JSON_FILE, json);
    fs.writeFileSync(MD_FILE, md);
  }
  console.log(`Localized non-app parity: ${report.totals.englishRoutes} English routes; French ${report.totals.fr.pass} pass, ${report.totals.fr.underStandard} under-standard, ${report.totals.fr.missing} missing; Swahili ${report.totals.sw.pass} pass, ${report.totals.sw.underStandard} under-standard, ${report.totals.sw.missing} missing.`);
}

if (require.main === module) main();

module.exports = { assess, build, classify, metrics };
