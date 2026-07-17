#!/usr/bin/env node
/**
 * Clean obvious public-page encoding artifacts left by broken emoji/dash
 * conversions. This is intentionally conservative: it skips Pro, dist,
 * vendor, minified bundles, docs, and reports.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'pro',
  'docs',
  'reports',
  'assets/vendor',
]);

const EXTENSIONS = new Set(['.html', '.js', '.json']);

function shouldSkip(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.includes('/pro/') || normalized.startsWith('pro/')) return true;
  if (normalized.includes('/dist/') || normalized.startsWith('dist/')) return true;
  if (normalized.includes('/node_modules/')) return true;
  if (normalized.includes('/assets/vendor/')) return true;
  if (normalized.endsWith('.min.js') || normalized.endsWith('.map')) return true;
  return false;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    const normalized = rel.replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(normalized) || SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
      continue;
    }
    if (!EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    if (shouldSkip(rel)) continue;
    out.push(full);
  }
  return out;
}

function cleanText(input) {
  let text = input;

  const replacements = [
    [/Loading.../g, 'Loading...'],
    [/Thinking.../g, 'Thinking...'],
    [/Ask about VAT.../g, 'Ask about VAT...'],
    [/Save\/Share buttons -/g, 'Save/Share buttons -'],
    [/TOOL CARD HOVER -/g, 'TOOL CARD HOVER -'],
    [/VAT & Business Tax | AfroTools/g, 'VAT & Business Tax | AfroTools'],
    [/Revenue Authority<\/span><strong id="detailAuthority">--/g, 'Revenue Authority</span><strong id="detailAuthority">--'],
    [/id="detail(Rate|Reduced|Threshold|Filing|Authority)">-/g, 'id="detail$1">--'],
    [/id="(multiSub|multiVat|multiTotal|multiEffRate|resPretax|resVat|annualVat)">-/g, 'id="$1">--'],
    [/\? \(1 \+ 0\.(\d+)\)/g, 'x (1 + 0.$1)'],
    [/(\d[\d,.]*) - (1\.\d+)/g, '$1 x $2'],
    [/(\d[\d,.]*) - (0\.\d+)/g, '$1 x $2'],
    [/Divide the VAT-inclusive price by 1\.(\d+)\. Example: ([^<"]+) - 1\.(\d+) =/g, 'Divide the VAT-inclusive price by 1.$1. Example: $2 / 1.$3 ='],
    [/Annual projection \(-12\)/g, 'Annual projection (x12)'],
    [/ZMW - Zambian Kwacha/g, 'ZMW - Zambian Kwacha'],
    [/ZWL - Zimbabwean Dollar/g, 'ZWL - Zimbabwean Dollar'],
    [/ZRA -/g, 'ZRA -'],
    [/ZIMRA -/g, 'ZIMRA -'],
    [/ZMW \(ZK\) -/g, 'ZMW (ZK) -'],
    [/ZWL \/ USD -/g, 'ZWL / USD -'],
    [/Tax calculators, PDF workspace, currency tools - all free/g, 'Tax calculators, PDF workspace, currency tools - all free'],
    [/and more - all built/g, 'and more - all built'],
    [/Tell us what you need -/g, 'Tell us what you need -'],
    [/Search tools -/g, 'Search tools -'],
    [/break even.../g, 'break even...'],
    [/break-even.../g, 'break-even...'],
    [/Request a Tool \?/g, 'Request a Tool'],
    [/\?{4} (Nigeria|Kenya|South Africa|Ghana|Egypt|Morocco|Ethiopia|Tanzania|Rwanda|Zambia|Zimbabwe)/g, '$1'],
    [/<span class="hub-flag">\?{4}<\/span>/g, '<span class="hub-flag" aria-hidden="true">AF</span>'],
    [/content:'\?{4}'/g, "content:''"],
    [/country-flag="\?{4}"/g, 'country-flag=""'],
    [/<a href="\/(zambia|zimbabwe)\/[^"]*">\?{4} (Zambia|Zimbabwe)/g, '<a href="/$1/$2'],
    [/\/ <a href="\/([a-z-]+)\/">\?{4} ([^<]+)<\/a>/g, '/ <a href="/$1/">$2</a>'],
    [/<h4>\?{2,4}\s*Tax Authority<\/h4>/g, '<h4>Tax Authority</h4>'],
    [/<h4>\?{2,4}\s*Currency<\/h4>/g, '<h4>Currency</h4>'],
    [/<h4>\?{2,4}\s*AfroTools Coverage<\/h4>/g, '<h4>AfroTools Coverage</h4>'],
    [/<h4>\?{2,4}\s*Always Accurate<\/h4>/g, '<h4>Always Accurate</h4>'],
    [/<span class="hub-mi" id="tool-count"><span class="hub-dot"><\/span>Loading...<\/span>/g, '<span class="hub-mi" id="tool-count"><span class="hub-dot"></span>Loading...</span>'],
  ];

  for (const [pattern, value] of replacements) {
    text = text.replace(pattern, value);
  }

  // Final fallback: remove remaining replacement characters in public UI text.
  text = text.replace(/-/g, '-');

  return text;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  if (!/[-]|TOOL CARD HOVER -|Loading...|Thinking...|Ask about VAT...|\?{3,4}/.test(before)) continue;
  const after = cleanText(before);
  if (after === before) continue;
  fs.writeFileSync(file, after);
  changed += 1;
  console.log(path.relative(ROOT, file));
}

console.log(`Cleaned ${changed} public files.`);
