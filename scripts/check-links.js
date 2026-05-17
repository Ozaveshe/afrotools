#!/usr/bin/env node
/**
 * AfroTools Broken Link Checker
 * Scans all HTML files for internal links and verifies targets exist on disk.
 * Run: node scripts/check-links.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = ['.claude', 'node_modules', 'afrotools-deploy', '.git', 'dist'];
const LINK_RESOLUTION_CACHE = new Map();

function escapeRegex(value) {
  return value.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

function normalizeRoute(value) {
  if (!value) return '/';
  const clean = value.split(/[?#]/)[0];
  if (clean === '/') return clean;
  return clean.replace(/\/$/, '');
}

function compileRedirectPattern(pattern) {
  const normalized = normalizeRoute(pattern);
  const body = escapeRegex(normalized)
    .replace(/\*/g, '.*')
    .replace(/:([A-Za-z][A-Za-z0-9_]*)/g, '[^/]+');
  return new RegExp(`^${body}/?$`);
}

function addRedirectRule(rules, from, status) {
  if (!from || !from.startsWith('/')) return;
  const code = Number.parseInt(status, 10);
  if (code === 404 || code === 410) return;
  rules.push({ from, re: compileRedirectPattern(from) });
}

function loadRedirectRules() {
  const rules = [];
  const redirectsPath = path.join(ROOT, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const lines = fs.readFileSync(redirectsPath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const [from, , status] = line.split(/\s+/);
      addRedirectRule(rules, from, status);
    }
  }

  const netlifyPath = path.join(ROOT, 'netlify.toml');
  if (fs.existsSync(netlifyPath)) {
    const lines = fs.readFileSync(netlifyPath, 'utf8').split(/\r?\n/);
    let current = null;
    const flush = () => {
      if (current) addRedirectRule(rules, current.from, current.status);
      current = null;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (line === '[[redirects]]') {
        flush();
        current = {};
        continue;
      }
      if (!current) continue;
      const fromMatch = line.match(/^from\s*=\s*"([^"]+)"/);
      if (fromMatch) current.from = fromMatch[1];
      const statusMatch = line.match(/^status\s*=\s*(\d+)/);
      if (statusMatch) current.status = statusMatch[1];
    }
    flush();
  }

  return rules;
}

function findFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

let existingFileSet = new Set();

function existsFileCaseSensitive(targetPath) {
  return existingFileSet.has(path.normalize(path.resolve(targetPath)));
}

function extractLinks(html) {
  const links = [];
  const re = /href=["']([^"'#?]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    // Only internal links
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('data:')) continue;
    links.push(href);
  }
  return links;
}

function resolveLink(href, redirectRules) {
  let target = normalizeRoute(href);
  if (!target.startsWith('/')) return null; // skip relative for now
  if (LINK_RESOLUTION_CACHE.has(target)) return LINK_RESOLUTION_CACHE.get(target);

  // Try: exact file, /index.html, .html
  const tries = [
    path.join(ROOT, target),
    path.join(ROOT, target, 'index.html'),
    path.join(ROOT, target + '.html'),
  ];

  for (const t of tries) {
    if (existsFileCaseSensitive(t)) {
      LINK_RESOLUTION_CACHE.set(target, true);
      return true;
    }
  }
  if (redirectRules.some((rule) => rule.re.test(target))) {
    LINK_RESOLUTION_CACHE.set(target, true);
    return true;
  }
  LINK_RESOLUTION_CACHE.set(target, false);
  return false;
}

// Run
const allFiles = findFiles(ROOT);
const files = allFiles.filter((file) => file.endsWith('.html'));
existingFileSet = new Set(allFiles.map((file) => path.normalize(path.resolve(file))));
const redirectRules = loadRedirectRules();
console.log(`Scanning ${files.length} HTML files...`);
console.log(`Loaded ${redirectRules.length} redirect rules.\n`);

let brokenCount = 0;
let internalLinkCount = 0;
const brokenMap = {};

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const links = extractLinks(html);
  const rel = path.relative(ROOT, file);

  for (const href of links) {
    if (!href.startsWith('/')) continue; // skip relative
    internalLinkCount++;
    const exists = resolveLink(href, redirectRules);
    if (!exists) {
      if (!brokenMap[href]) brokenMap[href] = [];
      brokenMap[href].push(rel);
      brokenCount++;
    }
  }
}

if (brokenCount === 0) {
  console.log('No broken internal links found!');
  console.log(`Checked ${internalLinkCount} internal links across ${files.length} HTML files.`);
} else {
  console.log(`Found ${brokenCount} broken links across ${Object.keys(brokenMap).length} unique targets:\n`);
  const sorted = Object.entries(brokenMap).sort((a, b) => b[1].length - a[1].length);
  for (const [href, sources] of sorted) {
    console.log(`  BROKEN: ${href}`);
    console.log(`    Referenced by ${sources.length} file(s):`);
    sources.slice(0, 5).forEach(s => console.log(`      - ${s}`));
    if (sources.length > 5) console.log(`      ... and ${sources.length - 5} more`);
    console.log();
  }
  console.log(`Checked ${internalLinkCount} internal links across ${files.length} HTML files.`);
}

process.exit(brokenCount > 0 ? 1 : 0);
