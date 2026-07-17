const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(ROOT, 'audit-results', 'copy-quality.csv');
const WRITE_OUTPUT = !process.argv.includes('--no-write');
const CHECK_MODE = process.argv.includes('--check');

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

const PHRASE_RULES = PHRASES.map(phrase => ({
  phrase,
  regex: new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
}));

const RISKY_PATTERNS = [
  {
    phrase: 'guaranteed',
    regex: /\bguaranteed\b/i,
    guidance: 'Use estimated, subject to provider review, or not guaranteed.',
  },
  {
    phrase: '100% accurate',
    regex: /\b100%\s+accurate\b/i,
    guidance: 'Use planning estimate or based on source-linked data.',
  },
  {
    phrase: "Africa's #1",
    regex: /\bAfrica(?:'|’)?s\s+#1\b/i,
    guidance: 'Use Africa-focused or built for African workflows.',
  },
  {
    phrase: 'fully secure',
    regex: /\bfully\s+secure\b/i,
    guidance: 'Use browser-local where possible or sent only after consent.',
  },
  {
    phrase: 'trusted by millions',
    regex: /\btrusted\s+by\s+millions\b/i,
    guidance: 'Use concrete usage proof only if independently supported.',
  },
  {
    phrase: 'official_without_source_context',
    regex: /\bofficial\b/i,
    guidance: 'Only use official when source metadata, authority context, or official-provider verification is present.',
    allowed: /\bofficial[-\s](source|provider|portal|site|authority|regulator|government|links?|data|document|record|filing|submission|channel|fees?|rates?)\b|\bconfirm with the official\b|\bverify with the official\b|\bcheck official\b|\bofficial\s+provider\b|\bsource metadata\b|\bofficial-source\b/i,
  },
  {
    phrase: 'real-time_without_source_context',
    regex: /\breal[-\s]?time\b/i,
    guidance: 'Use latest available or recent snapshot unless a live source/feed is proven.',
    allowed: /\b(source|feed|endpoint|api|update|freshness|where available|stream|streaming|socket|webhook)\b/i,
  },
  {
    phrase: 'verified_without_source_context',
    regex: /\bverified\b/i,
    guidance: 'Use reviewed, source-linked, moderated, or account-verified as appropriate.',
    allowed: /\b(account|user|dashboard|key|email|source|feed|reviewed|moderated|contributor|submission|identity|auth|login|sign[-\s]?in|source-linked)\b/i,
  },
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
const SKIP_PATH_PARTS = [
  'assets/js/bundles/',
];
const MAX_LINE_LENGTH = 50000;

function shouldScanFile(rel) {
  if (rel.endsWith('.min.js')) return false;
  return !SKIP_PATH_PARTS.some(part => rel.includes(part));
}

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
  const index = clean.toLowerCase().indexOf(String(phrase).toLowerCase());
  if (index < 0) return clean.slice(0, 220);
  return clean.slice(Math.max(0, index - 80), index + String(phrase).length + 100);
}

function surfaceFor(rel) {
  if (rel.endsWith('.html')) return 'page';
  if (rel.startsWith('assets/js/components/')) return 'shared-js';
  if (rel.startsWith('scripts/')) return 'generator-script';
  return 'source';
}

function main() {
  const rows = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (!shouldScanFile(rel)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.length > MAX_LINE_LENGTH) return;
      for (const { phrase, regex } of PHRASE_RULES) {
        if (regex.test(line)) {
          rows.push({
            file: rel,
            line: index + 1,
            phrase,
            severity: 'style',
            surface: surfaceFor(rel),
            context: context(line, phrase),
            guidance: 'Prefer direct, practical wording.',
          });
        }
      }
      for (const pattern of RISKY_PATTERNS) {
        if (!pattern.regex.test(line)) continue;
        if (pattern.allowed && pattern.allowed.test(line)) continue;
        rows.push({
          file: rel,
          line: index + 1,
          phrase: pattern.phrase,
          severity: 'claim-risk',
          surface: surfaceFor(rel),
          context: context(line, pattern.phrase.replace(/_.+$/, '')),
          guidance: pattern.guidance,
        });
      }
    });
  }
  if (WRITE_OUTPUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, ['file,line,phrase,severity,surface,context,guidance'].concat(rows.map(row => [row.file, row.line, row.phrase, row.severity, row.surface, row.context, row.guidance].map(csv).join(','))).join('\n'));
  }
  const byPhrase = rows.reduce((acc, row) => {
    acc[row.phrase] = (acc[row.phrase] || 0) + 1;
    return acc;
  }, {});
  const bySeverity = rows.reduce((acc, row) => {
    acc[row.severity] = (acc[row.severity] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({ output: WRITE_OUTPUT ? path.relative(ROOT, OUT) : null, issues: rows.length, severities: bySeverity, phrases: byPhrase }, null, 2));
  if (CHECK_MODE && rows.some(row => row.severity === 'claim-risk')) {
    process.exitCode = 1;
  }
}

main();
