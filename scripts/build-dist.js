#!/usr/bin/env node
/**
 * Build the Netlify publish directory from the repo-root static site.
 *
 * AfroTools keeps source pages at the repo root, but the deployed artifact must
 * not include repo internals such as functions, scripts, prompts, migrations,
 * tests, package manifests, or local agent configuration.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const BLOCKED_TOP_LEVEL_DIRS = new Set([
  '.agents',
  '.claude',
  '.codex',
  '.git',
  '.github',
  '.jamb',
  '.jamb-tools',
  '.playwright',
  '.playwright-cli',
  '.tmp-validation',
  'admin',
  'afrotools-sentinel',
  'artifacts',
  'audit-results',
  'dist',
  'docs',
  'lang',
  'netlify',
  'node_modules',
  'ops',
  'output',
  'prompts',
  'reports',
  'scripts',
  'supabase',
  'test-results',
  'tests'
]);

const BLOCKED_ROOT_FILES = new Set([
  '.env',
  '.env.example',
  '.gitattributes',
  '.gitignore',
  '.mcp.json',
  '_audit_inventory.txt',
  '_serve.js',
  'AGENTS.md',
  'afrotools-mission-control.html',
  'AUDIT-FIX-PROMPT.md',
  'AFROCONFLICT_BUILD_PROMPT.md',
  'AFROSTREAM-SESSION-PROMPT.md',
  'CHANGELOG_SEO.md',
  'CONFLICT-DASHBOARD-PROMPT.md',
  'CREATOR-SUITE-EXPANSION.md',
  'deno.lock',
  'PRIORITY_PAGES.md',
  'README.md',
  'SEO_AUDIT.md',
  'SEO_IMPLEMENTATION_PLAN.md',
  'audit-progress.json',
  'daily_seo_check.md',
  'deploy.bat',
  'inject-ga4.ps1',
  'inject-og-tags.js',
  'mc-7a2f9x.html',
  'missing-entries-formatted.txt',
  'missing-entries.json',
  'netlify.toml',
  'package-lock.json',
  'package.json',
  'skills-lock.json'
]);

const BLOCKED_ROOT_EXTENSIONS = new Set([
  '.bat',
  '.csv',
  '.docx',
  '.gz',
  '.js',
  '.log',
  '.md',
  '.pdf',
  '.ps1',
  '.py',
  '.sql',
  '.toml',
  '.yaml',
  '.yml'
]);

const BLOCKED_RELATIVE_FILES = new Set([
  'assets/js/ai/prompt-registry.js',
  'fr/widgets/iframe/template.html',
  'tools/afrostream/admin.html',
  'tools/afroatlas/_country-template.html',
  'widgets/iframe/template.html'
]);

const BLOCKED_RELATIVE_DIRS = new Set([
  'fr/docs',
  'matchday-os',
  'assets/img/matchday',
  'data/matchday-os'
]);

const BLOCKED_RELATIVE_FILE_PATTERNS = [
  /^assets\/css\/matchday-os(?:\.min)?\.css$/i,
  /^assets\/js\/matchday-os(?:\.min)?\.js$/i
];

const ALLOWED_ROOT_FILES = new Set([
  '404.html',
  '_headers',
  '_redirects',
  'favicon.ico',
  'index.html',
  'llms-full.txt',
  'llms.txt',
  'manifest.json',
  'offline.html',
  'privacy-policy.html',
  'robots.txt',
  'service-worker.js',
  'style-guide.html',
  'terms-of-use.html'
]);

function assertInsideWorkspace(target) {
  const relative = path.relative(ROOT, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside workspace: ${target}`);
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function removePathWithRetry(target) {
  const retryable = new Set(['EBUSY', 'ENOTEMPTY', 'EPERM', 'UNKNOWN']);
  let lastError = null;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      fs.rmSync(target, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200
      });
      return;
    } catch (error) {
      lastError = error;
      if (!retryable.has(error.code)) throw error;
      sleep(Math.min(1000, 150 + attempt * 50));
    }
  }

  throw lastError;
}

function clearDistWithRetry() {
  if (!fs.existsSync(DIST)) return;

  for (const entry of fs.readdirSync(DIST)) {
    removePathWithRetry(path.join(DIST, entry));
  }
}

function isHexVerificationFile(fileName) {
  return /^[a-f0-9]{32}\.txt$/i.test(fileName);
}

function isBlockedRootFile(fileName) {
  if (ALLOWED_ROOT_FILES.has(fileName) || isHexVerificationFile(fileName)) return false;
  if (BLOCKED_ROOT_FILES.has(fileName)) return true;
  if (fileName.startsWith('.codex-') || fileName.startsWith('tmp-') || fileName.startsWith('.tmp-')) {
    return true;
  }
  return BLOCKED_ROOT_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function shouldSkipDir(dirName, relativeFromRoot) {
  if (dirName.startsWith('.')) return true;
  const normalizedRelative = relativeFromRoot.replace(/\\/g, '/');
  if (BLOCKED_RELATIVE_DIRS.has(normalizedRelative)) return true;

  const parts = relativeFromRoot.split(path.sep).filter(Boolean);
  return parts.length === 1 && BLOCKED_TOP_LEVEL_DIRS.has(parts[0]);
}

function shouldSkipFile(fileName, relativeFromRoot) {
  const normalizedRelative = relativeFromRoot.replace(/\\/g, '/');
  if (BLOCKED_RELATIVE_FILES.has(normalizedRelative)) return true;
  if (BLOCKED_RELATIVE_FILE_PATTERNS.some((pattern) => pattern.test(normalizedRelative))) return true;

  const parts = relativeFromRoot.split(path.sep).filter(Boolean);
  if (parts.some((part) => part.startsWith('.'))) return true;
  if (parts.length === 1 && isBlockedRootFile(fileName)) return true;
  if (fileName.endsWith('.map') || fileName.endsWith('.log')) return true;
  if (fileName.toLowerCase().endsWith('.md')) return true;
  if (['.ps1', '.py', '.sh', '.sql', '.bat'].includes(path.extname(fileName).toLowerCase())) {
    return true;
  }
  return false;
}

function copyTree(sourceDir, targetDir, counters) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const relative = path.relative(ROOT, sourcePath);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name, relative)) {
        counters.skippedDirs += 1;
        continue;
      }
      fs.mkdirSync(targetPath, { recursive: true });
      copyTree(sourcePath, targetPath, counters);
      continue;
    }

    if (!entry.isFile()) {
      counters.skippedFiles += 1;
      continue;
    }

    if (shouldSkipFile(entry.name, relative)) {
      counters.skippedFiles += 1;
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
    counters.copiedFiles += 1;
  }
}

function verifyDist() {
  const forbidden = [
    'package.json',
    'package-lock.json',
    'AGENTS.md',
    '.env.example',
    '.mcp.json',
    'admin',
    'afrotools-mission-control.html',
    'afrotools-sentinel',
    'artifacts',
    'audit-results',
    'fr/docs',
    'fr/widgets/iframe/template.html',
    'mc-7a2f9x.html',
    'missing-entries-formatted.txt',
    'missing-entries.json',
    'netlify/functions/api-scholarships.js',
    'scripts/check-links.js',
    'supabase/migrations/022-scholarship-platform.sql',
    'docs/ARCHITECTURE.md',
    'tools/afrostream/admin.html',
    'widgets/iframe/template.html'
  ];

  for (const relative of forbidden) {
    const target = path.join(DIST, relative);
    if (fs.existsSync(target)) {
      throw new Error(`Forbidden file copied into dist: ${relative}`);
    }
  }

  const required = ['index.html', '404.html', '_redirects', '_headers', 'assets', 'tools'];
  for (const relative of required) {
    const target = path.join(DIST, relative);
    if (!fs.existsSync(target)) {
      throw new Error(`Required deploy asset missing from dist: ${relative}`);
    }
  }
}

function main() {
  assertInsideWorkspace(DIST);
  clearDistWithRetry();
  fs.mkdirSync(DIST, { recursive: true });

  const counters = { copiedFiles: 0, skippedDirs: 0, skippedFiles: 0 };
  copyTree(ROOT, DIST, counters);
  verifyDist();

  console.log(
    `Built dist: ${counters.copiedFiles} files copied, ` +
      `${counters.skippedDirs} directories skipped, ${counters.skippedFiles} files skipped.`
  );
}

main();
