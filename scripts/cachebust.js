#!/usr/bin/env node
/**
 * AfroTools Cache Busting Script
 * Appends ?v=CONTENTHASH to local CSS/JS references in all HTML files.
 * Skips bundle files (already content-hashed in filename).
 *
 * Run AFTER minify.js + bundle.js + update-html-bundles.js
 * Usage: node scripts/cachebust.js
 * Part of: npm run build
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.claude',
  '.codex',
  '.netlify',
  '.playwright',
  'artifacts',
  'dist',
  'netlify',
  'output',
  'reports',
  'scripts',
  'test-results',
]);

// Cache file hashes so we don't re-read the same file
const hashCache = new Map();

function getFileHash(filePath) {
  if (hashCache.has(filePath)) return hashCache.get(filePath);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n?/g, '\n');
  const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  hashCache.set(filePath, hash);
  return hash;
}

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtml(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Resolve a src/href path relative to an HTML file
function resolveAssetPath(htmlPath, ref) {
  if (ref.startsWith('/')) {
    // Absolute path from root
    return path.join(ROOT, ref);
  }
  // Relative path from HTML file's directory
  return path.resolve(path.dirname(htmlPath), ref);
}

// Match CSS/JS tags, including stale query strings from earlier cache-bust passes.
const CSS_RE = /(<link\b[^>]*\bhref=["'])([^"']+\.css(?:\?[^"']*)?)(["'][^>]*>)/g;
const JS_RE = /(<script\b[^>]*\bsrc=["'])([^"']+\.js(?:\?[^"']*)?)(["'][^>]*>)/g;
// Match inline string literals pointing to local CSS/JS assets inside HTML scripts
const INLINE_ASSET_RE = /(["'])((?:\/|\.\.?\/)[^"'?\s]+\.(?:css|js))(?:\?v=[a-f0-9]{8})?\1/g;

function bustReferences(html, htmlPath) {
  let changed = false;

  function replacer(match, prefix, ref, suffix) {
    // Skip external URLs
    if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//')) {
      return match;
    }
    // Skip already-hashed bundle files (e.g., core.6b2634cc.min.js)
    if (/\/bundles\/\w+\.[a-f0-9]+\.min\.js/.test(ref)) {
      return match;
    }
    // Strip any existing query string
    const cleanRef = ref.split('?')[0];
    const assetPath = resolveAssetPath(htmlPath, cleanRef);
    const hash = getFileHash(assetPath);
    if (!hash) return match; // file not found, leave as-is

    const replacement = `${prefix}${cleanRef}?v=${hash}${suffix}`;
    if (replacement !== match) changed = true;
    return replacement;
  }

  html = html.replace(CSS_RE, replacer);
  html = html.replace(JS_RE, replacer);
  html = html.replace(INLINE_ASSET_RE, function(match, quote, ref) {
    if (ref.startsWith('//') || ref.startsWith('http://') || ref.startsWith('https://')) {
      return match;
    }
    if (/\/bundles\/\w+\.[a-f0-9]+\.min\.js/.test(ref)) {
      return match;
    }
    const cleanRef = ref.split('?')[0];
    const assetPath = resolveAssetPath(htmlPath, cleanRef);
    const hash = getFileHash(assetPath);
    if (!hash) return match;

    const replacement = `${quote}${cleanRef}?v=${hash}${quote}`;
    if (replacement !== match) changed = true;
    return replacement;
  });

  return { html, changed };
}

// ── Main ──
const htmlFiles = walkHtml(ROOT);
let updatedCount = 0;
let refCount = 0;

for (const htmlPath of htmlFiles) {
  let original;
  try {
    original = fs.readFileSync(htmlPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }

  const { html, changed } = bustReferences(original, htmlPath);

  if (changed) {
    // Count how many refs were busted
    const oldRefs = (original.match(/\?v=[a-f0-9]{8}/g) || []).length;
    const newRefs = (html.match(/\?v=[a-f0-9]{8}/g) || []).length;
    refCount += newRefs;

    writeFileSyncWithRetry(htmlPath, html, 'utf8');
    updatedCount++;
  }
}

console.log(`  CACHE   ${updatedCount} HTML files updated, ${refCount} refs cache-busted, ${hashCache.size} unique assets hashed`);
