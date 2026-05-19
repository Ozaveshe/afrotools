#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, 'data', 'audits', 'public-claim-registry.json');
const SCAN_ROOTS = ['tools', path.join('fr', 'tools'), 'pro', path.join('assets', 'js'), 'data', 'blog', 'government', 'transport'];
const EXTENSIONS = new Set(['.html', '.js', '.json']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'audit-results', 'reports']);
const SKIP_FILES = new Set(['data/audits/public-claim-registry.json']);
const MAX_EXAMPLES = 80;

const CLAIM_PATTERNS = [
  {
    key: 'scholarship_count',
    label: '120+ scholarships',
    pattern: /\b120\+\s+scholarships?\b/gi
  },
  {
    key: 'countries_54',
    label: '54 countries',
    pattern: /\b54\s+countries\b/gi
  },
  {
    key: 'all_african_countries',
    label: 'all African countries',
    pattern: /\ball\s+African\s+countries\b/gi
  },
  {
    key: 'live_data',
    label: 'live data',
    pattern: /\blive\s+data\b/gi
  },
  {
    key: 'real_time',
    label: 'real-time',
    pattern: /\breal[-\s]?time\b/gi
  },
  {
    key: 'ai_advisor',
    label: 'AI advisor',
    pattern: /\bAI\s+advisor\b/gi
  },
  {
    key: 'email_alerts',
    label: 'email alerts',
    pattern: /\bemail\s+alerts?\b/gi
  },
  {
    key: 'sync_account',
    label: 'syncs to your account',
    pattern: /\bsyncs?\s+to\s+your\s+account\b/gi
  },
  {
    key: 'payment_reminders',
    label: 'payment reminders',
    pattern: /\bpayment\s+reminders?\b/gi
  },
  {
    key: 'verified_recipes',
    label: 'verified recipes',
    pattern: /\bverified\s+recipes?\b/gi
  },
  {
    key: 'thousands',
    label: 'thousands',
    pattern: /\bthousands\b/gi
  },
  {
    key: 'fully_automated',
    label: 'fully automated',
    pattern: /\bfully\s+automated\b/gi
  },
  {
    key: 'source_ledger_claims',
    label: 'source-ledger public claims',
    pattern: /\b(\d+\s+linked\s+workflows?|\d+\s+official\s+sources\s+referenced|last\s+source\s+review|official[-\s]?source\s+links?)\b/gi
  }
];

const PLATFORM_MARKERS = [
  /\bafrotools\b/i,
  /\btools?\b/i,
  /\bcalculators?\b/i,
  /\bapi\b/i,
  /\bfeeds?\b/i,
  /\bdashboards?\b/i,
  /\bworkspace\b/i,
  /\bpro\b/i,
  /\bsync\b/i,
  /\balerts?\b/i,
  /\badvisor\b/i,
  /\bpricing\s+data\b/i,
  /\blive\s+data\b/i,
  /\breal[-\s]?time\b/i,
  /\bcoverage\b/i,
  /\bloaded\b/i,
  /\bsource:/i,
  /\bverified\s+recipes?\b/i,
  /\bjoin\s+thousands\b/i,
  /\bthousands\s+of\s+African\s+creat(ors|ives)\b/i,
  /\bmarket\s+research\s+data\s+from\s+thousands\b/i
];

