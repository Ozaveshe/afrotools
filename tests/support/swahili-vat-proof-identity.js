const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function assertProcessIdentity(options) {
  const actualRoot = fs.realpathSync(ROOT);
  const expectedRoot = fs.realpathSync(process.env.AFROTOOLS_SW_VAT_SERVER_ROOT || '');
  assert.notEqual(Number(process.env.PORT), 4173, 'VAT proof must not use default port 4173');
  assert.equal(process.env.CI, '1', 'VAT proof requires CI=1 so Playwright cannot reuse a server');
  assert.equal(actualRoot.toLowerCase(), expectedRoot.toLowerCase(), 'VAT proof server root');
  assert.equal(git('rev-parse', 'HEAD'), process.env.AFROTOOLS_SW_VAT_EXPECTED_COMMIT, 'VAT proof commit');
  assert.equal(git('rev-parse', 'HEAD^{tree}'), process.env.AFROTOOLS_SW_VAT_EXPECTED_TREE, 'VAT proof tree');
  const proofDirty = git('status', '--porcelain', '--untracked-files=all')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.endsWith(' test-results/.last-run.json'));
  assert.deepEqual(proofDirty, [], 'VAT proof requires a clean product tree');
  assert.equal(process.env.AFROTOOLS_SW_VAT_ROOT_IDENTITY, options.rootIdentity, 'VAT proof root label');
  assert.equal(sha256(options.fixturePath), options.fixtureSha256, 'VAT proof fixture SHA');
  assert.equal(process.env[options.fixtureEnv], options.fixtureSha256, `${options.fixtureEnv} binding`);
}

function assertResponseIdentity(response) {
  assert.ok(response, 'VAT proof navigation must return a response');
  const headers = response.headers();
  assert.equal(headers['x-afrotools-proof-commit'], process.env.AFROTOOLS_SW_VAT_EXPECTED_COMMIT);
  assert.equal(headers['x-afrotools-proof-tree'], process.env.AFROTOOLS_SW_VAT_EXPECTED_TREE);
  assert.equal(path.resolve(headers['x-afrotools-proof-root']).toLowerCase(), fs.realpathSync(ROOT).toLowerCase());
  assert.equal(headers['x-afrotools-proof-identity'], process.env.AFROTOOLS_SW_VAT_ROOT_IDENTITY);
}

module.exports = { ROOT, assertProcessIdentity, assertResponseIdentity, sha256 };
