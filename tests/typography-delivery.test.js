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
  assert.match(css, /font-family:\s*'Instrument Serif'/);
  assert.doesNotMatch(css, /fonts\.(?:googleapis|gstatic)\.com/);

  [
    'assets/fonts/dm-sans/dm-sans-latin.woff2',
    'assets/fonts/dm-sans/dm-sans-latin-ext.woff2',
    'assets/fonts/instrument-serif/instrument-serif-latin.woff2',
    'assets/fonts/instrument-serif/instrument-serif-latin-ext.woff2',
    'assets/fonts/instrument-serif/instrument-serif-italic-latin.woff2',
    'assets/fonts/instrument-serif/instrument-serif-italic-latin-ext.woff2'
  ].forEach((relativePath) => {
    assert.ok(fs.statSync(path.join(root, relativePath)).size > 10_000, `${relativePath} is unexpectedly small`);
  });
});

test('shared stylesheets and runtime compatibility paths use canonical typography', () => {
  ['assets/css/tokens.css', 'assets/css/global.css', 'assets/css/design-system.css'].forEach((relativePath) => {
    assert.match(read(relativePath), /^@import url\('\/assets\/fonts\/typography\.css'\);/);
  });

  const lazyFonts = read('assets/js/lazy-fonts.js');
  assert.match(lazyFonts, /\/assets\/fonts\/typography\.css/);
  assert.doesNotMatch(lazyFonts, /setTimeout|data-delay|fonts\.googleapis/);

  const navbar = read('assets/js/components/navbar.js');
  assert.match(navbar, /data-afrotools-typography/);
  assert.match(navbar, /\/assets\/fonts\/typography\.css/);

  const navbarCss = read('assets/css/navbar.min.css');
  assert.match(navbarCss, /^@import url\('\/assets\/fonts\/typography\.css'\);/);
  assert.doesNotMatch(navbarCss, /fonts\.googleapis\.com/);
});

test('shared design-system UI does not request synthetic extra-bold weights', () => {
  const css = read('assets/css/design-system.css');
  assert.doesNotMatch(css, /font-weight:\s*(?:850|900)\s*!important/);
});
