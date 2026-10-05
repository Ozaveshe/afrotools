'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { minifyCss } = require('../scripts/build-dist');
const { buildStylesheetLoaderVersions } = require('../scripts/lib/css-loader-versions');
const { assetContentVersion, rewriteRelativeStylesheet } = require('../scripts/lib/asset-content-version');
const ROOT = path.resolve(__dirname, '..');
const hash = value => crypto.createHash('md5').update(value.replace(/\r\n?/g, '\n')).digest('hex').slice(0, 8);
const css = '/* Synthetic cache fixture */\n.fixture { width: calc(100% + 8px); color: #17262b; padding: 12px; display: grid; }\n';

function fixture(t, relative = 'assets/css/cache-fixture.css', source = css) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-css-cache-'));
  for (const file of ['scripts/cachebust.js', 'scripts/build-dist.js', 'scripts/lib/asset-content-version.js', 'scripts/lib/css-minification.js', 'scripts/lib/safe-write.js', 'assets/js/lib/product-health.js']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), path.join(root, file));
  }
  const modules = path.join(root, 'node_modules');
  fs.symlinkSync(path.join(ROOT, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
  const asset = path.join(root, relative);
  fs.mkdirSync(path.dirname(asset), { recursive: true });
  fs.writeFileSync(asset, source);
  const html = path.join(root, 'index.html');
  fs.writeFileSync(html, '<link rel="stylesheet" href="/' + relative + '?v=00000000"><script>const cssPath = "/' + relative + '?v=00000000";</script>');
  const run = () => execFileSync(process.execPath, [path.join(root, 'scripts/cachebust.js')], { cwd: root, encoding: 'utf8' });
  const versions = () => [...fs.readFileSync(html, 'utf8').matchAll(/\?v=([a-f0-9]{8})/g)].map(match => match[1]);
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved).toLowerCase(), fs.realpathSync(os.tmpdir()).toLowerCase());
    assert.ok(path.basename(resolved).startsWith('afrotools-css-cache-'));
    assert(fs.lstatSync(modules).isSymbolicLink());
    fs.unlinkSync(modules);
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return { root, asset, html, run, versions };
}

test('CSS cache owner versions both HTML and inline URLs from deployed CSS, not readable input', t => {
  const f = fixture(t);
  const deployedVersion = hash(minifyCss(css));
  assert.notEqual(hash(css), deployedVersion, 'the old readable hash must expose the deployment boundary');
  f.run();
  assert.deepEqual(f.versions(), [deployedVersion, deployedVersion]);
  assert.equal(fs.readFileSync(f.asset, 'utf8'), css);
});

for (const [name, relative, source] of [
  ['paired readable CSS', 'assets/css/global.css', css],
  ['already minified CSS', 'assets/css/cache-fixture.min.css', css],
  ['CSS below the deploy threshold', 'assets/css/cache-fixture.css', '.fixture { color: red; }']
]) {
  test('CSS cache owner preserves the existing version rule for ' + name, t => {
    const f = fixture(t, relative, source);
    f.run();
    assert.deepEqual(f.versions(), [hash(source), hash(source)]);
  });
}

test('deploy CSS cache versions are idempotent and change after a source edit', t => {
  const f = fixture(t);
  f.run();
  const initial = fs.readFileSync(f.html);
  f.run();
  assert.deepEqual(fs.readFileSync(f.html), initial);
  fs.writeFileSync(f.asset, css.replace('#17262b', '#ff0000'));
  f.run();
  assert.notDeepEqual(fs.readFileSync(f.html), initial);
  assert.deepEqual(f.versions(), [hash(minifyCss(css.replace('#17262b', '#ff0000'))), hash(minifyCss(css.replace('#17262b', '#ff0000')))]);
});

