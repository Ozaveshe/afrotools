'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const ROOT = path.resolve(__dirname, '..');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-css-bundle-'));
  const definitions = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/js/bundles/manifest.json'), 'utf8'));
  for (const [name, definition] of Object.entries(definitions)) {
    for (const file of definition.files) {
      const target = path.join(root, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, '(function(){ window.syntheticBundle = ' + JSON.stringify(name + ':' + file) + '; })();\n');
    }
  }
  fs.writeFileSync(path.join(root, 'assets/js/lib/dark-mode.js'), '(function(){ const cssUrl = "/assets/css/theme-dark.min.css?v=12345678"; window.syntheticTheme = cssUrl; })();\n');
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.join(ROOT, 'scripts/bundle.js'), path.join(root, 'scripts/bundle.js'));
  fs.mkdirSync(path.join(root, 'assets/js/bundles'));
  fs.writeFileSync(path.join(root, 'assets/js/bundles/core.02ddca36.min.js'), 'window.oldSyntheticBundle = true;\n');
  const run = () => execFileSync(process.execPath, [path.join(root, 'scripts/bundle.js')], { cwd: root, encoding: 'utf8' });
  const manifest = () => JSON.parse(fs.readFileSync(path.join(root, 'assets/js/bundles/manifest.json'), 'utf8'));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved).toLowerCase(), fs.realpathSync(os.tmpdir()).toLowerCase());
    assert.ok(path.basename(resolved).startsWith('afrotools-css-bundle-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { root, run, manifest };
}

test('CSS loader bundle regeneration keeps the prior production core URL reachable', t => {
  const f = fixture(t);
  f.run();
  const manifest = f.manifest();
  assert(manifest.core.aliases.includes('/assets/js/bundles/core.02ddca36.min.js'));
  const current = fs.readFileSync(path.join(f.root, 'assets/js/bundles', manifest.core.file), 'utf8');
  const previousUrl = fs.readFileSync(path.join(f.root, 'assets/js/bundles/core.02ddca36.min.js'), 'utf8');
  assert.equal(previousUrl, current);
  assert(previousUrl.includes('/assets/css/theme-dark.min.css?v=12345678'));
  for (const definition of Object.values(manifest)) assert(fs.existsSync(path.join(f.root, 'assets/js/bundles', definition.file)));
});

test('repeated bundle regeneration preserves the live manifest and prior production URL', t => {
  const f = fixture(t);
  f.run();
  const before = f.manifest();
  const previousUrl = fs.readFileSync(path.join(f.root, 'assets/js/bundles/core.02ddca36.min.js'));
  f.run();
  assert.deepEqual(f.manifest(), before);
  assert.deepEqual(fs.readFileSync(path.join(f.root, 'assets/js/bundles/core.02ddca36.min.js')), previousUrl);
});

test('saved-work rollout retains both immediately preceding production bundle URLs', t => {
  const f = fixture(t);
  const previous = { core: 'core.aeb1b82d.min.js', 'tool-page': 'tool-page.9f8a94f8.min.js' };
  for (let pass = 0; pass < 2; pass += 1) {
    f.run();
    const manifest = f.manifest();
    for (const [name, filename] of Object.entries(previous)) {
      assert(manifest[name].aliases.includes('/assets/js/bundles/' + filename));
      const current = fs.readFileSync(path.join(f.root, 'assets/js/bundles', manifest[name].file));
      const retained = fs.readFileSync(path.join(f.root, 'assets/js/bundles', filename));
      assert.deepEqual(retained, current, 'Retained HTML receives the current compatible ' + name + ' runtime');
    }
  }
});
