'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const { minifyCss, optimizeDistAssets } = require('../scripts/build-dist');

const ROOT = path.resolve(__dirname, '..');

test('deploy CSS preserves descendant pseudo-class selectors', () => {
  const source = '.hub :is(.card, .step) > * { overflow-wrap: anywhere; }\n.hub :not(.hidden) { display: grid; }';
  const deployed = minifyCss(source);
  assert.match(deployed, /\.hub :is\(/);
  assert.match(deployed, /\.hub :not\(/);
  assert.doesNotMatch(deployed, /\.hub:(?:is|not)\(/);
});

test('build assets leave readable sources intact and optimize only deploy copies', async function () {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-source-safe-build-'));
  const sourceRoot = path.join(temporaryRoot, 'source');
  const distRoot = path.join(temporaryRoot, 'dist');
  const javascriptRelative = path.join('assets', 'js', 'pages', 'source-safety-fixture.js');
  const cssRelative = path.join('assets', 'css', 'source-safety-fixture.css');
  const sourceJavaScript = [
    '(function () {',
    '  "use strict";',
    '  function calculate(value) {',
    '    const doubled = Number(value) * 2;',
    '    return { value: doubled, label: "Synthetic deploy fixture" };',
    '  }',
    '  window.SourceSafetyFixture = { calculate: calculate };',
    '})();',
    ''
  ].join('\n');
  const sourceCss = [
    '/* Synthetic deploy fixture */',
    '.source-safety-fixture {',
    '  display: grid;',
    '  grid-template-columns: repeat(2, minmax(0, 1fr));',
    '  gap: 16px;',
    '  color: #17262b;',
    '}',
    ''
  ].join('\n');

  try {
    for (const relative of [javascriptRelative, cssRelative]) {
      fs.mkdirSync(path.dirname(path.join(sourceRoot, relative)), { recursive: true });
      fs.mkdirSync(path.dirname(path.join(distRoot, relative)), { recursive: true });
    }
    fs.writeFileSync(path.join(sourceRoot, javascriptRelative), sourceJavaScript, 'utf8');
    fs.writeFileSync(path.join(sourceRoot, cssRelative), sourceCss, 'utf8');
    fs.copyFileSync(path.join(sourceRoot, javascriptRelative), path.join(distRoot, javascriptRelative));
    fs.copyFileSync(path.join(sourceRoot, cssRelative), path.join(distRoot, cssRelative));

    const sourceJavaScriptBefore = fs.readFileSync(path.join(sourceRoot, javascriptRelative));
    const sourceCssBefore = fs.readFileSync(path.join(sourceRoot, cssRelative));
    const result = await optimizeDistAssets(distRoot);

    assert.deepStrictEqual(
      fs.readFileSync(path.join(sourceRoot, javascriptRelative)),
      sourceJavaScriptBefore,
      'deploy optimization must not rewrite JavaScript source bytes'
    );
    assert.deepStrictEqual(
      fs.readFileSync(path.join(sourceRoot, cssRelative)),
      sourceCssBefore,
      'deploy optimization must not rewrite CSS source bytes'
    );

    const deployedJavaScript = fs.readFileSync(path.join(distRoot, javascriptRelative), 'utf8');
    const deployedCss = fs.readFileSync(path.join(distRoot, cssRelative), 'utf8');
    assert.ok(deployedJavaScript.length < sourceJavaScript.length, 'dist JavaScript should be minified');
    assert.ok(deployedCss.length < sourceCss.length, 'dist CSS should be minified');
    assert.strictEqual(result.jsCount, 1);
    assert.strictEqual(result.cssCount, 1);

    const minifierSource = fs.readFileSync(path.join(ROOT, 'scripts', 'minify.js'), 'utf8');
    assert.doesNotMatch(
      minifierSource,
      /\n\s+writeFileIfChanged\(filePath/,
      'build:assets minifier must not write discovered source paths in place'
    );
    assert.doesNotMatch(
      minifierSource,
      /Minify ALL remaining (?:JS|CSS) files in-place/,
      'the destructive broad in-place passes must not return'
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

const { shouldSkipFile } = require('../scripts/build-dist');
const { isForbiddenFile } = require('../scripts/audit-dist');
const ROOT_MODULE_EXTENSIONS = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts', 'jsx', 'tsx'];
const ROOT_TOOLING_FIXTURE = ROOT_MODULE_EXTENSIONS.flatMap(extension => [
 'playwright.same-origin-frames.config.' + extension,
 'ordinary-tooling.' + extension,
 ('PLAYWRIGHT.CONFIG.' + extension).toUpperCase()
]);
test('root module artifact filter excludes exact leaked config and typed/case variants', () => {
 assert.ok(ROOT_TOOLING_FIXTURE.includes('playwright.same-origin-frames.config.cjs'));
 for (const relative of ROOT_TOOLING_FIXTURE) {
  assert.equal(shouldSkipFile(path.basename(relative), relative.split('/').join(path.sep)), true, relative);
 }
});
test('independent artifact auditor rejects injected root modules without using copy decisions', () => {
 for (const relative of ROOT_TOOLING_FIXTURE) {
  assert.equal(isForbiddenFile(relative), true, relative);
 }
 for (const forbidden of ['package.json', 'assets/private.py', 'data/private.sql', 'private.toml']) {
  assert.equal(isForbiddenFile(forbidden), true, 'retain existing audit guard ' + forbidden);
 }
});
test('root module policy preserves explicit worker and public subdirectory runtimes', () => {
 for (const relative of ['service-worker.js', 'assets/runtime.cjs', 'assets/runtime.mjs', 'assets/worker.js', 'assets/nested/runtime.CJS', 'tools/example/runtime.mjs']) {
  assert.equal(shouldSkipFile(path.basename(relative), relative.split('/').join(path.sep)), false, relative);
  assert.equal(isForbiddenFile(relative), false, relative);
 }
 for (const relative of ['Service-Worker.js', 'service-worker.JS']) {
  assert.equal(shouldSkipFile(relative, relative), true, relative);
  assert.equal(isForbiddenFile(relative), true, relative);
 }
});
test('root module fixture leaves unrelated public pages metadata and assets eligible', () => {
 for (const relative of ['index.html', '404.html', 'robots.txt', 'manifest.json', '_headers', '_redirects', 'assets/app.css', 'assets/icon.webp', 'tools/example/index.html']) {
  assert.equal(shouldSkipFile(path.basename(relative), relative.split('/').join(path.sep)), false, relative);
  assert.equal(isForbiddenFile(relative), false, relative);
 }
});
