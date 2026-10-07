const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('canonical typography CSS self-hosts the supported AfroTools families', () => {
  const css = read('assets/fonts/typography.css');
  assert.match(css, /font-family:\s*'DM Sans'/);
  assert.match(css, /font-weight:\s*100 1000/);
  assert.doesNotMatch(css, /instrument-serif|font-family:\s*'Instrument Serif'/);
  assert.doesNotMatch(css, /fonts\.(?:googleapis|gstatic)\.com/);

  [
    'assets/fonts/dm-sans/dm-sans-latin.woff2',
    'assets/fonts/dm-sans/dm-sans-latin-ext.woff2'
  ].forEach((relativePath) => {
    assert.ok(fs.statSync(path.join(root, relativePath)).size > 10_000, `${relativePath} is unexpectedly small`);
  });
});

test('shared stylesheets and runtime compatibility paths use canonical typography', () => {
  const hash = require('../scripts/lib/asset-content-version').assetContentVersion(root, 'assets/fonts/typography.css');
  const href = `/assets/fonts/typography.css?v=${hash}`;
  ['assets/css/tokens.css', 'assets/css/global.css', 'assets/css/design-system.css', 'assets/css/navbar.css', 'blog/assets/css/blog-typography.css'].forEach((relativePath) => {
    assert(read(relativePath).startsWith(`@import url('${href}');`), `${relativePath} must invalidate the old immutable stylesheet`);
  });

  const lazyFonts = read('assets/js/lazy-fonts.js');
  assert.match(lazyFonts, /\/assets\/fonts\/typography\.css/);
  assert(lazyFonts.includes(href), 'Legacy font delivery must request the current stylesheet version');
  assert.doesNotMatch(lazyFonts, /setTimeout|data-delay|fonts\.googleapis/);

  const navbar = read('assets/js/components/navbar.js');
  assert.match(navbar, /data-afrotools-typography/);
  assert.match(navbar, /\/assets\/fonts\/typography\.css/);
  assert(navbar.includes(href), 'Navigation font delivery must request the current stylesheet version');

  const navbarCss = read('assets/css/navbar.min.css');
  const fontImport = require('css-tree').parse(navbarCss).children.first;
  assert.equal(fontImport.type, 'Atrule');
  assert.equal(fontImport.name, 'import');
  assert.equal(fontImport.prelude.children.size, 1);
  assert.equal(fontImport.prelude.children.first.type, 'Url');
  assert.equal(fontImport.prelude.children.first.value, href,
    'The deployed shadow stylesheet must request the current font policy');
  assert.doesNotMatch(navbarCss, /fonts\.googleapis\.com/);
});

test('shared design-system UI does not request synthetic extra-bold weights', () => {
  const css = read('assets/css/design-system.css');
  assert.doesNotMatch(css, /font-weight:\s*(?:850|900)\s*!important/);
});
