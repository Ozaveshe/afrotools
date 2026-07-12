#!/usr/bin/env node
'use strict';

/** Build the lightweight /search/ index from canonical published tools. */

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const registryApi = require('./lib/canonical-registry');
const localizationApi = require('./lib/localization-platform');

const ROOT = path.join(__dirname, '..');
const SEARCH_INDEX_PATH = path.join(ROOT, 'data/search-index.json');

const CATEGORY_ALIASES = {
  financial: ['finance', 'money', 'salary', 'tax', 'paye', 'fx', 'forex', 'rates', 'market data', 'prices', 'fuel prices'],
  'document-pdf': ['documents', 'pdf', 'forms', 'files', 'office'],
  'image-design': ['image', 'design', 'photo', 'graphics', 'creative assets'],
  developer: ['dev tools', 'api', 'json', 'seo', 'code', 'webmaster'],
  education: ['school', 'student', 'exam', 'scholarship', 'university'],
  health: ['medical', 'wellness', 'clinic', 'hospital'],
  government: ['civic', 'official', 'passport', 'national id', 'voter', 'permit'],
  agriculture: ['farm', 'crop', 'food prices', 'commodity', 'livestock'],
  african: ['africa', 'pan african', 'local african'],
  'data-productivity': ['data', 'productivity', 'business roi', 'calculator'],
  'small-business': ['sme', 'startup', 'business', 'merchant', 'pos'],
  fintech: ['banking', 'mobile money', 'payments', 'merchant fees'],
  telecom: ['mobile', 'data plan', 'ussd', 'airtime', 'internet'],
  trade: ['import', 'export', 'customs', 'shipping', 'afcfta'],
  energy: ['power', 'electricity', 'solar', 'fuel', 'petrol', 'diesel', 'gasoline', 'utility'],
  transport: ['logistics', 'vehicle', 'fare', 'fleet', 'fuel', 'route'],
  language: ['translation', 'translator', 'local language'],
  engineering: ['construction', 'cad', 'building', 'materials'],
  ecommerce: ['vat', 'business tax', 'invoice', 'sales tax'],
  legal: ['compliance', 'property', 'mortgage', 'contract', 'law'],
  'hr-payroll': ['hr', 'payroll', 'employee', 'wage', 'staff'],
  'personal-finance': ['budget', 'savings', 'debt', 'net worth'],
  diaspora: ['migration', 'return', 'remittance', 'japa'],
  'religious-cultural': ['religion', 'culture', 'islamic', 'christian', 'wedding'],
  climate: ['environment', 'sustainability', 'carbon', 'flood'],
  insurance: ['premium', 'claims', 'cover', 'risk'],
  sports: ['entertainment', 'football', 'afcon', 'music', 'events'],
  mining: ['extractives', 'gold', 'diamond', 'royalty'],
  creative: ['creator', 'media', 'streaming', 'content', 'music', 'film'],
  security: ['safety', 'cybersecurity', 'password', 'phishing'],
  'travel-tourism': ['travel', 'tourism', 'visa', 'hotel', 'safari'],
  career: ['jobs', 'cv', 'resume', 'cover letter', 'certification']
};

function splitSlug(value) {
  return String(value || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[/?#]/)
    .join(' ')
    .replace(/[-_]+/g, ' ');
}

function countryIdsFor(tool) {
  return tool.applicability.scope === 'pan-african' ? ['ALL'] : tool.applicability.countryIds.slice();
}

function buildSearchText(tool, categoryById, countryById) {
  const category = categoryById.get(tool.categoryId) || {};
  const countryIds = countryIdsFor(tool);
  const countryTerms = countryIds.includes('ALL')
    ? ['All African countries', 'Africa', 'Pan-African']
    : countryIds.map((id) => countryById.get(id)).filter(Boolean).map((country) => country.title);
  const tags = Array.isArray(tool.source.tags) ? tool.source.tags : [];
  const aliases = Array.isArray(tool.source.aliases) ? tool.source.aliases : [];
  const baseText = [tool.id, tool.title, tool.description, tool.route, tool.categoryId, category.title, ...tags].join(' ').toLowerCase();
  const generatedAliases = [];
  if (/\bfuel\b|petrol|diesel|gasoline|carburant/.test(baseText)) generatedAliases.push('fuel tracker', 'fuel prices', 'petrol', 'diesel', 'gasoline', 'carburant');
  if (/\btax\b|paye|vat|wht|cit|cgt|duty/.test(baseText)) generatedAliases.push('tax', 'income tax', 'business tax', 'salary tax', 'impot', 'fiscal');
  if (/stream|creator|content|media|music|video/.test(baseText)) generatedAliases.push('creator economy', 'creative economy', 'streaming', 'content creator', 'media');
  return localizationApi.normalizeDisplayString([...new Set([
    tool.categoryId,
    category.title,
    splitSlug(tool.id),
    splitSlug(tool.route),
    tool.publicationStatus,
    tool.source.phase,
    tool.source.tier,
    tool.source.revenue,
    ...countryIds,
    ...countryTerms,
    ...tags,
    ...aliases,
    ...(CATEGORY_ALIASES[tool.categoryId] || []),
    ...generatedAliases
  ].filter(Boolean).map(String))].join(' '));
}

function searchRecord(tool, categoryById, countryById) {
  return [
    tool.id,
    localizationApi.normalizeDisplayString(tool.title),
    localizationApi.normalizeDisplayString(tool.description),
    tool.categoryId,
    countryIdsFor(tool),
    'live',
    tool.route,
    localizationApi.normalizeDisplayString(tool.source.icon || ''),
    Number(tool.source.priority || 0),
    buildSearchText(tool, categoryById, countryById)
  ];
}

const registry = registryApi.buildCanonicalRegistry();
const validation = registryApi.validateCanonicalRegistry(registry);
if (!validation.ok) throw new Error(validation.errors.map(registryApi.formatIssue).join('\n'));
const categoryById = new Map(registry.categories.map((category) => [category.id, category]));
const countryById = new Map(registry.countries.map((country) => [country.id, country]));
const records = registry.tools
  .filter((tool) => tool.publicationStatus === 'published' && !tool.deprecated)
  .map((tool) => searchRecord(tool, categoryById, countryById));

fs.mkdirSync(path.dirname(SEARCH_INDEX_PATH), { recursive: true });
writeFileSyncWithRetry(SEARCH_INDEX_PATH, `${JSON.stringify(records)}\n`, 'utf8');
console.log(`Built ${records.length} canonical search index rows (${Math.round(fs.statSync(SEARCH_INDEX_PATH).size / 1024)} KB)`);
