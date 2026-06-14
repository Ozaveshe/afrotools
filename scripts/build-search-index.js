#!/usr/bin/env node
/**
 * Build the lightweight client search index used by /search/.
 *
 * The full tool registry is still the source of truth, but search only needs
 * compact display and matching fields. Keeping this as JSON avoids making
 * mobile users download and execute the whole registry bundle before results.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'assets/js/components/tool-registry.js');
const SEARCH_INDEX_PATH = path.join(ROOT, 'data/search-index.json');

const COUNTRY_NAMES = {
  DZ: ['Algeria'], AO: ['Angola'], BJ: ['Benin'], BW: ['Botswana'], BF: ['Burkina Faso'],
  BI: ['Burundi'], CV: ['Cabo Verde', 'Cape Verde'], CM: ['Cameroon'], CF: ['Central African Republic', 'CAR'],
  TD: ['Chad'], KM: ['Comoros'], CG: ['Congo', 'Republic of Congo', 'Congo Brazzaville'],
  CD: ['DR Congo', 'Democratic Republic of Congo', 'DRC', 'Congo Kinshasa'], CI: ["Cote d'Ivoire", 'Côte d’Ivoire', 'Ivory Coast'],
  DJ: ['Djibouti'], EG: ['Egypt'], GQ: ['Equatorial Guinea'], ER: ['Eritrea'], SZ: ['Eswatini', 'Swaziland'],
  ET: ['Ethiopia'], GA: ['Gabon'], GM: ['Gambia', 'The Gambia'], GH: ['Ghana'], GN: ['Guinea'],
  GW: ['Guinea-Bissau'], KE: ['Kenya'], LS: ['Lesotho'], LR: ['Liberia'], LY: ['Libya'],
  MG: ['Madagascar'], MW: ['Malawi'], ML: ['Mali'], MR: ['Mauritania'], MU: ['Mauritius'],
  MA: ['Morocco'], MZ: ['Mozambique'], NA: ['Namibia'], NE: ['Niger'], NG: ['Nigeria'],
  RW: ['Rwanda'], ST: ['Sao Tome and Principe', 'São Tomé and Príncipe'], SN: ['Senegal'], SC: ['Seychelles'],
  SL: ['Sierra Leone'], SO: ['Somalia'], ZA: ['South Africa'], SS: ['South Sudan'], SD: ['Sudan'],
  TZ: ['Tanzania'], TG: ['Togo'], TN: ['Tunisia'], UG: ['Uganda'], ZM: ['Zambia'], ZW: ['Zimbabwe'],
  ALL: ['All African countries', 'Africa', 'Pan-African'],
};

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
  career: ['jobs', 'cv', 'resume', 'cover letter', 'certification'],
};

function loadRegistry() {
  const code = fs.readFileSync(REGISTRY_PATH, 'utf8');
  function FakeEvent() {}
  const sandbox = {
    window: {},
    CustomEvent: FakeEvent,
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '', style: {}, appendChild() {} }),
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      querySelector: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: REGISTRY_PATH });
  return {
    tools: Array.isArray(sandbox.AFRO_TOOLS) ? sandbox.AFRO_TOOLS : [],
    categories: sandbox.AFRO_CATEGORIES || {},
  };
}

function normalizeCountries(tool) {
  if (Array.isArray(tool.countries)) return tool.countries.filter(Boolean);
  if (typeof tool.countries === 'string' && tool.countries.trim()) return [tool.countries.trim()];
  if (typeof tool.country === 'string' && tool.country.trim()) return [tool.country.trim()];
  return [];
}

function splitSlug(value) {
  return String(value || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[/?#]/)
    .join(' ')
    .replace(/[-_]+/g, ' ');
}

function buildSearchText(tool, categories) {
  const category = categories[tool.category] || {};
  const countries = normalizeCountries(tool);
  const countryTerms = countries.flatMap((code) => COUNTRY_NAMES[code] || [code]);
  const tags = Array.isArray(tool.tags) ? tool.tags : (tool.tags ? [tool.tags] : []);
  const aliases = Array.isArray(tool.aliases) ? tool.aliases : [];
  const categoryAliases = CATEGORY_ALIASES[tool.category] || [];
  const baseText = [tool.id, tool.name, tool.desc, tool.href, tool.category, category.name, ...tags].join(' ').toLowerCase();
  const generatedAliases = [];
  if (/\bfuel\b|petrol|diesel|gasoline|carburant/.test(baseText)) {
    generatedAliases.push('fuel tracker', 'fuel prices', 'petrol', 'diesel', 'gasoline', 'carburant');
  }
  if (/\btax\b|paye|vat|wht|cit|cgt|duty/.test(baseText)) {
    generatedAliases.push('tax', 'income tax', 'business tax', 'salary tax', 'impot', 'fiscal');
  }
  if (/stream|creator|content|media|music|video/.test(baseText)) {
    generatedAliases.push('creator economy', 'creative economy', 'streaming', 'content creator', 'media');
  }
  return Array.from(new Set([
    tool.category,
    category.name,
    splitSlug(tool.id),
    splitSlug(tool.href),
    tool.status,
    tool.phase,
    tool.tier,
    tool.revenue,
    ...countries,
    ...countryTerms,
    ...tags,
    ...aliases,
    ...categoryAliases,
    ...generatedAliases,
  ].filter(Boolean).map(String))).join(' ');
}

function searchRecord(tool, categories) {
  return [
    tool.id,
    tool.name || tool.id,
    tool.desc || '',
    tool.category || 'uncategorized',
    normalizeCountries(tool),
    tool.status || 'planned',
    tool.href || `/tools/${tool.id}/`,
    tool.icon || '',
    Number(tool.priority || 0),
    buildSearchText(tool, categories),
  ];
}

const registry = loadRegistry();
const records = registry.tools
  .filter((tool) => tool && tool.id && (tool.href || tool.name))
  .map((tool) => searchRecord(tool, registry.categories));

fs.mkdirSync(path.dirname(SEARCH_INDEX_PATH), { recursive: true });
writeFileSyncWithRetry(SEARCH_INDEX_PATH, JSON.stringify(records) + '\n', 'utf8');

const bytes = fs.statSync(SEARCH_INDEX_PATH).size;
console.log(`Built ${records.length} search index rows (${Math.round(bytes / 1024)} KB)`);
