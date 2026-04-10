#!/usr/bin/env node
/**
 * AFROTOOLS — Update Tool Counts Across All HTML Files
 * ===================================================================
 * Reads tool-registry.js, computes the EN-only tool count (with toolCount),
 * then replaces hardcoded tool count strings ONLY in SEO/marketing contexts.
 *
 * SAFE: Only matches counts followed by keywords like "tools", "outils", "zana",
 * "free", "African", etc. Never touches tax brackets, currency amounts, or data.
 *
 * Usage:
 *   node scripts/update-counts.js          (dry run)
 *   node scripts/update-counts.js --write  (apply changes)
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

// ── Load registry and compute count ────────────────────────
const registryPath = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const code = fs.readFileSync(registryPath, 'utf8');

function FakeEvent() {}
const sandbox = {
  window: {},
  CustomEvent: FakeEvent,
  document: {
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ textContent: '' }),
    head: { appendChild: () => {} },
    addEventListener: () => {},
    dispatchEvent: () => {},
    querySelector: () => null,
  }
};
vm.runInNewContext(code, sandbox);

const count = sandbox.getTotalToolCount();
const roundDown = Math.floor(count / 10) * 10;
const displayEN = roundDown.toLocaleString('en-US') + '+';
const displayFR = roundDown.toLocaleString('fr-FR').replace(/\u202F/g, ' ') + '+';
const displayENNoPlus = roundDown.toLocaleString('en-US');
const displayFRNoPlus = roundDown.toLocaleString('fr-FR').replace(/\u202F/g, ' ');

const catCount = Object.keys(sandbox.AFRO_CATEGORIES).length;

console.log('Registry entries:', sandbox.AFRO_TOOLS.length);
console.log('EN tool count (with toolCount):', count);
console.log('Display (EN):', displayEN);
console.log('Display (FR):', displayFR);
console.log('Categories:', catCount);
console.log('Mode:', WRITE ? 'WRITE' : 'DRY RUN');
console.log('');

// ── Context-aware replacement patterns ─────────────────────
// Only match tool counts in marketing/SEO contexts, never in tax data
// Pattern: a 4-digit comma-separated number followed by context words

// English patterns: "1,110+ tools", "1,300+ free", "Search 1,300+", etc.
const EN_PATTERNS = [
  // "1,XXX+ tools" / "1,XXX+ free" / "1,XXX+ African" / "1,XXX+ outils"
  /\b1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+\s*(?:tools|free|African|calculat)/g,
  // "Search 1,XXX+" / "Browse 1,XXX+" / "parmi 1,XXX+"
  /(?:Search|Browse|Search|parmi)\s+1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  // In meta content: 'content="1,XXX+ ...' or 'content="All 1,XXX+'
  /(?:content=["'][^"']*?)1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  // "over 1,XXX tools" (without +)
  /over\s+1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\s+tools/g,
  // In title tags
  /(<title>[^<]*?)1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  // "Zana 1,XXX+" (Swahili)
  /Zana\s+1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  // Schema JSON: "1,XXX+ tools" in JSON-LD
  /"1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+\s+(?:tools|free)/g,
  // Hero stat count with id
  /id="(?:stat-total|heroToolCount|statLive|countAll|countLive)"[^>]*>1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  // Category count: "XX categories, 1,XXX+"
  /\d+\s+categories?,\s*1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  // placeholder="Search 1,XXX+"
  /placeholder="[^"]*1[,.](?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
];

// French patterns: "1 110+ outils", "1 300+ outils"
const FR_PATTERNS = [
  /1\s(?:0[0-9]{2}|[1-3][0-9]{2})\+\s*(?:outils|gratuits)/g,
  /(?:parmi|Rechercher parmi|Parcourir)\s+1\s(?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  /(?:content=["'][^"']*?)1\s(?:0[0-9]{2}|[1-3][0-9]{2})\+/g,
  /plus\sde\s1\s(?:0[0-9]{2}|[1-3][0-9]{2})\s+outils/g,
];

// ── Simple and safe approach: line-by-line replacement ──────
function findHtmlFiles(dir, results) {
  results = results || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (['node_modules', '.git', '.claude', 'afrotools-sentinel', 'changelog'].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, results);
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Simpler approach: replace specific known strings
const EN_REPLACEMENTS = [
  // Exact old count strings → new
  ['1,300+ Free Tools', displayEN.replace('+', '') + '+ Free Tools'],
  ['1,300+ Tools', displayEN.replace('+', '') + '+ Tools'],
  ['1,300+ free tools', displayEN.replace('+', '') + '+ free tools'],
  ['1,300+ tools', displayEN.replace('+', '') + '+ tools'],
  ['1,300+ African tools', displayEN.replace('+', '') + '+ African tools'],
  ['Search 1,300+ tools', 'Search ' + displayEN + ' tools'],
  ['Search 1,300+ African tools', 'Search ' + displayEN + ' African tools'],
  ['Browse 1,300+ tools', 'Browse ' + displayEN + ' tools'],
  ['2,960+ Free Tools', displayEN.replace('+', '') + '+ Free Tools'],
  ['2,960+ Tools', displayEN.replace('+', '') + '+ Tools'],
  ['2,960+ free tools', displayEN.replace('+', '') + '+ free tools'],
  ['2,960+ tools', displayEN.replace('+', '') + '+ tools'],
  ['2,960+ African tools', displayEN.replace('+', '') + '+ African tools'],
  ['2,960+ Free African Tools', displayEN.replace('+', '') + '+ Free African Tools'],
  ['2,960+ free African tools', displayEN.replace('+', '') + '+ free African tools'],
  ['Search 2,960+ tools', 'Search ' + displayEN + ' tools'],
  ['Search 2,960+ African tools', 'Search ' + displayEN + ' African tools'],
  ['Search 2,960+ free', 'Search ' + displayEN + ' free'],
  ['Browse 2,960+ tools', 'Browse ' + displayEN + ' tools'],
  ['1,390+ Free Tools', displayEN.replace('+', '') + '+ Free Tools'],
  ['1,390+ Tools', displayEN.replace('+', '') + '+ Tools'],
  ['1,390+ free tools', displayEN.replace('+', '') + '+ free tools'],
  ['1,390+ tools', displayEN.replace('+', '') + '+ tools'],
  ['1,390+ African tools', displayEN.replace('+', '') + '+ African tools'],
  ['1,390+ Free African Tools', displayEN.replace('+', '') + '+ Free African Tools'],
  ['1,390+ free African tools', displayEN.replace('+', '') + '+ free African tools'],
  ['Search 1,390+ tools', 'Search ' + displayEN + ' tools'],
  ['Search 1,390+ African tools', 'Search ' + displayEN + ' African tools'],
  ['Search 1,390+ free', 'Search ' + displayEN + ' free'],
  ['Browse 1,390+ tools', 'Browse ' + displayEN + ' tools'],
  ['1,110+ Free Tools', displayEN.replace('+', '') + '+ Free Tools'],
  ['1,110+ Tools', displayEN.replace('+', '') + '+ Tools'],
  ['1,110+ free tools', displayEN.replace('+', '') + '+ free tools'],
  ['1,110+ tools', displayEN.replace('+', '') + '+ tools'],
  ['1,110+ free browser-based tools', displayEN.replace('+', '') + '+ free browser-based tools'],
  ['2,960+ free browser-based tools', displayEN.replace('+', '') + '+ free browser-based tools'],
  ['1,110+ live tools</strong> across 14 categories', displayEN + ' live tools</strong> across ' + catCount + ' categories'],
  ['1,300+ live tools', displayEN.replace('+', '') + '+ live tools'],
  ['2,960+ live tools', displayEN.replace('+', '') + '+ live tools'],
  ['1,390+ live tools', displayEN.replace('+', '') + '+ live tools'],
  ['1,110+ live tools', displayEN.replace('+', '') + '+ live tools'],
  ['1,110+ Free African Tools', displayEN.replace('+', '') + '+ Free African Tools'],
  ['1,110+ free African tools', displayEN.replace('+', '') + '+ free African tools'],
  ['Search 1,110+ tools', 'Search ' + displayEN + ' tools'],
  ['Search 1,110+ free', 'Search ' + displayEN + ' free'],
  ['Browse 1,110+ tools', 'Browse ' + displayEN + ' tools'],
  ['1,070+ Free Tools', displayEN.replace('+', '') + '+ Free Tools'],
  ['1,070+ Tools', displayEN.replace('+', '') + '+ Tools'],
  ['1,070+ free tools', displayEN.replace('+', '') + '+ free tools'],
  ['1,070+ tools', displayEN.replace('+', '') + '+ tools'],
  ['over 1,300 tools', 'over ' + displayENNoPlus + ' tools'],
  ['over 2,960 tools', 'over ' + displayENNoPlus + ' tools'],
  ['over 1,390 tools', 'over ' + displayENNoPlus + ' tools'],
  ['over 1,110 tools', 'over ' + displayENNoPlus + ' tools'],
  ['over 1,070 tools', 'over ' + displayENNoPlus + ' tools'],
  // Tool count in specific HTML elements
  ['>1,300+<', '>' + displayEN + '<'],
  ['>2,960+<', '>' + displayEN + '<'],
  ['>1,390+<', '>' + displayEN + '<'],
  ['>1,110+<', '>' + displayEN + '<'],
  ['>1,070+<', '>' + displayEN + '<'],
  // "1,300+ tools built for" (country pages)
  ['1,300+ tools built for', displayEN + ' tools built for'],
  ['2,960+ tools built for', displayEN + ' tools built for'],
  ['1,390+ tools built for', displayEN + ' tools built for'],
  ['1,110+ tools built for', displayEN + ' tools built for'],
  ['1,070+ tools built for', displayEN + ' tools built for'],
  // Schema/JSON
  ['"1,300+ tools', '"' + displayEN + ' tools'],
  ['"2,960+ tools', '"' + displayEN + ' tools'],
  ['"1,390+ tools', '"' + displayEN + ' tools'],
  ['"1,110+ tools', '"' + displayEN + ' tools'],
  // Placeholder
  ['placeholder="Search 1,300+ tools..."', 'placeholder="Search ' + displayEN + ' tools..."'],
  ['placeholder="Search 2,960+ tools..."', 'placeholder="Search ' + displayEN + ' tools..."'],
  ['placeholder="Search 1,390+ tools..."', 'placeholder="Search ' + displayEN + ' tools..."'],
  ['placeholder="Search 1,110+ tools..."', 'placeholder="Search ' + displayEN + ' tools..."'],
  ['placeholder="Search 1,070+ tools..."', 'placeholder="Search ' + displayEN + ' tools..."'],
  // Categories count
  ['14 categories, 1,110+', catCount + ' categories, ' + displayEN],
  ['14 categories, 1,300+', catCount + ' categories, ' + displayEN],
  ['14 categories, 1,390+', catCount + ' categories, ' + displayEN],
  ['32 categories, 1,390+', catCount + ' categories, ' + displayEN],
  ['32 categories, 2,960+', catCount + ' categories, ' + displayEN],
  ['14 categories, 1,070+', catCount + ' categories, ' + displayEN],
  ['28 categories, 1,110+', catCount + ' categories, ' + displayEN],
  ['28 categories, 1,300+', catCount + ' categories, ' + displayEN],
  ['34 categories, 1,070+', catCount + ' categories, ' + displayEN],
  ['34 categories, 1,390+', catCount + ' categories, ' + displayEN],
  // All XX Tool Categories
  ['All 28 Tool Categories', 'All ' + catCount + ' Tool Categories'],
  ['All 34 Tool Categories', 'All ' + catCount + ' Tool Categories'],
  // "28 AfroTools categories"
  ['28 AfroTools categories', catCount + ' AfroTools categories'],
  ['34 AfroTools categories', catCount + ' AfroTools categories'],
  // Swahili
  ['Zana 1,300+ za Afrika', 'Zana ' + displayEN + ' za Afrika'],
  ['Zana 2,960+ za Afrika', 'Zana ' + displayEN + ' za Afrika'],
  ['Zana 1,390+ za Afrika', 'Zana ' + displayEN + ' za Afrika'],
  ['Zana 1,110+ za Afrika', 'Zana ' + displayEN + ' za Afrika'],
  ['Zana 1,070+ za Afrika', 'Zana ' + displayEN + ' za Afrika'],
  ['Zana 1,110+ za Fedha za Afrika', 'Zana ' + displayEN + ' za Fedha za Afrika'],
  ['Zana 1,390+ za Fedha za Afrika', 'Zana ' + displayEN + ' za Fedha za Afrika'],
  ['Zana 2,960+ za Fedha za Afrika', 'Zana ' + displayEN + ' za Fedha za Afrika'],
  ['Zana 1,110+ bure', 'Zana ' + displayEN + ' bure'],
  ['Zana 1,390+ bure', 'Zana ' + displayEN + ' bure'],
  ['Zana 2,960+ bure', 'Zana ' + displayEN + ' bure'],
  ['Makundi 32, zana 1,110+', 'Makundi ' + catCount + ', zana ' + displayEN],
  ['Makundi 32, zana 1,390+', 'Makundi ' + catCount + ', zana ' + displayEN],
  ['Makundi 32, zana 2,960+', 'Makundi ' + catCount + ', zana ' + displayEN],
  ['zana 1,390+ bure', 'zana ' + displayEN + ' bure'],
  ['zana 2,960+ bure', 'zana ' + displayEN + ' bure'],
  ['zana 1,110+ bure', 'zana ' + displayEN + ' bure'],
  ['zana 1,390+', 'zana ' + displayEN],
  ['zana 2,960+', 'zana ' + displayEN],
  ['zana 1,110+', 'zana ' + displayEN],
  ['1,390+ zana', displayEN + ' zana'],
  ['2,960+ zana', displayEN + ' zana'],
  ['1,110+ zana', displayEN + ' zana'],
  ['Vikokotoo 1,390+', 'Vikokotoo ' + displayEN],
  ['Vikokotoo 2,960+', 'Vikokotoo ' + displayEN],
  ['Vikokotoo 1,110+', 'Vikokotoo ' + displayEN],
  // "all 1,110+" / "all 1,300+"
  ['all 1,300+', 'all ' + displayEN],
  ['all 2,960+', 'all ' + displayEN],
  ['all 1,390+', 'all ' + displayEN],
  ['all 1,110+', 'all ' + displayEN],
  ['2,960+ pages', displayEN + ' pages'],
];

const FR_REPLACEMENTS = [
  ['Plus de 670 outils', 'Plus de ' + displayFRNoPlus + ' outils'],
  ['Plus%20de%20670%20outils', 'Plus%20de%20' + encodeURIComponent(displayFRNoPlus) + '%20outils'],
  ['plus de 670 outils', 'plus de ' + displayFRNoPlus + ' outils'],
  ['670 outils', displayFRNoPlus + ' outils'],
  ['1 300+ outils', displayFR + ' outils'],
  ['2 960+ outils', displayFR + ' outils'],
  ['2,960+ outils', displayFR + ' outils'],
  ['1 390+ outils', displayFR + ' outils'],
  ['1 110+ outils', displayFR + ' outils'],
  ['1 070+ outils', displayFR + ' outils'],
  ['1,390+ outils', displayFR + ' outils'],
  ['1,110+ outils', displayFR + ' outils'],
  ['1 300+ gratuits', displayFR + ' gratuits'],
  ['2 960+ gratuits', displayFR + ' gratuits'],
  ['2,960+ gratuits', displayFR + ' gratuits'],
  ['1 390+ gratuits', displayFR + ' gratuits'],
  ['1 110+ gratuits', displayFR + ' gratuits'],
  ['1,390+ gratuits', displayFR + ' gratuits'],
  ['1,110+ gratuits', displayFR + ' gratuits'],
  ['plus de 1 300 outils', 'plus de ' + displayFRNoPlus + ' outils'],
  ['plus de 2 960 outils', 'plus de ' + displayFRNoPlus + ' outils'],
  ['Plus de 2 960 outils', 'Plus de ' + displayFRNoPlus + ' outils'],
  ['plus de 1 390 outils', 'plus de ' + displayFRNoPlus + ' outils'],
  ['plus de 1 110 outils', 'plus de ' + displayFRNoPlus + ' outils'],
  ['parmi 1 300+', 'parmi ' + displayFR],
  ['parmi 2 960+', 'parmi ' + displayFR],
  ['parmi 1 390+', 'parmi ' + displayFR],
  ['parmi 1 110+', 'parmi ' + displayFR],
  ['parmi 1 070+', 'parmi ' + displayFR],
  ['>1 300+<', '>' + displayFR + '<'],
  ['>2 960+<', '>' + displayFR + '<'],
  ['>2,960+<', '>' + displayFR + '<'],
  ['>1 390+<', '>' + displayFR + '<'],
  ['>1 110+<', '>' + displayFR + '<'],
  ['>1 070+<', '>' + displayFR + '<'],
  // Makundi for Swahili
  ['Makundi 14', 'Makundi ' + catCount],
  ['Makundi 28', 'Makundi ' + catCount],
  ['Makundi 34', 'Makundi ' + catCount],
];

const htmlFiles = findHtmlFiles(ROOT);
let totalChanges = 0;
let filesChanged = 0;

for (const filePath of htmlFiles) {
  const rel = path.relative(ROOT, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  const isFr = rel.startsWith('fr' + path.sep) || content.includes('lang="fr"');
  const isSw = rel.startsWith('sw' + path.sep) || content.includes('lang="sw"');

  // Apply replacements
  const replacements = [...EN_REPLACEMENTS];
  if (isFr || isSw) replacements.push(...FR_REPLACEMENTS);

  for (const [from, to] of replacements) {
    if (from === to) continue;
    while (content.includes(from)) {
      content = content.replace(from, to);
    }
  }

  if (content !== original) {
    const changes = original.length - content.length === 0
      ? 'modified'
      : Math.abs(original.split(displayEN).length - content.split(displayEN).length) + ' change(s)';
    console.log('  ' + rel);
    totalChanges++;
    filesChanged++;
    if (WRITE) {
      fs.writeFileSync(filePath, content);
    }
  }
}

console.log('');
console.log('Summary: ' + filesChanged + ' files modified');
if (!WRITE) {
  console.log('Run with --write to apply changes');
}