const BLOG_PLATFORM_MARKERS = [
  /\bafrotools\b/i,
  /\bScholarship\s+Finder\b/i,
  /\bAfroKitchen\b/i,
  /\bAfroPayroll\b/i,
  /\bRemittance\s+Comparison\s+Tool\b/i,
  /\bour\s+(tool|calculator|app|platform|flyer\s+maker)\b/i,
  /\bthis\s+(tool|calculator|app|platform)\b/i,
  /\bthe\s+calculator\b/i,
  /href=["']\/tools\//i,
  /\bAI\s+advisor\b/i,
  /\blive\s+data\b/i,
  /\breal[-\s]?time\s+(data|rates?|quotes?|pricing)\b/i
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function escapeRegExp(value) {
  return value.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

const globCache = new Map();

function globToRegExp(glob) {
  const normalized = normalizePath(glob);
  if (globCache.has(normalized)) {
    return globCache.get(normalized);
  }

  const source = `^${escapeRegExp(normalized)
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')}$`;
  const regex = new RegExp(source);
  globCache.set(normalized, regex);
  return regex;
}

function matchesGlob(relativeFile, glob) {
  const normalizedFile = normalizePath(relativeFile);
  const normalizedGlob = normalizePath(glob);
  if (normalizedGlob.endsWith('/**')) {
    const prefix = normalizedGlob.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }
  return globToRegExp(normalizedGlob).test(normalizedFile);
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Missing claim registry: ${path.relative(ROOT, REGISTRY_PATH)}`);
  }

  const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const claims = Array.isArray(parsed) ? parsed : parsed.claims;
  if (!Array.isArray(claims)) {
    throw new Error('public-claim-registry.json must contain a claims array.');
  }

  const requiredFields = [
    'claim_id',
    'pattern',
    'allowed_files',
    'truth_source',
    'current_truth',
    'required_validation',
    'owner_automation',
    'severity'
  ];

  const seen = new Set();
  return claims.map((claim, index) => {
    for (const field of requiredFields) {
      if (!claim[field] || (Array.isArray(claim[field]) && claim[field].length === 0)) {
        throw new Error(`Registry claim at index ${index} is missing ${field}.`);
      }
    }
    if (seen.has(claim.claim_id)) {
      throw new Error(`Duplicate claim_id in registry: ${claim.claim_id}`);
    }
    seen.add(claim.claim_id);
    if (!Array.isArray(claim.allowed_files)) {
      throw new Error(`Registry claim ${claim.claim_id} must use allowed_files as an array.`);
    }
    return {
      ...claim,
      regex: new RegExp(claim.pattern, 'i')
    };
  });
}

function walkFiles(startDir, files = []) {
  if (!fs.existsSync(startDir)) {
    return files;
  }

  for (const entry of fs.readdirSync(startDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walkFiles(path.join(startDir, entry.name), files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const absoluteFile = path.join(startDir, entry.name);
    if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(absoluteFile);
    }
  }
  return files;
}

function collectFiles() {
  const seen = new Set();
  const files = [];
  for (const root of SCAN_ROOTS) {
    for (const file of walkFiles(path.join(ROOT, root))) {
      const relativeFile = normalizePath(path.relative(ROOT, file));
      if (SKIP_FILES.has(relativeFile)) {
        continue;
      }
      if (!seen.has(relativeFile)) {
        seen.add(relativeFile);
        files.push(file);
      }
    }
  }
  return files;
}

function snippet(line) {
  return line.trim().replace(/\s+/g, ' ').slice(0, 220);
}

function contextWindow(line, index, length) {
  const start = Math.max(0, index - 90);
  const end = Math.min(line.length, index + length + 90);
  return line
    .slice(start, end)
    .replace(/(?:https?)?:?\/\/[^\s"']+/gi, ' ')
    .replace(/\bafrotools\.com[^\s"']*/gi, ' ')
    .replace(/\s+/g, ' ');
}

function hasPlatformMarker(line, relativeFile, index, length) {
  const window = contextWindow(line, index, length);
  const markers = relativeFile.startsWith('blog/') ? BLOG_PLATFORM_MARKERS : PLATFORM_MARKERS;
  return markers.some((marker) => marker.test(window));
}

function isGeneralEducationalContext(relativeFile, line, claimKey, matchIndex, matchLength) {
  const inBlog = relativeFile.startsWith('blog/');
  if (inBlog && claimKey === 'thousands' && /\bCanva\b/i.test(contextWindow(line, matchIndex, matchLength))) {
    return true;
  }
  if (inBlog && claimKey === 'thousands' && /\b(hundreds|tens)\s+of\s+thousands\b/i.test(contextWindow(line, matchIndex, matchLength))) {
    return true;
  }
  if (hasPlatformMarker(line, relativeFile, matchIndex, matchLength)) {
    return false;
  }
  if (inBlog) {
    return true;
  }
  return claimKey === 'thousands';
}

function findRegistryMatches(registry, relativeFile, line) {
  return registry.filter((claim) => {
    if (!claim.regex.test(line)) {
      return false;
    }
    return claim.allowed_files.some((glob) => matchesGlob(relativeFile, glob));
  });
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function pushExample(list, item) {
  if (list.length < MAX_EXAMPLES) {
    list.push(item);
  }
}

function formatLocation(example) {
  return `${example.file}:${example.line}`;
}

function printExamples(title, examples) {
  if (examples.length === 0) {
    return;
  }
  console.log(`\n${title}`);
  for (const example of examples) {
    const owner = example.owner ? ` owner=${example.owner}` : '';
    console.log(`- ${formatLocation(example)} [${example.claim}]${owner} ${example.text}`);
  }
}

function printOwnerSummary(title, ownerCounts) {
  if (ownerCounts.size === 0) {
    return;
  }
  console.log(`\n${title}`);
  [...ownerCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([owner, count]) => {
      console.log(`- ${owner}: ${count}`);
    });
}

function audit() {
  const registry = readRegistry();
  const files = collectFiles();
  const failures = [];
  const warnings = [];
  const registeredCounts = new Map();
  const ownerCounts = new Map();
  const warningOwners = new Map();
  let matchCount = 0;
  let suppressedFailures = 0;
  let suppressedWarnings = 0;

  for (const absoluteFile of files) {
    const relativeFile = normalizePath(path.relative(ROOT, absoluteFile));
    const lines = fs.readFileSync(absoluteFile, 'utf8').split(/\r?\n/);

    lines.forEach((line, lineIndex) => {
      for (const claimPattern of CLAIM_PATTERNS) {
        claimPattern.pattern.lastIndex = 0;
        let match;
        while ((match = claimPattern.pattern.exec(line)) !== null) {
          matchCount += 1;
          const registered = findRegistryMatches(registry, relativeFile, line);
          if (registered.length > 0) {
            for (const claim of registered) {
              increment(registeredCounts, claim.claim_id);
              increment(ownerCounts, claim.owner_automation);
            }
            continue;
          }

          const example = {
            file: relativeFile,
            line: lineIndex + 1,
            claim: claimPattern.label,
            text: snippet(line)
          };

          if (isGeneralEducationalContext(relativeFile, line, claimPattern.key, match.index, match[0].length)) {
            example.owner = 'content-review';
            increment(warningOwners, example.owner);
            if (warnings.length < MAX_EXAMPLES) {
              warnings.push(example);
            } else {
              suppressedWarnings += 1;
            }
          } else if (failures.length < MAX_EXAMPLES) {
            failures.push(example);
          } else {
            suppressedFailures += 1;
          }
        }
      }
    });
  }

  console.log('Public claim truth audit');
  console.log(`Scanned files: ${files.length}`);
  console.log(`Detected claim phrases: ${matchCount}`);
  console.log(`Registered claim hits: ${[...registeredCounts.values()].reduce((sum, count) => sum + count, 0)}`);
  console.log(`Warnings: ${warnings.length + suppressedWarnings}`);
  console.log(`Failures: ${failures.length + suppressedFailures}`);

  printOwnerSummary('Registered owner coverage', ownerCounts);
  printOwnerSummary('Warning owner coverage', warningOwners);
  printExamples('Warnings (general educational/article context)', warnings);
  if (suppressedWarnings > 0) {
    console.log(`- Suppressed warning examples: ${suppressedWarnings}`);
  }

  if (failures.length > 0 || suppressedFailures > 0) {
    printExamples('Failures (unregistered measurable public claims)', failures);
    if (suppressedFailures > 0) {
      console.log(`- Suppressed failure examples: ${suppressedFailures}`);
    }
    console.error('\nAudit failed. Register each real public claim in data/audits/public-claim-registry.json or rewrite the copy to a truthful local/preview/source-backed statement.');
    process.exit(1);
  }

  console.log('\nAudit passed. All platform/product measurable claims are registered or downgraded to warnings for article context.');
}

try {
  audit();
} catch (error) {
  console.error(`Public claim audit error: ${error.message}`);
  process.exit(1);
}
