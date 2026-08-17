const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const { normalizeTransportGeneratorHtml } = require('../scripts/build-french-transport-parity');
const { normalizeForOwner, page: mobileMoneyPage } = require('../scripts/build-mobile-money-fee-finder');

test('transport owner normalization ignores recursively derived SEO images', () => {
  const base = '<html><head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Test"}]}</script></head><body></body></html>';
  const postProcessed = base.replace('"name":"Test"', '"name":"Test","image":"https://afrotools.com/assets/img/og.webp"');
  assert.equal(normalizeTransportGeneratorHtml(postProcessed), normalizeTransportGeneratorHtml(base));
});

test('transport owner normalization includes the safe French navigation post-process', () => {
  const owner = '<html lang="fr"><body><a href="/">AfroTools</a><a href="/transport/">Transport</a></body></html>';
  const released = '<html lang="fr"><body><a href="/fr/">AfroTools</a><a href="/fr/transport/">Transport</a></body></html>';
  assert.equal(normalizeTransportGeneratorHtml(owner), normalizeTransportGeneratorHtml(released));
});

test('mobile-money owner normalization accepts release-owned English discovery metadata', () => {
  const file = path.join(ROOT, 'tools', 'mobile-money-fees', 'index.html');
  const owner = mobileMoneyPage('en');
  const released = owner
    .replace('</head>', '<!-- tool-structured-data:auto --><script type="application/ld+json">{"@type":"BreadcrumbList"}</script></head>')
    .replace('<afro-footer>', '<afro-related-tools data-ssr="1"><!-- RELATED_TOOLS_SSR_START --><nav>Related tools</nav><!-- RELATED_TOOLS_SSR_END --></afro-related-tools><afro-footer>')
    .replace('</body>', '<script src="/assets/js/components/related-tools.min.js?v=9de30883" defer></script></body>');
  assert.equal(normalizeForOwner(file, released), normalizeForOwner(file, owner));
});

test('retired root blog articles carry their route-policy destination canonical', () => {
  for (const [relativePath, destination] of [
    ['blog/calculer-salaire-net-senegal/index.html', 'https://afrotools.com/fr/blog/calculer-salaire-net-senegal/'],
    ['blog/salaire-moyen-rdc-2026/index.html', 'https://afrotools.com/fr/blog/salaire-moyen-rdc-2026/']
  ]) {
    const html = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="${destination}">`));
  }
});
