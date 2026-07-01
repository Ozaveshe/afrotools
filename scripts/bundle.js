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
    'assets/js/lib/clarity.js',
    'assets/js/lib/toast.js',
    'assets/js/lib/dark-mode.js',
    'assets/js/lib/a11y.js',
    'assets/js/components/cookie-consent.js',
    'assets/js/components/ai-consent.js',
    'assets/js/ai/prefill-adapters.js',
    'assets/js/ai/prefill-consumer.js',
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

const LEGACY_BUNDLE_ALIASES = {
  core: [
    'core.a778d1f9.min.js',
    'core.8bd20673.min.js',
    'core.6b2634cc.min.js',
    'core.52693c87.min.js',
    'core.009aa1e7.min.js',
    'core.78b8d771.min.js',
  ],
  // Some generated and country-level salary/tax pages still reference these
  // historical tool-page bundle names. Keep them available until a full HTML
  // bundle rewrite has safely moved every route to the current hash.
  'tool-page': [
    'tool-page.4701dd1d.min.js',
    'tool-page.c4ee75a0.min.js',
  ],
  // Current pages lazy-load this historical chat bundle through data-chat-bundle.
  chat: [
    'chat.e57fe38a.min.js',
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
  const aliases = (LEGACY_BUNDLE_ALIASES[name] || []).filter(alias => alias !== outFilename);
  for (const alias of aliases) {
    fs.writeFileSync(path.join(BUNDLES_DIR, alias), concatenated, 'utf8');
  }

  const outSize = Buffer.byteLength(concatenated, 'utf8');
  totalIn += inputSize;
  totalOut += outSize;

  const bundleInfo = {
    file: outFilename,
    hash: hash,
    path: `/assets/js/bundles/${outFilename}`,
    files: files,
    size: outSize,
  };
  if (aliases.length) {
    bundleInfo.aliases = aliases.map(alias => `/assets/js/bundles/${alias}`);
  }
  manifest[name] = bundleInfo;

  const inKB = (inputSize / 1024).toFixed(1);
  const outKB = (outSize / 1024).toFixed(1);
  const aliasNote = aliases.length ? ` (+${aliases.length} aliases)` : '';
  console.log(`  BUNDLE  ${name}: ${files.length} files, ${inKB}KB → ${outKB}KB → ${outFilename}${aliasNote}`);
}

// Write manifest
const manifestPath = path.join(BUNDLES_DIR, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`\n  MANIFEST  ${manifestPath}`);
console.log(`  TOTAL     ${Object.keys(manifest).length} bundles, ${(totalIn / 1024).toFixed(1)}KB input → ${(totalOut / 1024).toFixed(1)}KB output`);
