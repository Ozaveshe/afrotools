#!/usr/bin/env node
/**
 * AfroTools Bundle Script
 * Concatenates minified JS files into optimized bundles with content hashing.
 * Run AFTER minify.js (reads already-minified files).
 *
 * Usage: node scripts/bundle.js
 * Part of: npm run build
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const BUNDLES_DIR = path.join(ROOT, 'assets', 'js', 'bundles');

// ── Bundle definitions: name → ordered file list ──
// Order matters for dependency resolution. Each IIFE is self-contained,
// but some modules reference others (e.g., analytics checks AfroTools.store).
const BUNDLE_DEFS = {
  core: [
    'assets/js/lib/storage.js',
    'assets/js/lib/formatters.js',
    'assets/js/lib/currency.js',
    'assets/js/lib/validators.js',
    'assets/js/lib/error-boundary.js',
    'assets/js/lib/analytics.js',
    'assets/js/lib/toast.js',
    'assets/js/lib/dark-mode.js',
    'assets/js/lib/a11y.js',
    'assets/js/components/cookie-consent.js',
  ],
  'tool-page': [
    'assets/js/lib/save-state.js',
    'assets/js/lib/calculate-animation.js',
    'assets/js/lib/share-state.js',
    'assets/js/lib/pdf-template.js',
    'assets/js/lib/interactions.js',
    'assets/js/lib/auto-email-gate.js',
    'assets/js/lib/saved-tools.js',
    'assets/js/lib/paye-save.js',
  ],
  chat: [
    'assets/js/components/chat-panel.js',
    'assets/js/components/site-assistant.js',
  ],
};

// Ensure bundles directory exists
if (!fs.existsSync(BUNDLES_DIR)) {
  fs.mkdirSync(BUNDLES_DIR, { recursive: true });
}

// Clean old bundles
const oldFiles = fs.readdirSync(BUNDLES_DIR).filter(f => f.endsWith('.min.js'));
for (const f of oldFiles) {
  fs.unlinkSync(path.join(BUNDLES_DIR, f));
}

const manifest = {};
let totalIn = 0;
let totalOut = 0;

function normalizeText(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

for (const [name, files] of Object.entries(BUNDLE_DEFS)) {
  const parts = [];
  let inputSize = 0;
  let missing = [];

  for (const relPath of files) {
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) {
      missing.push(relPath);
      continue;
    }
    let content = normalizeText(fs.readFileSync(absPath, 'utf8'));
    // Strip ES module export statements — bundles load as regular scripts, not modules
    content = content.replace(/;\s*export\s*\{[^}]*\}\s*;?/g, ';');
    content = content.replace(/export\s*\{[^}]*\}\s*;?/g, '');
    inputSize += Buffer.byteLength(content, 'utf8');
    parts.push(content);
  }

  if (missing.length) {
    console.warn(`  WARN  ${name}: missing files: ${missing.join(', ')}`);
  }

  if (parts.length === 0) {
    console.warn(`  SKIP  ${name}: no files found`);
    continue;
  }

  // Concatenate with semicolons to be safe (each IIFE ends with semicolons but just in case)
  const concatenated = parts.join(';\n');

  // Generate content hash
  const hash = crypto.createHash('md5').update(concatenated).digest('hex').slice(0, 8);
  const outFilename = `${name}.${hash}.min.js`;
  const outPath = path.join(BUNDLES_DIR, outFilename);

  fs.writeFileSync(outPath, concatenated, 'utf8');

  const outSize = Buffer.byteLength(concatenated, 'utf8');
  totalIn += inputSize;
  totalOut += outSize;

  manifest[name] = {
    file: outFilename,
    hash: hash,
    path: `/assets/js/bundles/${outFilename}`,
    files: files,
    size: outSize,
  };

  const inKB = (inputSize / 1024).toFixed(1);
  const outKB = (outSize / 1024).toFixed(1);
  console.log(`  BUNDLE  ${name}: ${files.length} files, ${inKB}KB → ${outKB}KB → ${outFilename}`);
}

// Write manifest
const manifestPath = path.join(BUNDLES_DIR, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`\n  MANIFEST  ${manifestPath}`);
console.log(`  TOTAL     ${Object.keys(manifest).length} bundles, ${(totalIn / 1024).toFixed(1)}KB input → ${(totalOut / 1024).toFixed(1)}KB output`);