test('cache busting updates served pages without changing localization sources or test fixtures', t => {
  const f = fixture(t);
  const frozen = '<link rel="stylesheet" href="/assets/css/cache-fixture.css?v=00000000">';
  const protectedPaths = ['data/localization/fr-fintech-banking-pages/synthetic.html', 'tests/fixtures/synthetic.html'];
  for (const relative of protectedPaths) {
    const file = path.join(f.root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, frozen);
  }
  const publicPage = path.join(f.root, 'fr/tools/synthetic/index.html');
  fs.mkdirSync(path.dirname(publicPage), { recursive: true });
  fs.writeFileSync(publicPage, frozen);
  f.run();
  assert.deepEqual(f.versions(), [hash(minifyCss(css)), hash(minifyCss(css))]);
  assert.equal(fs.readFileSync(publicPage, 'utf8'), frozen.replace('00000000', hash(minifyCss(css))));
  for (const relative of protectedPaths) assert.equal(fs.readFileSync(path.join(f.root, relative), 'utf8'), frozen, relative);
  f.run();
  for (const relative of protectedPaths) assert.equal(fs.readFileSync(path.join(f.root, relative), 'utf8'), frozen, relative);
});

test('Windows line endings do not spuriously change deploy CSS cache versions', t => {
  const f = fixture(t);
  f.run();
  const initial = f.versions();
  fs.writeFileSync(f.asset, css.replace(/\n/g, '\r\n'));
  f.run();
  assert.deepEqual(f.versions(), initial);
});

test('shared cache version owner preserves JavaScript source hashing', t => {
  const js = 'window.syntheticFixture = { ready: true, message: "A sufficiently long readable script; source bytes remain the JavaScript cache contract." };\n';
  const f = fixture(t, 'assets/js/cache-fixture.js', js);
  fs.writeFileSync(f.html, '<script src="/assets/js/cache-fixture.js?v=00000000"></script><script>const scriptPath = "/assets/js/cache-fixture.js?v=00000000";</script>');
  f.run();
  assert.deepEqual(f.versions(), [hash(js), hash(js)]);
  assert.equal(assetContentVersion(f.root, 'assets/js/cache-fixture.js'), hash(js));
});

test('localized relative stylesheet rewriting tracks delivered bytes and rejects source drift', t => {
  const asset = 'tools/creator-fixture/style.css';
  const f = fixture(t, asset);
  const source = '<link rel="stylesheet" href="style.css?v=00000000">';
  const output = rewriteRelativeStylesheet(source, f.root, asset);
  assert.equal(output, '<link rel="stylesheet" href="/' + asset + '?v=' + hash(minifyCss(css)) + '">');
  assert.equal(rewriteRelativeStylesheet(source.replace('00000000', '11111111'), f.root, asset), output);
  fs.writeFileSync(f.asset, css.replace('#17262b', '#ff0000'));
  assert.notEqual(rewriteRelativeStylesheet(source, f.root, asset), output);
  for (const invalid of [source + source, source.replace('style.css', 'other.css'),
    source.replace('?v=', '?preview=1&v='), source.replace('00000000', '000000000')]) {
    assert.throws(() => rewriteRelativeStylesheet(invalid, f.root, asset), /Expected one versioned relative stylesheet/);
  }
});

test('canonical typography URLs in shared CSS and dynamic loaders version deployed font CSS', t => {
  const f = fixture(t);
  fs.copyFileSync(path.join(ROOT, 'scripts/build-ui-typography.js'), path.join(f.root, 'scripts/build-ui-typography.js'));
  const fontPath = path.join(f.root, 'assets/fonts/typography.css');
  fs.mkdirSync(path.dirname(fontPath), { recursive: true });
  fs.writeFileSync(fontPath, css);
  const references = ['assets/css/tokens.css', 'assets/css/global.css', 'assets/css/design-system.css', 'assets/css/navbar.css', 'blog/assets/css/blog-typography.css', 'assets/js/lazy-fonts.js', 'assets/js/components/navbar.js'];
  for (const relative of references) {
    const file = path.join(f.root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '/* Synthetic reference /assets/fonts/typography.css?v=00000000 */\n');
  }
  const run = () => execFileSync(process.execPath, [path.join(f.root, 'scripts/build-ui-typography.js')], { cwd: f.root, encoding: 'utf8' });
  run();
  const expected = '/assets/fonts/typography.css?v=' + hash(minifyCss(css));
  for (const relative of references) assert(fs.readFileSync(path.join(f.root, relative), 'utf8').includes(expected));
  assert.equal(fs.readFileSync(fontPath, 'utf8'), css);
  const before = references.map(relative => fs.readFileSync(path.join(f.root, relative), 'utf8'));
  run();
  assert.deepEqual(references.map(relative => fs.readFileSync(path.join(f.root, relative), 'utf8')), before);
});

