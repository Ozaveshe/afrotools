'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const builder = path.join(root, 'scripts/build-french-energy-parity.js');
const requireBuilder = createRequire(builder);
const {FRENCH_ENERGY_APPS} = requireBuilder('./lib/french-energy-parity-contract');
const english = fs.readFileSync(path.join(root, 'tools/electricity-tariff/index.html'), 'utf8');
const source = fs.readFileSync(builder, 'utf8').replace(/\nmain\(\);\s*$/, '\n');
for (const id of ['electricity-tariff', 'prepaid-meter']) {
  const app = FRENCH_ENERGY_APPS.find(row => row.id === id);
  const outputPath = path.join(root, app.frRoute, 'index.html');
  let generated;
  // Exercise the actual owner post-processing on the source page without writing
  // generated routes or invoking the unrelated full 20-app build.
  const localFs = {...fs,
    readFileSync(file, ...args) {return path.resolve(file) === outputPath ? english : fs.readFileSync(file, ...args);},
    writeFileSync(file, html) {assert.equal(path.resolve(file), outputPath); generated = html;}
  };
  vm.runInNewContext(source + '\npostProcess(selectedApp);', {
    require: name => name === 'fs' ? localFs : requireBuilder(name),
    __dirname: path.dirname(builder), process, console, selectedApp: app
  }, {filename: builder});
  assert.ok(generated.includes('catégories TANESCO D1 domestique à faible consommation et T1 usage général selon la grille publiée par l’EWURA.'), id);
  assert.ok(!generated.includes('and T1 general-use classes'), id);
  console.log(id + ': actual owner output keeps the complete Tanzania sentence in French');
}
