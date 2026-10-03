const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { refreshBlocker } = require('../scripts/refresh-import-duty-online-price-evidence');
const root = path.join(__dirname, '..');
const script = path.join(root, 'scripts/refresh-import-duty-online-price-evidence.js');

test('unregistered legacy sources have no collection authority', () => {
  const result = refreshBlocker({ sources: {} });
  assert.equal(result.code, 'CAR_MARKET_LEGACY_REFRESH_DISABLED');
  assert.deepEqual(result.sources.map(source => source.accessStatus), ['unregistered', 'unregistered']);
});

test('source approval alone cannot revive direct publication without listing review', () => {
  for (const status of ['blocked', 'review-needed', 'manual-only', 'automated-approved']) {
    const result = refreshBlocker({ sources: {
      'dubicars-uae': { access_status: status }, 'autochek-ng': { access_status: status }
    } });
    assert.equal(result.code, 'CAR_MARKET_LEGACY_REFRESH_DISABLED');
    assert.match(result.message, /pending listing intake, independent review/);
  }
});

test('invalid registry data fails closed', () => {
  for (const value of [null, {}, { sources: [] }, { sources: 'approved' }]) {
    assert.throws(() => refreshBlocker(value), /Invalid car market source registry/);
  }
});

test('the command performs no network access or price-file IO even with approved fixture sources', () => {
  const reads = [], writes = [], requests = [];
  const module = { exports: {} };
  const context = {
    module, __dirname: path.dirname(script),
    process: { env: { PRICE_MATCH_LIMIT: '100', PRICE_MATCH_CONCURRENCY: '4' } },
    console: { error: message => { context.error = message; } },
    fetch: (...args) => { requests.push(args); throw new Error('Unexpected network'); },
    require(name) {
      if (name === 'node:path') return path;
      assert.equal(name, 'node:fs');
      return {
        readFileSync(file) {
          reads.push(file);
          assert.equal(path.basename(file), 'market-source-registry.json');
          return JSON.stringify({ sources: {
            'dubicars-uae': { access_status: 'automated-approved' },
            'autochek-ng': { access_status: 'automated-approved' }
          } });
        },
        writeFileSync: (...args) => { writes.push(args); throw new Error('Unexpected write'); }
      };
    }
  };
  context.require.main = module;
  vm.runInNewContext(fs.readFileSync(script, 'utf8'), context, { filename: script });
  assert.equal(context.process.exitCode, 1);
  assert.match(context.error, /Legacy direct-to-price refresh is disabled/);
  assert.equal(reads.length, 1);
  assert.equal(requests.length, 0);
  assert.equal(writes.length, 0);
});

test('both npm entry points reach the guard before regeneration', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of ['cars:market:online-prices', 'cars:market:refresh']) {
    assert.equal(pkg.scripts[name].split(' && ')[0], 'node scripts/refresh-import-duty-online-price-evidence.js');
  }
});

test('the actual CLI refuses collection and preserves historical evidence bytes', () => {
  const files = ['import-duty-vehicle-estimates.csv', 'import-duty-online-price-evidence.json',
    'price-intelligence.json', 'source-market-observations.json'];
  const before = files.map(file => fs.readFileSync(path.join(root, 'data/cars', file)));
  const result = spawnSync(process.execPath, [script], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PRICE_MATCH_LIMIT: '1' }, timeout: 5000
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /dubicars\.com: [a-z-]+; autochek\.africa: [a-z-]+/);
  files.forEach((file, index) => assert.deepEqual(fs.readFileSync(path.join(root, 'data/cars', file)), before[index]));
});
