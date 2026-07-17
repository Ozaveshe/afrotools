#!/usr/bin/env node
/**
 * AfroTools HTML Bundle Updater
 * Replaces individual <script> tags with bundle references.
 * Reads manifest.json from bundle.js output.
 *
 * Usage: node scripts/update-html-bundles.js
 * Part of: npm run build (after bundle.js)
 */
const fs = require('fs');
const path = require('path');
const { rewriteSharedAssetReferences } = require('./lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'assets', 'js', 'bundles', 'manifest.json');

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('  ERROR  manifest.json not found. Run bundle.js first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const LEGACY_REGISTRY_PATH = '/assets/js/tool-registry.js';
const REGISTRY_PATH = '/assets/js/components/tool-registry.js';
const MINIFIED_REGISTRY_PATH = '/assets/js/components/tool-registry.min.js';
const LIGHTWEIGHT_INDEX_PAGES = new Set([
  'search/index.html',
  'salary-tax/index.html',
]);

// The heavy tool-registry.min.js (~1.25 MB) only needs to load eagerly on pages
// that render tool data (directory / country / category hubs). Everywhere else
// it is loaded lazily on demand: the desktop command palette runs off the small
// nav list, and navbar mobile search injects the registry only when the user
// actually searches (see ensureToolRegistry in navbar.js). So strip the eager
// <script> tag from any page that never touches a registry global — checking
// both inline scripts AND the page-specific external scripts it loads.
const REGISTRY_TAG_RE = /<script\s+[^>]*src=["'][^"']*\/assets\/js\/components\/tool-registry(?:\.min)?\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/g;
// Signals that code consumes the registry (any hit => that code needs it).
// Covers every global tool-registry.js exposes. Safe default is KEEP: we only
// strip when NONE of these appear, so a directory/hub page is never broken.
const REGISTRY_CONSUMER_RE = /\bAFRO_TOOLS\b|\bAFRO_CATEGORIES\b|\bAFRO_COUNTRY_TOOL_COUNTS\b|onRegistryReady|afrotools:registry-ready|renderToolGrid|renderCountry\w*|refreshCountryPulse|bindCountryToolImages|getToolsFor|getToolGridLabels|getCountryHubMeta|sortCountryHubTools|countryHub\w*|getPublicToolStats|getRegistryStats|getTotalToolCount|getToolStatsLocale|formatToolStatValue|getToolCardImagePath|TOOL_CARD_IMAGE_EXTENSIONS|fetchCountryHubJson|toolMatchesCountryGoal|getCountryHubGoal/;
// Global-shell scripts reference registry globals but tolerate a lazily-loaded
// or absent registry (navbar lazy-injects it; related-tools falls back to
// RELATED_TOOLS_DATA; tool-search guards on a missing registry). They must NOT
// count as "requires the eager tag", or nothing would ever be strippable.
const SHELL_SCRIPT_RE = /\/(?:navbar|footer|command-palette|tool-search|related-tools|tool-registry)(?:\.min)?\.js|\/bundles\//;
const registryConsumerFileCache = new Map();
function scriptFileConsumesRegistry(src) {
  const clean = src.split('?')[0];
  if (!clean.startsWith('/assets/js/')) return false;
  if (SHELL_SCRIPT_RE.test(clean)) return false;
  if (registryConsumerFileCache.has(clean)) return registryConsumerFileCache.get(clean);
  let consumes = false;
  try {
    const abs = path.join(ROOT, clean);
    if (fs.existsSync(abs)) consumes = REGISTRY_CONSUMER_RE.test(fs.readFileSync(abs, 'utf8'));
  } catch { /* unreadable → assume not a consumer */ }
  registryConsumerFileCache.set(clean, consumes);
  return consumes;
}
// A page needs the eager registry if its inline HTML uses a registry global, or
// if any page-specific external script it loads does.
function pageNeedsEagerRegistry(htmlWithoutRegistryTag) {
  if (REGISTRY_CONSUMER_RE.test(htmlWithoutRegistryTag)) return true;
  const re = /<script\s+[^>]*src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(htmlWithoutRegistryTag)) !== null) {
    if (scriptFileConsumesRegistry(m[1])) return true;
  }
  return false;
}

function waitSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeFileSyncWithRetry(filePath, data, encoding) {
  const retryable = new Set(['EBUSY', 'EPERM', 'UNKNOWN']);
  let lastError = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      fs.writeFileSync(filePath, data, encoding);
      return;
    } catch (error) {
      lastError = error;
      if (!retryable.has(error.code)) throw error;
      waitSync(75 * (attempt + 1));
    }
  }
  throw lastError;
}

