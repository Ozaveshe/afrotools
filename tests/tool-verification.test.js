#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDED_DIRS = new Set(['.git', '.netlify', '.cache', 'dist', 'node_modules']);
const TARGET_RE = /(^|[\\/])(?:fr[\\/])?[^\\/]+[\\/](?:[a-z]{2}-(?:paye|vat)|ng-salary-tax)\.html$/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function toolIdFor(file, html) {
  const meta = html.match(/<meta\s+name=["']tool-id["']\s+content=["']([^"']+)/i);
  if (meta) return meta[1].trim();
  if (/ng-salary-tax\.html$/i.test(file)) return 'ng-paye';
  return path.basename(file, '.html');
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const failures = [];
const manifestPath = path.join(ROOT, 'data', 'tool-verification.json');
assert(fs.existsSync(manifestPath), 'data/tool-verification.json is missing', failures);

const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { tools: {} };
assert(manifest.tools && typeof manifest.tools === 'object', 'tool verification manifest is missing tools object', failures);

const targetFiles = walk(ROOT)
  .filter((file) => TARGET_RE.test(rel(file)))
  .sort((a, b) => rel(a).localeCompare(rel(b)));

assert(targetFiles.length >= 100, `expected at least 100 PAYE/VAT pages, found ${targetFiles.length}`, failures);

for (const file of targetFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const id = toolIdFor(file, html);
  const entry = manifest.tools[id];
  const label = rel(file);

  assert(entry, `${label} is missing tool verification entry for ${id}`, failures);
  if (!entry) continue;

  assert(entry.last_verified && /^\d{4}-\d{2}-\d{2}$/.test(entry.last_verified), `${id} is missing ISO last_verified`, failures);
  assert(Array.isArray(entry.source_urls) && entry.source_urls.some((url) => /^https?:\/\//.test(url)), `${id} is missing source_url`, failures);
  assert(Array.isArray(entry.source_titles) && entry.source_titles.length > 0, `${id} is missing source_titles`, failures);
  assert(entry.methodology_markdown && entry.methodology_markdown.length > 20, `${id} is missing methodology_markdown`, failures);
  assert(entry.risk_level === 'high' || entry.risk_level === 'critical' || entry.risk_level === 'medium', `${id} has invalid risk_level`, failures);
  assert(entry.disclaimer_type === 'tax', `${id} should use tax disclaimer_type`, failures);
  assert(Array.isArray(entry.known_limitations) && entry.known_limitations.length > 0, `${id} is missing known_limitations`, failures);
  assert(Array.isArray(entry.change_history) && entry.change_history.length > 0, `${id} is missing change_history`, failures);
  assert(Array.isArray(entry.test_cases) && entry.test_cases.length > 0, `${id} is missing test_cases`, failures);

  assert(html.includes('data-tool-verification-panel'), `${label} is missing rendered verification panel`, failures);
  assert(html.includes('Sources &amp; verification') || html.includes('Sources & verification'), `${label} is missing Sources & verification heading`, failures);
  assert(html.includes('Report calculation error'), `${label} is missing report calculation error CTA`, failures);
  assert(html.includes('/assets/css/tool-verification.css'), `${label} is missing tool verification stylesheet`, failures);
  assert(!/<span class="badge[^"]*">[^<]*(?:FIRS\s+)?Verified[^<]*<\/span>/i.test(html), `${label} still has a non-clickable verified badge`, failures);
  assert(!/<div class="tool-stat-lbl">\s*Rating\s*<\/div>/i.test(html), `${label} still shows a rating without a review system`, failures);
}

const payeEntries = Object.values(manifest.tools).filter((entry) => /-paye$/.test(entry.tool_id));
const vatEntries = Object.values(manifest.tools).filter((entry) => /-vat$/.test(entry.tool_id));
assert(payeEntries.length >= 50, `expected PAYE verification entries for all countries, found ${payeEntries.length}`, failures);
assert(vatEntries.length >= 50, `expected VAT verification entries for all countries, found ${vatEntries.length}`, failures);

if (failures.length) {
  console.error('Tool verification test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool verification metadata and panels verified for ${targetFiles.length} PAYE/VAT pages.`);
