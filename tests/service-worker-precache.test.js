const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'assets', 'js', 'bundles', 'manifest.json'), 'utf8')
);

const precacheMatch = sw.match(/const PRECACHE = \[([\s\S]*?)\n\];/);
assert(precacheMatch, 'service-worker.js should expose a PRECACHE array');
const precache = precacheMatch[1];

function pageScriptUrl(assetPath) {
  const escaped = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = index.match(
    new RegExp(`<script\\b[^>]*\\bsrc=["'](${escaped}\\?v=[a-f0-9]{8})["']`, 'i')
  );
  assert(match, `${assetPath} should have a cachebusted index.html script URL`);
  return match[1];
}

assert(!precache.includes('tool-registry'), 'the heavy tool registry must not be install-precached');
assert(
  precache.includes(pageScriptUrl('/assets/js/components/navbar.min.js')),
  'PRECACHE should use the current navbar cache key from index.html'
);
assert(
  precache.includes(pageScriptUrl('/assets/js/components/footer.min.js')),
  'PRECACHE should use the current footer cache key from index.html'
);

for (const info of Object.values(manifest)) {
  assert(info.path && precache.includes(info.path), `PRECACHE should include live bundle ${info.path}`);
  for (const alias of info.aliases || []) {
    assert(!precache.includes(alias), `PRECACHE should not keep legacy bundle alias ${alias}`);
  }
}

assert(precache.includes('// BUILD-GENERATED PRECACHE START'));
assert(precache.includes('// BUILD-GENERATED PRECACHE END'));

console.log('service-worker-precache: ok');
