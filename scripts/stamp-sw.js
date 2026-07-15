#!/usr/bin/env node
/**
 * Stamps service-worker.js with a deterministic CACHE_VERSION and injects the
 * cachebusted shell scripts plus live bundle paths into its generated PRECACHE
 * block. Run after cachebust.js and bundle.js.
 *
 * Run: node scripts/stamp-sw.js
 * Part of: npm run build
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.join(__dirname, '..');
const SW_PATH = path.join(ROOT, 'service-worker.js');
const INDEX_PATH = path.join(ROOT, 'index.html');
const MANIFEST_PATH = path.join(ROOT, 'assets', 'js', 'bundles', 'manifest.json');
const PRECACHE_START = '  // BUILD-GENERATED PRECACHE START';
const PRECACHE_END = '  // BUILD-GENERATED PRECACHE END';

const keyFiles = [
  'assets/css/tokens.min.css',
  'assets/css/design-system.min.css',
  'assets/js/components/navbar.min.js',
  'assets/js/components/footer.min.js',
].map(file => path.join(ROOT, file));

function readNormalizedText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readCachebustedScriptUrl(assetPath) {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error('index.html not found; run cachebust.js before stamp-sw.js');
  }
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const pattern = new RegExp(
    `<script\\b[^>]*\\bsrc=["'](${escapeRegExp(assetPath)}\\?v=[a-f0-9]{8})["']`,
    'i'
  );
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`Cachebusted ${assetPath} reference not found in index.html`);
  }
  return match[1];
}

function readLiveBundlePaths() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('Bundle manifest not found; run bundle.js before stamp-sw.js');
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const paths = Object.values(manifest).map(info => info && info.path).filter(Boolean);
  if (paths.length === 0) {
    throw new Error('Bundle manifest contains no live bundle paths');
  }
  return paths;
}

function injectGeneratedPrecache(sw, urls) {
  const pattern = new RegExp(
    `${escapeRegExp(PRECACHE_START)}[\\s\\S]*?${escapeRegExp(PRECACHE_END)}`
  );
  if (!pattern.test(sw)) {
    throw new Error('Build-generated PRECACHE markers not found in service-worker.js');
  }
  const entries = Array.from(new Set(urls)).map(url => `  '${url}',`);
  return sw.replace(pattern, [PRECACHE_START, ...entries, PRECACHE_END].join('\n'));
}

let sw = fs.readFileSync(SW_PATH, 'utf8');
const generatedPrecacheUrls = [
  readCachebustedScriptUrl('/assets/js/components/navbar.min.js'),
  readCachebustedScriptUrl('/assets/js/components/footer.min.js'),
  ...readLiveBundlePaths(),
];
sw = injectGeneratedPrecache(sw, generatedPrecacheUrls);

const cacheVersionPattern = /const\s+CACHE_VERSION\s*=\s*['"][^'"]+['"]/;
if (!cacheVersionPattern.test(sw)) {
  throw new Error('CACHE_VERSION pattern not found in service-worker.js');
}

const hash = crypto.createHash('md5');
for (const filePath of keyFiles) {
  if (fs.existsSync(filePath)) {
    hash.update(readNormalizedText(filePath));
  }
}
hash.update(readNormalizedText(MANIFEST_PATH));
hash.update(sw.replace(cacheVersionPattern, "const CACHE_VERSION = '__BUILD_STAMP__'"));

const version = hash.digest('hex').slice(0, 8);
sw = sw.replace(cacheVersionPattern, `const CACHE_VERSION = '${version}'`);

writeFileSyncWithRetry(SW_PATH, sw, 'utf8');
console.log(`  SW    PRECACHE generated: ${generatedPrecacheUrls.length} current asset URLs`);
console.log(`  SW    CACHE_VERSION stamped: ${version}`);
