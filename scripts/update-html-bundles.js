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
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
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

  // Keep the registry on the lighter minified build across pages.
  html = html.replaceAll(LEGACY_REGISTRY_PATH, MINIFIED_REGISTRY_PATH);
  html = html.replaceAll(REGISTRY_PATH, MINIFIED_REGISTRY_PATH);

  // Track which bundles we've already injected for this file
  const injectedBundles = new Set();

  // Detect if this is a tool page (for tool-page bundle)
  const isToolPage = /class="[^"]*tool-page[^"]*"/.test(html) || /class='[^']*tool-page[^']*'/.test(html);

  // First pass: replace old bundle tags with current hashed versions
  for (const [bundleName, info] of Object.entries(manifest)) {
    // Match any old bundle reference for this bundle name (any hash)
    const oldBundleRegex = new RegExp(
      `<script\\s+[^>]*src=["']/assets/js/bundles/${bundleName}\\.[a-f0-9]+\\.min\\.js["'][^>]*></script>`,
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
    fs.writeFileSync(htmlPath, html, 'utf8');
    updatedCount++;
  }
}

console.log(`  HTML    ${updatedCount} files updated, ${scriptCount} <script> tags replaced with bundles`);
