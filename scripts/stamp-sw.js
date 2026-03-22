#!/usr/bin/env node
/**
 * Stamps service-worker.js with a new CACHE_VERSION based on current timestamp.
 * This forces browsers to purge the old cache on next visit.
 *
 * Run: node scripts/stamp-sw.js
 * Part of: npm run build
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SW_PATH = path.join(__dirname, '..', 'service-worker.js');

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
const version = hash.digest('hex').slice(0, 8);

const sw = fs.readFileSync(SW_PATH, 'utf8');
const updated = sw.replace(
  /const CACHE_VERSION = '[^']+'/,
  `const CACHE_VERSION = '${version}'`
);

if (updated === sw) {
  console.log('  WARN  CACHE_VERSION pattern not found in service-worker.js');
  process.exit(1);
}

fs.writeFileSync(SW_PATH, updated, 'utf8');
console.log(`  SW    CACHE_VERSION stamped: ${version}`);