function loaderFixture(t) {
  const f = fixture(t);
  const rows = [
    ['assets/js/lib/dark-mode.js', 'assets/css/theme-dark.min.css'],
    ['assets/js/pages/government-focus.js', 'assets/css/government-focus.css']
  ];
  for (const [loader, asset] of rows) {
    fs.mkdirSync(path.dirname(path.join(f.root, loader)), { recursive: true });
    fs.writeFileSync(path.join(f.root, asset), css);
    fs.writeFileSync(path.join(f.root, loader), 'const cssUrl = "/' + asset + '?v=00000000"; window.syntheticLoader = { active: true };\n');
  }
  return { ...f, rows };
}

test('standalone theme and government CSS loaders version deployed assets without changing runtime logic', t => {
  const f = loaderFixture(t);
  const before = f.rows.map(([loader]) => fs.readFileSync(path.join(f.root, loader), 'utf8'));
  const result = buildStylesheetLoaderVersions(f.root);
  assert.equal(result.changed, 2);
  for (const [index, [loader, asset]] of f.rows.entries()) {
    const version = hash(asset.endsWith('.min.css') ? css : minifyCss(css));
    const output = fs.readFileSync(path.join(f.root, loader), 'utf8');
    assert(output.includes('/' + asset + '?v=' + version));
    assert.equal(output.replace(/\?v=[a-f0-9]{8}/g, '?v=00000000'), before[index]);
    assert.equal(fs.readFileSync(path.join(f.root, asset), 'utf8'), css);
  }
  assert.equal(buildStylesheetLoaderVersions(f.root).changed, 0);
});

test('a missing standalone CSS loader reference fails before either runtime source is rewritten', t => {
  const f = loaderFixture(t);
  const darkPath = path.join(f.root, f.rows[0][0]);
  const governmentPath = path.join(f.root, f.rows[1][0]);
  fs.writeFileSync(governmentPath, 'window.syntheticLoader = { active: true };\n');
  const before = fs.readFileSync(darkPath);
  assert.throws(() => buildStylesheetLoaderVersions(f.root), /Expected one versioned CSS reference/);
  assert.deepEqual(fs.readFileSync(darkPath), before);
});


test('deploy walker excludes French compiler templates while retaining public tools and runtime JSON', t => {
  const f = fixture(t);
  const files = {
    '404.html': '<h1>Missing</h1>',
    '_redirects': '/old /new 301',
    '_headers': '/*\n  X-Content-Type-Options: nosniff',
    'tools/synthetic/index.html': '<h1>English tool</h1>',
    'fr/tools/synthetic/index.html': '<h1>French tool</h1>',
    'data/rates/synthetic.json': '{"rate":1}',
    'data/localization/runtime-labels.json': '{"label":"synthetic"}'
  };
  for (let i = 0; i < 31; i++) files['data/localization/fr-fintech-banking-pages/template-' + i + '.html'] = '<h1>Compiler input</h1>';
  for (const [relative, bytes] of Object.entries(files)) {
    const file = path.join(f.root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
  }
  execFileSync(process.execPath, [path.join(f.root, 'scripts/build-dist.js')], { cwd: f.root, encoding: 'utf8', env: { ...process.env, NETLIFY: 'false', CONTEXT: 'local', COMMIT_REF: '' } });
  assert.equal(fs.existsSync(path.join(f.root, 'dist/data/localization/fr-fintech-banking-pages')), false, 'compiler inputs must stay out of the publish artifact');
  for (const relative of ['tools/synthetic/index.html', 'fr/tools/synthetic/index.html', 'data/rates/synthetic.json', 'data/localization/runtime-labels.json']) {
    assert.equal(fs.readFileSync(path.join(f.root, 'dist', relative), 'utf8'), files[relative], relative);
  }
  for (let i = 0; i < 31; i++) assert.equal(fs.readFileSync(path.join(f.root, 'data/localization/fr-fintech-banking-pages/template-' + i + '.html'), 'utf8'), '<h1>Compiler input</h1>');
});
