#!/usr/bin/env node
/**
 * AfroTools Broken Link Checker
 * Scans all HTML files for internal links and verifies targets exist on disk.
 * Run: node scripts/check-links.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = ['.claude', 'node_modules', 'afrotools-deploy', '.git', 'dist', 'test-results', 'playwright-report'];
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
  const names = [];
  const body = normalized.split('/').map((segment) => {
    if (!segment) return '';
    if (segment === '*') {
      names.push('splat');
      return '(.*)';
    }
    if (/^:[A-Za-z][A-Za-z0-9_]*$/.test(segment)) {
      names.push(segment.slice(1));
      return '([^/]+)';
    }
    if (segment.includes('*')) {
      names.push('splat');
      return escapeRegex(segment).replace(/\*/g, '(.*)');
    }
    return escapeRegex(segment);
  }).join('/');
  return { re: new RegExp(`^${body}/?$`), names };
}

function addRedirectRule(rules, from, to, status) {
  if (!from || !to || !from.startsWith('/')) return;
  const code = Number.parseInt(status, 10);
  if (code === 404 || code === 410) return;
  const compiled = compileRedirectPattern(from);
  rules.push({ from, to, status: code, re: compiled.re, names: compiled.names });
}

function loadRedirectRules() {
  const rules = [];
  const redirectsPath = path.join(ROOT, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const lines = fs.readFileSync(redirectsPath, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const [from, to, status] = line.split(/\s+/);
      addRedirectRule(rules, from, to, status);
    }
  }

  const netlifyPath = path.join(ROOT, 'netlify.toml');
  if (fs.existsSync(netlifyPath)) {
    const lines = fs.readFileSync(netlifyPath, 'utf8').split(/\r?\n/);
    let current = null;
    const flush = () => {
      if (current) addRedirectRule(rules, current.from, current.to, current.status);
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
      const toMatch = line.match(/^to\s*=\s*"([^"]+)"/);
      if (toMatch) current.to = toMatch[1];
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
  const re = /<(?:a|area|link)\b[^>]*\bhref=["']([^"'#?]+)/gi;
  const markup = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  let m;
  while ((m = re.exec(markup)) !== null) {
    const href = m[1].trim();
    // Only internal links
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('data:')) continue;
    links.push(href);
  }
  const jsNavRe = /\blocation\.href\s*=\s*["']([^"'#?]+)/g;
  while ((m = jsNavRe.exec(html)) !== null) {
    const href = m[1].trim();
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
  if (redirectRules.some((rule) => redirectTargetExists(rule, target))) {
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

function redirectTargetExists(rule, href) {
  const targetRoute = normalizeRoute(href);
  const match = rule.re.exec(targetRoute);
  if (!match) return false;

  const target = substituteRedirectTarget(rule.to, rule.names, match);
  if (/^(https?:)?\/\//i.test(target)) return true;
  if (/^\/?\.netlify\/functions\//i.test(target)) return true;
  if (/^\/api\//i.test(target)) return true;

  const clean = safeDecodeURIComponent(target.split(/[?#]/)[0]).replace(/^\/+/, '');
  if (!clean) return existsFileCaseSensitive(path.join(ROOT, 'index.html'));
  return [
    path.join(ROOT, clean),
    path.join(ROOT, clean, 'index.html'),
    path.join(ROOT, clean + '.html'),
  ].some(existsFileCaseSensitive);
}

function substituteRedirectTarget(target, names, match) {
  let out = target;
  names.forEach((name, index) => {
    const value = match[index + 1] || '';
    out = out.replace(new RegExp(`:${escapeRegex(name)}\\b`, 'g'), value);
    if (name === 'splat') out = out.replace(/\*/g, value);
  });
  return out;
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (_) {
    return value;
  }
}
