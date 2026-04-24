#!/usr/bin/env node
/**
 * Verifies that the Netlify publish artifact contains only public site output.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const REQUIRED_PATHS = [
  'index.html',
  '404.html',
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'assets',
  'tools'
];

const FORBIDDEN_PATHS = [
  'package.json',
  'package-lock.json',
  'AGENTS.md',
  '.env',
  '.env.example',
  '.mcp.json',
  '.codex',
  '.agents',
  '.github',
  '.claude',
  'docs',
  'netlify',
  'node_modules',
  'ops',
  'prompts',
  'reports',
  'scripts',
  'supabase',
  'test-results',
  'tests'
];

const FORBIDDEN_FILE_PATTERNS = [
  /^.*\.md$/i,
  /^.*\.ps1$/i,
  /^.*\.py$/i,
  /^.*\.sql$/i,
  /^.*\.toml$/i,
  /^.*\.ya?ml$/i,
  /^.*PROMPT.*$/i,
  /^.*SECRET.*$/i
];

function exists(relativePath) {
  return fs.existsSync(path.join(DIST, relativePath));
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(DIST, full).replace(/\\/g, '/');
    results.push(rel);
    if (entry.isDirectory()) walk(full, results);
  }
  return results;
}

function main() {
  const failures = [];

  if (!fs.existsSync(DIST)) {
    failures.push('dist/ does not exist. Run npm run build:deploy first.');
  } else {
    for (const required of REQUIRED_PATHS) {
      if (!exists(required)) failures.push(`Missing required deploy path: ${required}`);
    }

    for (const forbidden of FORBIDDEN_PATHS) {
      if (exists(forbidden)) failures.push(`Forbidden deploy path present: ${forbidden}`);
    }

    for (const rel of walk(DIST)) {
      const base = path.basename(rel);
      if (base.startsWith('.')) failures.push(`Hidden path present in dist: ${rel}`);
      if (FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(rel))) {
        failures.push(`Forbidden file type/name present in dist: ${rel}`);
      }
    }
  }

  if (failures.length) {
    console.error('Deploy artifact audit failed:');
    failures.slice(0, 80).forEach((failure) => console.error(`  - ${failure}`));
    if (failures.length > 80) console.error(`  ...and ${failures.length - 80} more`);
    process.exit(1);
  }

  console.log('Deploy artifact audit passed.');
}

main();
