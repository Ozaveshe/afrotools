#!/usr/bin/env node
/**
 * Removes tool-registry script tags from HTML pages that do not actually use
 * the registry directly or via the related-tools component.
 *
 * Run after update-html-bundles.js and before cachebust.js.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'scripts', 'netlify']);
const REGISTRY_SCRIPT_RE = /\s*<script\b[^>]*src=["'][^"']*tool-registry(?:\.min)?\.js(?:\?v=[a-f0-9]{8})?["'][^>]*><\/script>\s*/gi;
const REGISTRY_USAGE_RE = /AFRO_TOOLS|AFRO_CATEGORIES|getTotalToolCount|onRegistryReady|afrotools:registry-ready/;
const RELATED_TOOLS_RE = /related-tools(?:\.min)?\.js|<afro-related-tools\b/i;
const RELATED_DATA_SCRIPT = '<script src="/assets/js/components/related-tools-data.min.js" defer></script>';
const WRITE_RETRY_CODES = new Set(['EPERM', 'EBUSY', 'UNKNOWN']);

function writeFileWithRetry(filePath, content, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return;
    } catch (error) {
      lastError = error;
      if (!WRITE_RETRY_CODES.has(error.code) || attempt === attempts) {
        throw error;
      }

      const delayMs = attempt * 150;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }
  }

  throw lastError;
}

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

for (const htmlPath of htmlFiles) {
  const original = fs.readFileSync(htmlPath, 'utf8');
  if (!REGISTRY_SCRIPT_RE.test(original)) continue;
  REGISTRY_SCRIPT_RE.lastIndex = 0;

  const usesRegistryDirectly = REGISTRY_USAGE_RE.test(original);
  const usesRelatedTools = RELATED_TOOLS_RE.test(original);

  if (usesRegistryDirectly) continue;

  let localRemoved = 0;
  let localReplaced = 0;
  const updated = original.replace(REGISTRY_SCRIPT_RE, () => {
    if (usesRelatedTools) {
      localReplaced += 1;
      return `\n${RELATED_DATA_SCRIPT}\n`;
    }
    localRemoved += 1;
    return '\n';
  });

  if (updated !== original) {
    writeFileWithRetry(htmlPath, updated);
    updatedCount += 1;
    removedTags += localRemoved;
    replacedTags += localReplaced;
  }
}

console.log(`  PRUNE   ${updatedCount} HTML files updated, ${removedTags} registry script tags removed`);
if (replacedTags) {
  console.log(`          ${replacedTags} registry script tags swapped to related-tools-data.min.js`);
}
