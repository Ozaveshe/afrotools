const fs = require('fs');
const path = require('path');
const contract = require('../data/api-public-contract.json');

const ROOT = path.resolve(__dirname, '..');
const DOC_INPUTS = [
  'api',
  'index.html',
  'auth/index.html',
  'dashboard/api/index.html',
  'docs/api',
  'developers/index.html',
  'developer-tools/index.html',
  'pricing/index.html',
  'fr/tools/convertisseur-devises/index.html',
  'fr/developers/index.html'
];

function collectFiles(input) {
  const full = path.join(ROOT, input);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return /\.(html|md|js)$/i.test(full) ? [full] : [];
  const files = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const child = path.join(full, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path.relative(ROOT, child)));
    else if (/\.(html|md|js)$/i.test(entry.name)) files.push(child);
  }
  return files;
}

const files = [...new Set(DOC_INPUTS.flatMap(collectFiles))];
const docs = files.map((file) => ({
  file,
  rel: path.relative(ROOT, file).replace(/\\/g, '/'),
  text: fs.readFileSync(file, 'utf8')
}));
const allText = docs.map((item) => item.text).join('\n');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function assertNo(pattern, label) {
  const offenders = docs.filter((item) => pattern.test(item.text)).map((item) => item.rel);
  if (offenders.length) fail(`${label} found in:\n${offenders.join('\n')}`);
}

assertNo(/api\.afrotools\.com/i, 'Deprecated API domain');
assertNo(/https:\/\/afrotools\.com\/api\/(?:tax-rates|fx-rates|forex|fuel|rates|tax|vat|countries)(?=[?"'<\s/]|$)/i, 'Deprecated API endpoint URL');
assertNo(/(?<!docs)\/api\/(?:tax-rates|fx-rates|forex|fuel|rates|tax|vat|countries)(?=[?"'<\s]|$)/i, 'Deprecated API endpoint path');
assertNo(/\/api\/v1\/(?:forex|fuel|tax|vat)(?=[?"'<\s]|$)/i, 'Deprecated v1 endpoint path');
assertNo(/bypass rate limits/i, 'Unsafe sandbox wording');
assertNo(/return live data/i, 'Unsafe sandbox live-data wording');
assertNo(/100 calls\/day/i, 'Old free-tier wording');
assertNo(/1,000 requests\/month|1000 requests\/month|1,000 requests per month/i, 'Old monthly free-tier wording');

if (!allText.includes(contract.canonical_base_url)) fail('Canonical API base URL is missing from docs.');
if (!allText.includes(contract.status_url)) fail('API status URL is missing from docs.');
if (!allText.includes('100 requests/day and 3,000/month')) fail('Standard free-tier wording is missing from docs.');
if (!allText.includes('Test keys return deterministic sandbox data') && !allText.includes('Test keys (<code>afro_test_*</code>) return deterministic sandbox data')) {
  fail('Standard sandbox-data wording is missing from docs.');
}

for (const endpoint of contract.endpoints) {
  const fullUrl = contract.canonical_base_url + endpoint.path.replace(/^\/v1/, '');
  if (!allText.includes(endpoint.path) && !allText.includes(fullUrl)) {
    fail(`Canonical endpoint missing from docs: ${endpoint.path}`);
  }
}

for (const item of docs) {
  const curlLines = item.text.split(/\r?\n/).filter((line) => /\bcurl(?:\s|-X|_init|\()/i.test(line));
  for (const line of curlLines) {
    const match = line.match(/https:\/\/[^\s"'<>\\)]+/i);
    if (!match) continue;
    const url = match[0].replace(/&amp;/g, '&');
    const allowed =
      url === contract.status_url ||
      url.startsWith(contract.canonical_base_url + '/') ||
      url.startsWith(contract.canonical_base_url + '?');
    if (!allowed) {
      fail(`Non-canonical cURL URL in ${item.rel}: ${url}`);
    }
  }
}

const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const netlifyToml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const routePaths = ['/api/status'].concat(contract.endpoints.map((endpoint) => '/api' + endpoint.path));
for (const route of routePaths) {
  if (!redirects.includes(route)) fail(`_redirects missing ${route}`);
  if (!netlifyToml.includes(`from = "${route}"`)) fail(`netlify.toml missing ${route}`);
}

if (!process.exitCode) {
  console.log(`API docs consistency passed across ${docs.length} files.`);
}
