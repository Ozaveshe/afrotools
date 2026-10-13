const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const owner = fs.readFileSync(process.env.AFROTOOLS_SW_STAMP_SOURCE || path.join(root, 'scripts/stamp-sw.js'), 'utf8');
const inputs = ['service-worker.js', 'offline.html', 'index.html', 'assets/js/bundles/manifest.json',
  'assets/css/tokens.min.css', 'assets/css/design-system.min.css',
  'assets/js/components/navbar.min.js', 'assets/js/components/footer.min.js', 'data/jamb/pools/index.json'];

function generate(offlineSuffix = '') {
  const files = new Map(inputs.map(file => [path.join(root, file), fs.readFileSync(path.join(root, file), 'utf8')]));
  files.set(path.join(root, 'offline.html'), files.get(path.join(root, 'offline.html')) + offlineSuffix);
  const fakeFs = {
    existsSync: file => files.has(file),
    readFileSync: file => { assert(files.has(file), 'undeclared generator input: ' + file); return files.get(file); }
  };
  vm.runInNewContext(owner, {
    __dirname: path.join(root, 'scripts'), console: { log() {} },
    require(name) {
      if (name === 'fs') return fakeFs;
      if (name === 'path' || name === 'crypto') return require(name);
      if (name === './lib/safe-write') return { writeFileSyncWithRetry(file, content) {
        assert.equal(file, path.join(root, 'service-worker.js'));
        files.set(file, content);
      } };
      throw new Error('Unexpected generator dependency: ' + name);
    }
  }, { filename: 'scripts/stamp-sw.js' });
  return files.get(path.join(root, 'service-worker.js'));
}

const original = generate();
assert.equal(generate(), original, 'identical native inputs must produce the same worker');
const changed = generate('\n<!-- updated offline recovery document -->\n');
const version = source => source.match(/const CACHE_VERSION = '([a-f0-9]{8})'/)[1];
assert.notEqual(version(original), version(changed), 'offline-only changes must invalidate the installed recovery cache');
assert.equal(changed.replace(/const CACHE_VERSION = '[^']+'/, "const CACHE_VERSION = '__STAMP__'"),
  original.replace(/const CACHE_VERSION = '[^']+'/, "const CACHE_VERSION = '__STAMP__'"), 'only the generated version changes');
console.log('service-worker-offline-stamp: deterministic native owner and offline-document cache invalidation passed');