// Build lookup: relative path → bundle name
const fileToBundleMap = {};
for (const [bundleName, info] of Object.entries(manifest)) {
  for (const filePath of info.files) {
    // Normalize to the format used in HTML src attributes: /assets/js/...
    const htmlSrc = '/' + filePath.replace(/\\/g, '/');
    fileToBundleMap[htmlSrc] = bundleName;
  }
}

// Collect all HTML files (recursive)
function walkHtml(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isDirectory()) {
      results.push(...walkHtml(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = walkHtml(ROOT);
let updatedCount = 0;
let scriptCount = 0;

for (const htmlPath of htmlFiles) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const original = html;
  const relativeHtmlPath = path.relative(ROOT, htmlPath).replace(/\\/g, '/');

  // Shared shell assets are always served from their minified counterparts.
  // The helper also refreshes their content hashes, so this remains safe when
  // update-html-bundles.js is run independently of the final cachebust pass.
  html = rewriteSharedAssetReferences(html).html;

  // Keep the registry on the lighter minified build across pages.
  html = html.replaceAll(LEGACY_REGISTRY_PATH, MINIFIED_REGISTRY_PATH);
  html = html.replaceAll(REGISTRY_PATH, MINIFIED_REGISTRY_PATH);

  const htmlWithoutRegistryTag = html.replace(REGISTRY_TAG_RE, '');
  if (LIGHTWEIGHT_INDEX_PAGES.has(relativeHtmlPath) || !pageNeedsEagerRegistry(htmlWithoutRegistryTag)) {
    html = htmlWithoutRegistryTag;
  }

  // Track which bundles we've already injected for this file
  const injectedBundles = new Set();

  // Detect if this is a tool page (for tool-page bundle)
  const isToolPage = /class="[^"]*tool-page[^"]*"/.test(html) || /class='[^']*tool-page[^']*'/.test(html);

  // First pass: replace old bundle tags with current hashed versions
  for (const [bundleName, info] of Object.entries(manifest)) {
    // Match any old bundle reference for this bundle name (any hash)
    const oldBundleRegex = new RegExp(
      `<script\\s+[^>]*src=["'][^"']*/assets/js/bundles/${bundleName}\\.[a-f0-9]+\\.min\\.js(?:\\?[^"']*)?["'][^>]*></script>`,
      'g'
    );
    html = html.replace(oldBundleRegex, `<script src="${info.path}" defer></script>`);
  }

  // Also update data-chat-bundle attribute if present
  if (manifest.chat) {
    html = html.replace(/data-chat-bundle="[^"]*"/, `data-chat-bundle="${manifest.chat.path}"`);
  }

  // Match all <script> tags with src attributes pointing to our assets
  const scriptRegex = /<script\s+[^>]*src=["']([^"']*\/assets\/js\/[^"']*)["'][^>]*><\/script>\s*/g;
  let match;
  const replacements = [];

  while ((match = scriptRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const src = match[1];

    // Skip bundle tags (already handled above)
    if (src.includes('/bundles/')) continue;

    const bundleName = fileToBundleMap[src];

    if (!bundleName) continue; // Not in any bundle, keep as-is

    // Skip tool-page bundle on non-tool pages
    if (bundleName === 'tool-page' && !isToolPage) continue;

    // Skip chat bundle — it's lazy-loaded, not in HTML
    if (bundleName === 'chat') continue;

    if (!injectedBundles.has(bundleName)) {
      // First occurrence of a file from this bundle: replace with bundle tag
      const bundlePath = manifest[bundleName].path;
      const bundleTag = `<script src="${bundlePath}" defer></script>`;
      replacements.push({ original: fullTag, replacement: bundleTag, index: match.index });
      injectedBundles.add(bundleName);
    } else {
      // Subsequent occurrences: remove the tag
      replacements.push({ original: fullTag, replacement: '', index: match.index });
    }
  }

  // Apply replacements in reverse order to preserve indices
  replacements.sort((a, b) => b.index - a.index);
  for (const r of replacements) {
    html = html.slice(0, r.index) + r.replacement + html.slice(r.index + r.original.length);
    scriptCount++;
  }

  // Inject chat bundle path as data attribute on <html> for lazy loading
  if (manifest.chat && !html.includes('data-chat-bundle')) {
    html = html.replace(/<html\b/, `<html data-chat-bundle="${manifest.chat.path}"`);
  }

  if (html !== original) {
    writeFileSyncWithRetry(htmlPath, html, 'utf8');
    updatedCount++;
  }
}

console.log(`  HTML    ${updatedCount} files updated, ${scriptCount} <script> tags replaced with bundles`);
