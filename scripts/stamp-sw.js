#!/usr/bin/env node
/**
 * Stamps service-worker.js with a new CACHE_VERSION based on current timestamp.
 * Also injects bundle paths from manifest.json into the PRECACHE list.
 * This forces browsers to purge the old cache on next visit.
 *
 * Run: node scripts/stamp-sw.js
 * Part of: npm run build
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SW_PATH = path.join(__dirname, '..', 'service-worker.js');
const MANIFEST_PATH = path.join(__dirname, '..', 'assets', 'js', 'bundles', 'manifest.json');

// Build a short hash from timestamp + key file contents
const keyFiles = [
  'assets/css/tokens.min.css',
  'assets/css/design-system.min.css',
  'assets/js/components/navbar.min.js',
  'assets/js/components/footer.min.js',
  'assets/js/components/tool-registry.js',
].map(f => path.join(__dirname, '..', f));

const hash = crypto.createHash('md5');
hash.update(Date.now().toString());
for (const f of keyFiles) {
  if (fs.existsSync(f)) {
    hash.update(fs.readFileSync(f));
  }
}

// Also hash bundle manifest if it exists
if (fs.existsSync(MANIFEST_PATH)) {
  hash.update(fs.readFileSync(MANIFEST_PATH));
}

const version = hash.digest('hex').slice(0, 8);

let sw = fs.readFileSync(SW_PATH, 'utf8');

// 1. Stamp CACHE_VERSION
const stamped = sw.replace(
  /const CACHE_VERSION = '[^']+'/,
  `const CACHE_VERSION = '${version}'`
);

if (stamped === sw) {
  console.log('  WARN  CACHE_VERSION pattern not found in service-worker.js');
  process.exit(1);
}
sw = stamped;

// 2. Inject bundle paths into PRECACHE list (if manifest exists)
if (fs.existsSync(MANIFEST_PATH)) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const bundlePaths = Object.values(manifest)
    .filter(info => info.path) // skip chat bundle from precache (lazy-loaded)
    .map(info => `  '${info.path}'`);

  // Replace the PRECACHE array — inject bundle paths before the closing bracket
  // We add bundle paths as additional entries, keeping existing ones
  const precacheRegex = /(const PRECACHE = \[[\s\S]*?)(];)/;
  const precacheMatch = sw.match(precacheRegex);
  if (precacheMatch) {
    const existingEntries = precacheMatch[1];
    // Remove old bundle entries (from previous builds)
    const cleaned = existingEntries.replace(/\s*'\/assets\/js\/bundles\/[^']*',?\n?/g, '');
    // Add new bundle entries
    const bundleEntries = bundlePaths.map(p => p + ',').join('\n') + '\n';
    sw = sw.replace(precacheRegex, cleaned + bundleEntries + precacheMatch[2]);
  }
}

fs.writeFileSync(SW_PATH, sw, 'utf8');
console.log(`  SW    CACHE_VERSION stamped: ${version}`);
