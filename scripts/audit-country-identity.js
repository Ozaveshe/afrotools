#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const COUNTRIES_PATH = path.join(ROOT, 'data/registry/countries.json');
const REPORT_JSON_PATH = path.join(ROOT, 'reports/country-identity-report.json');
const REPORT_MD_PATH = path.join(ROOT, 'reports/country-identity-report.md');
const EXCLUDED_DIRS = new Set(['.git', '.claude', '.codex', 'node_modules', 'dist', 'audit-results', 'reports', 'artifacts', 'test-results']);

function slugify(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function decodeText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&ocirc;/gi, 'ô').replace(/&rsquo;/gi, '’').replace(/\s+/g, ' ').trim();
}

function field(html, expression) {
  const match = html.match(expression);
  return match ? decodeText(match[1]) : '';
}

function meta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const nameMatch = tag.match(/\bname\s*=\s*(["'])(.*?)\1/i);
    if (!nameMatch || nameMatch[2].toLowerCase() !== name.toLowerCase()) continue;
    const contentMatch = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
    return contentMatch ? decodeText(contentMatch[2]) : '';
  }
  return '';
}

function routeForFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel.replace(/\.html$/i, '')}`;
}

function loadAgricultureData(relativeScript) {
  const absolute = path.join(ROOT, relativeScript.replace(/^\/+/, ''));
  if (!fs.existsSync(absolute)) return null;
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  try {
    vm.runInContext(fs.readFileSync(absolute, 'utf8'), sandbox, { filename: relativeScript });
  } catch (_) {
    return null;
  }
  return sandbox.window.AfroTools && sandbox.window.AfroTools.countryData || null;
}

function createCountryLookup(countries) {
  const aliases = new Map();
  countries.forEach((country) => {
    const values = new Set([country.routeSlug, slugify(country.title), ...Object.values(country.displayNames || {}).map(slugify)]);
    values.forEach((value) => { if (value && !aliases.has(value)) aliases.set(value, country); });
  });
  const explicit = {
    'cabo-verde': 'CV', 'cape-verde': 'CV', 'congo-brazzaville': 'CG', 'dr-congo': 'CD',
    'cote-d-ivoire': 'CI', 'cote-divoire': 'CI', 'sao-tome-and-principe': 'ST', 'sao-tome': 'ST'
  };
  Object.entries(explicit).forEach(([alias, id]) => aliases.set(alias, countries.find((country) => country.id === id)));
  return aliases;
}

function namesFor(country) {
  const abbreviations = { CF: ['CAR'], CD: ['DRC', 'RD Congo'], ZA: ['RSA'], CI: ['Ivory Coast', 'Ivorian'] };
  return [...new Set([country.title, ...(abbreviations[country.id] || []), ...Object.values(country.displayNames || {})].filter(Boolean))];
}

function mentionsCountry(text, country) {
  const normalized = slugify(text).replace(/-/g, ' ');
  return namesFor(country).some((name) => normalized.includes(slugify(name).replace(/-/g, ' ')));
}

function structuredIdentity(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const records = [];
  blocks.forEach((match) => {
    try {
      const parsed = JSON.parse(match[1]);
      const values = Array.isArray(parsed) ? parsed : [parsed];
      values.forEach((value) => {
        if (value && ['WebApplication', 'SoftwareApplication', 'WebPage'].includes(value['@type'])) records.push(value);
      });
    } catch (_) {
      // Content-integrity validation owns malformed JSON-LD; this audit records only parsed identity data.
    }
  });
  return records;
}

function breadcrumbCountry(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of blocks) {
    try {
      const parsed = JSON.parse(match[1]);
      if (!parsed || parsed['@type'] !== 'BreadcrumbList' || !Array.isArray(parsed.itemListElement)) continue;
      const countryItem = parsed.itemListElement.find((item) => item && item.position === 4);
      if (countryItem) return String(countryItem.name || '');
    } catch (_) {
      // Content-integrity validation owns malformed JSON-LD.
    }
  }
  return '';
}

function scanHtml(html, context) {
  const { country, route, file } = context;
  const errors = [];
  const title = field(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = meta(html, 'description');
  const nativeH1 = field(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const iframeMatch = html.match(/<iframe[^>]+title=(["'])(.*?)\1[^>]*>/i);
  const iframeTitle = iframeMatch ? decodeText(iframeMatch[2]) : '';
  const h1 = nativeH1 || iframeTitle;
  const countryId = meta(html, 'afrotools-country-id');
  const sourceJurisdiction = meta(html, 'afrotools-source-jurisdiction');
  const formulaJurisdiction = meta(html, 'afrotools-formula-jurisdiction');
  const currency = meta(html, 'afrotools-currency');
  const dataScript = (html.match(/<script[^>]+src=["']([^"']*\/data\/agriculture\/([a-z]{2})-agri-data\.js[^"']*)["']/i) || []);
  const data = dataScript[1] ? loadAgricultureData(dataScript[1].split(/[?#]/)[0]) : null;
  const structured = structuredIdentity(html);
  const isCropYieldPage = /^\/agriculture\/crop-yield\/[^/]+$/i.test(route);

  if (!mentionsCountry(title, country)) errors.push({ code: 'COUNTRY_TITLE_MISMATCH', field: 'title', actual: title, expected: country.title });
  if (!mentionsCountry(h1, country)) errors.push({ code: 'COUNTRY_HEADING_MISMATCH', field: 'h1', actual: h1, expected: country.title });
  if (description && !mentionsCountry(description, country)) errors.push({ code: 'COUNTRY_DESCRIPTION_MISMATCH', field: 'description', actual: description, expected: country.title });

  const identityMetaPresent = Boolean(countryId || sourceJurisdiction || formulaJurisdiction || currency);
  if (identityMetaPresent) {
    if (countryId !== country.id) errors.push({ code: 'COUNTRY_ID_MISMATCH', field: 'afrotools-country-id', actual: countryId, expected: country.id });
    if (sourceJurisdiction !== country.sourceJurisdiction) errors.push({ code: 'COUNTRY_SOURCE_JURISDICTION_MISMATCH', field: 'afrotools-source-jurisdiction', actual: sourceJurisdiction, expected: country.sourceJurisdiction });
    if (formulaJurisdiction && formulaJurisdiction !== country.id) errors.push({ code: 'COUNTRY_FORMULA_JURISDICTION_MISMATCH', field: 'afrotools-formula-jurisdiction', actual: formulaJurisdiction, expected: country.id });
    if (currency && currency !== country.currency) errors.push({ code: 'COUNTRY_CURRENCY_MISMATCH', field: 'afrotools-currency', actual: currency, expected: country.currency });
  }

  if (data) {
    if (data.countryCode !== country.id) errors.push({ code: 'COUNTRY_DATA_JURISDICTION_MISMATCH', field: dataScript[1], actual: data.countryCode, expected: country.id });
    if (data.currency !== country.currency) errors.push({ code: 'COUNTRY_DATA_CURRENCY_MISMATCH', field: dataScript[1], actual: data.currency, expected: country.currency });
    if (!countryId) errors.push({ code: 'COUNTRY_ID_META_MISSING', field: 'afrotools-country-id', actual: null, expected: country.id });
    if (!sourceJurisdiction) errors.push({ code: 'COUNTRY_SOURCE_META_MISSING', field: 'afrotools-source-jurisdiction', actual: null, expected: country.sourceJurisdiction });
    if (!formulaJurisdiction) errors.push({ code: 'COUNTRY_FORMULA_META_MISSING', field: 'afrotools-formula-jurisdiction', actual: null, expected: country.id });
    if (!currency) errors.push({ code: 'COUNTRY_CURRENCY_META_MISSING', field: 'afrotools-currency', actual: null, expected: country.currency });
  }

  if (isCropYieldPage) {
    const visibleBreadcrumb = field(html, /<span\s+aria-current=["']page["']>([\s\S]*?)<\/span>/i);
    const structuredBreadcrumb = breadcrumbCountry(html);
    const visibleCurrency = field(html, /<span\s+id=["']rCurrency["']>([^<]*)<\/span>/i);
    if (!mentionsCountry(visibleBreadcrumb, country)) errors.push({ code: 'COUNTRY_VISIBLE_BREADCRUMB_MISMATCH', field: 'aria-current=page', actual: visibleBreadcrumb, expected: country.title });
    if (!mentionsCountry(structuredBreadcrumb, country)) errors.push({ code: 'COUNTRY_STRUCTURED_BREADCRUMB_MISMATCH', field: 'BreadcrumbList.position=4', actual: structuredBreadcrumb, expected: country.title });
    if (visibleCurrency !== country.currency) errors.push({ code: 'COUNTRY_VISIBLE_CURRENCY_MISMATCH', field: '#rCurrency', actual: visibleCurrency, expected: country.currency });
  }

  structured.forEach((record, index) => {
    const label = `${record.name || ''} ${record.description || ''}`;
    const spatialId = record.spatialCoverage && (record.spatialCoverage.identifier || record.spatialCoverage.name);
    if (!mentionsCountry(label, country) && spatialId !== country.id && !mentionsCountry(spatialId || '', country)) {
      errors.push({ code: 'COUNTRY_STRUCTURED_DATA_MISMATCH', field: `jsonld[${index}]`, actual: label.trim(), expected: country.title });
    }
  });

  return {
    file: path.relative(ROOT, file).replace(/\\/g, '/'), route, family: path.relative(ROOT, path.dirname(file)).replace(/\\/g, '/'),
    countryId: country.id, country: country.title, title, h1, description,
    identity: {
      countryId: countryId || null,
      sourceJurisdiction: sourceJurisdiction || null,
      formulaJurisdiction: formulaJurisdiction || null,
      currency: currency || null,
      dataScript: dataScript[1] ? dataScript[1].split(/[?#]/)[0] : null
    },
    errors
  };
}

function collectCountryPages(countries) {
  const aliases = createCountryLookup(countries);
  const pages = [];
  function walk(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) return;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(absolute);
      if (!entry.name.endsWith('.html') || entry.name === 'index.html') return;
      const country = aliases.get(entry.name.slice(0, -5));
      if (country) pages.push({ file: absolute, country });
    });
  }
  walk(ROOT);
  return pages.sort((left, right) => {
    const leftPath = path.relative(ROOT, left.file).replace(/\\/g, '/');
    const rightPath = path.relative(ROOT, right.file).replace(/\\/g, '/');
    return leftPath.localeCompare(rightPath, 'en');
  });
}

function markdown(report) {
  const lines = [
    '# Country Identity Report', '',
    'Generated by `node scripts/audit-country-identity.js --write`.', '',
    `- Country-specific routes scanned: ${report.summary.scanned}`,
    `- Routes with mismatches: ${report.summary.mismatched}`,
    `- Record-level errors: ${report.summary.errors}`, '',
    '## Mismatches', ''
  ];
  if (!report.mismatches.length) lines.push('No country identity mismatches found.', '');
  report.mismatches.forEach((record) => {
    lines.push(`### ${record.route} (${record.countryId})`, '', `Source: \`${record.file}\``, '');
    record.errors.forEach((error) => lines.push(`- **${error.code}** \`${error.field}\`: expected \`${error.expected}\`; found \`${error.actual == null ? '(missing)' : error.actual}\``));
    lines.push('');
  });
  return lines.join('\n');
}

