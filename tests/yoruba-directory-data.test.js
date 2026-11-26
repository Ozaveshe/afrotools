'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const registry = require('../data/registry/canonical-registry.json');
const manifest = require('../data/registry/yoruba-route-manifest.json');
const { buildYorubaDirectoryData } = require('../scripts/lib/yoruba-directory-data');

test('published Yoruba directory labels and alternatives match their sources', () => {
  const generated = buildYorubaDirectoryData(registry.tools, manifest);
  assert.equal(generated, fs.readFileSync(path.join(__dirname, '../assets/js/data/yoruba-directory-data.js'), 'utf8'));
  const context = { window: {} };
  vm.runInNewContext(generated, context);
  const data = context.window.AfroToolsYorubaDirectoryData;
  for (const row of manifest.routes) {
    assert.ok(data[row.route].name && !data[row.route].name.startsWith('/'), row.route);
    assert.ok(data[row.route].category, row.route);
  }
  assert.equal(data['/yo/awon-ise/ere-oko-eja/'].englishAlternative, '/agriculture/fish-farming/nigeria');
  assert.equal(data['/yo/awon-ise/ere-oko-eja/'].category, 'agriculture');
  assert.equal(data['/yo/idibo/'].category, 'government');
});
