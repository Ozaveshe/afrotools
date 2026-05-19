const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(ROOT, 'audit-results', 'copy-quality.csv');

const PHRASES = [
  'leverage',
  'empower',
  'seamless',
  'robust',
  'cutting-edge',
  'revolutionary',
  'unlock your potential',
  'next-generation',
  'comprehensive suite',
  'utilize',
  'facilitate',
  'streamline',
  'ecosystem',
  'solution',
  'optimize your workflow',
  'transform your journey',
  'AI-powered',
  'lorem ipsum',
  'coming soon',
  'seamless experience',
  'fake urgency',
];

const EXTENSIONS = new Set(['.html', '.js', '.json']);
const SKIP_DIRS = new Set([
  '.agents',
  '.claude',
  '.git',
  '.jamb-tools',
  '.playwright',
  '.cache',
  'afrotools-deploy',
  'audit-results',
  'dist',
  'node_modules',
  'playwright-report',
  'reports',
  'test-results',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
    } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function csv(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function context(line, phrase) {
  const clean = line.replace(/\s+/g, ' ').trim();
  const index = clean.toLowerCase().indexOf(phrase.toLowerCase());
  if (index < 0) return clean.slice(0, 220);
  return clean.slice(Math.max(0, index - 80), index + phrase.length + 100);
}

function main() {
  const rows = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const phrase of PHRASES) {
        const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(line)) {
          rows.push({
            file: rel,
            line: index + 1,
            phrase,
            surface: rel.endsWith('.html') ? 'page' : rel.startsWith('assets/js/components/') ? 'shared-js' : rel.startsWith('scripts/') ? 'generator-script' : 'source',
            context: context(line, phrase),
          });
        }
      }
    });
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, ['file,line,phrase,surface,context'].concat(rows.map(row => [row.file, row.line, row.phrase, row.surface, row.context].map(csv).join(','))).join('\n'));
  const byPhrase = rows.reduce((acc, row) => {
    acc[row.phrase] = (acc[row.phrase] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ output: path.relative(ROOT, OUT), issues: rows.length, phrases: byPhrase }, null, 2));
}

main();