function preserveGeneratedAt(report) {
  if (!fs.existsSync(REPORT_JSON_PATH)) return report;
  try {
    const previous = JSON.parse(fs.readFileSync(REPORT_JSON_PATH, 'utf8'));
    const before = { ...previous, generatedAt: null };
    const after = { ...report, generatedAt: null };
    if (JSON.stringify(before) === JSON.stringify(after)) {
      return { ...report, generatedAt: previous.generatedAt };
    }
  } catch (_error) {
    // Invalid prior reports are replaced below.
  }
  return report;
}

function run(options = {}) {
  const countries = JSON.parse(fs.readFileSync(COUNTRIES_PATH, 'utf8'));
  const records = collectCountryPages(countries).map(({ file, country }) => scanHtml(fs.readFileSync(file, 'utf8'), { file, route: routeForFile(file), country }));
  const mismatches = records.filter((record) => record.errors.length);
  let report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    summary: { scanned: records.length, matched: records.length - mismatches.length, mismatched: mismatches.length, errors: mismatches.reduce((sum, record) => sum + record.errors.length, 0) },
    mismatches,
    records
  };
  report = preserveGeneratedAt(report);
  if (options.write) {
    fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
    fs.writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    fs.writeFileSync(REPORT_MD_PATH, markdown(report), 'utf8');
  }
  return report;
}

if (require.main === module) {
  const report = run({ write: process.argv.includes('--write') });
  console.log(`Country identity audit scanned ${report.summary.scanned} route(s): ${report.summary.mismatched} mismatch(es), ${report.summary.errors} record-level error(s).`);
  report.mismatches.slice(0, 50).forEach((record) => record.errors.forEach((error) => console.error(`[${error.code}] ${record.file} field=${error.field} expected=${error.expected} actual=${error.actual == null ? '(missing)' : error.actual}`)));
  if (report.mismatches.length) process.exitCode = 1;
}

module.exports = { run, scanHtml, createCountryLookup, collectCountryPages };
