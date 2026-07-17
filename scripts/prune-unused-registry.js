#!/usr/bin/env node
/**
 * Removes tool-registry script tags from HTML pages that do not actually use
 * the registry directly or via the related-tools component.
 *
 * Run after update-html-bundles.js and before cachebust.js.
 */
const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'scripts', 'netlify', 'dist']);
const REGISTRY_SCRIPT_RE = /\s*<script\b[^>]*src=["'][^"']*tool-registry(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>\s*/gi;
const REGISTRY_USAGE_RE = /AFRO_TOOLS|AFRO_CATEGORIES|getTotalToolCount|onRegistryReady|afrotools:registry-ready|renderToolGrid|getToolsFor|country-tools(?:\.min)?\.js|agriculture-taxonomy-hub\.js|salary-tax-hub\.js|salary-tax-index\.js|tool-search(?:\.min)?\.js/;
const LAZY_REGISTRY_RE = /afrotools:lazy-registry|document\.querySelector\(['"]script\[src\*=["']tool-registry["']\]/;
const RELATED_TOOLS_RE = /related-tools(?:\.min)?\.js|<afro-related-tools\b/i;
const SSR_RELATED_TOOLS_RE = /<afro-related-tools\b[^>]*\bdata-ssr=["']1["']/i;
const REGISTRY_SCRIPT_TAG = '<script src="/assets/js/components/tool-registry.min.js" defer></script>';
const RELATED_DATA_RE = /\s*<script\b[^>]*src=["'][^"']*related-tools-data(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>\s*/gi;
const HEAD_INSERT_RE = /(<script\b[^>]*src=["'][^"']*\/assets\/js\/components\/navbar(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>)/i;
const LIGHTWEIGHT_INDEX_PAGES = new Set([
  'search/index.html',
  'salary-tax/index.html',
]);
function walkHtml(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtml(fullPath));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

const htmlFiles = walkHtml(ROOT);
let updatedCount = 0;
let removedTags = 0;
let replacedTags = 0;
let restoredTags = 0;

function insertBeforeNavbarOrHead(html, scriptTag) {
  if (HEAD_INSERT_RE.test(html)) {
    return html.replace(HEAD_INSERT_RE, `${scriptTag}\n$1`);
  }
  return html.replace('</head>', `${scriptTag}\n</head>`);
}

for (const htmlPath of htmlFiles) {
  const original = fs.readFileSync(htmlPath, 'utf8');
  const relativeHtmlPath = path.relative(ROOT, htmlPath).replace(/\\/g, '/');
  const isLightweightIndexPage = LIGHTWEIGHT_INDEX_PAGES.has(relativeHtmlPath);
  const usesRegistryDirectly = !isLightweightIndexPage && REGISTRY_USAGE_RE.test(original);
  const hasLazyRegistryLoader = LAZY_REGISTRY_RE.test(original);
  const usesRelatedTools = RELATED_TOOLS_RE.test(original);
  const usesSsrRelatedTools = SSR_RELATED_TOOLS_RE.test(original);
  const hasRegistryScript = REGISTRY_SCRIPT_RE.test(original);
  const hasRelatedDataScript = RELATED_DATA_RE.test(original);
  REGISTRY_SCRIPT_RE.lastIndex = 0;
  RELATED_DATA_RE.lastIndex = 0;

  let updated = original;
  let localRemoved = 0;
  let localReplaced = 0;
  let localRestored = 0;

  if (usesRegistryDirectly) {
    if (hasRegistryScript && hasLazyRegistryLoader) {
      updated = updated.replace(REGISTRY_SCRIPT_RE, () => {
        localRemoved += 1;
        return '\n';
      });
    } else if (!hasRegistryScript && !hasLazyRegistryLoader) {
      updated = insertBeforeNavbarOrHead(updated, REGISTRY_SCRIPT_TAG);
      localRestored += 1;
    }
  } else if (hasRegistryScript) {
    updated = updated.replace(REGISTRY_SCRIPT_RE, () => {
      localRemoved += 1;
      return '\n';
    });
  }

  // SSR pages render their small injected slice immediately. Legacy/localized
  // pages let the component fetch this 477 KB dataset near the viewport.
  if (hasRelatedDataScript) {
    updated = updated.replace(RELATED_DATA_RE, '\n');
    RELATED_DATA_RE.lastIndex = 0;
    localRemoved += 1;
  }

  if (updated !== original) {
    writeFileSyncWithRetry(htmlPath, updated, 'utf8');
    updatedCount += 1;
    removedTags += localRemoved;
    replacedTags += localReplaced;
    restoredTags += localRestored;
  }
}

console.log(`  PRUNE   ${updatedCount} HTML files updated, ${removedTags} registry script tags removed`);
if (replacedTags) {
  console.log(`          ${replacedTags} registry script tags swapped to related-tools-data.min.js`);
}
if (restoredTags) {
  console.log(`          ${restoredTags} registry script tags restored for registry-dependent pages`);
}
