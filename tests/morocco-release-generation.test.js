'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { outputs, normalizePage } = require('../scripts/build-morocco-paye');

for (const locale of ['en', 'fr', 'sw', 'legacy']) {
  test(`${locale} Morocco release formatting preserves the source contract`, () => {
    const [file, source] = [...outputs()][['en','fr','sw','legacy'].indexOf(locale)];
    let released = source.replace(/<link\b(?=[^>]*\brel="(?:canonical|alternate)")[^>]*>\n?/g, '');
    const links = source.match(/<link\b(?=[^>]*\brel="(?:canonical|alternate)")[^>]*>/g);
    released = released.replace('</head>', links.reverse().join('\n') + '</head>')
      .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
        (_, a, json, b) => a + JSON.stringify(JSON.parse(json), null, 2) + b)
      .replace('<html ', '<html data-chat-bundle="/assets/js/bundles/chat.12345678.min.js" ')
      .replace('/assets/css/design-system.css', '/assets/css/design-system.min.css?v=12345678')
      .replace('</body>', '<script src="/assets/js/lazy-analytics.js?v=12345678" defer></script></body>');
    assert.equal(normalizePage(source), normalizePage(released), file);
    for (const [before, after] of [
      ['"operatingSystem":"Web"', '"operatingSystem":"Other"'],
      ['id="ma-form"', 'id="broken-start"'],
      ['hreflang="en"', 'hreflang="de"'],
      ['name="description"', 'name="missing-description"'],
      ['ma-paye.webp', 'wrong-image.webp']
    ]) {
      assert.notEqual(normalizePage(source), normalizePage(source.replace(before, after)), before);
    }
  });
}

test('only the identified release related-tools component is comparison-owned', () => {
 const source=outputs().get('morocco/ma-paye.html');
 const component='<afro-related-tools data-ssr="1" category="financial" current="ma-paye"><!-- RELATED_TOOLS_SSR_START --><nav data-related-tools-ssr><h2>Related tools</h2><a href="/kenya/ke-paye">Kenya</a></nav><!-- RELATED_TOOLS_SSR_END --></afro-related-tools>';
 const runtime='<script src="/assets/js/components/related-tools.js" defer></script>';
 const withRelated=source.replace('</body>',component+runtime+'</body>');
 assert.equal(normalizePage(withRelated),normalizePage(source));
 for(const mutation of [withRelated.replace('current="ma-paye"','current="other"'),withRelated.replace('<!-- RELATED_TOOLS_SSR_START -->',''),withRelated.replace('<h2>Related tools</h2>','<input name="salary">'),withRelated.replace('id="ma-form"','id="broken"'),source.replace('</body>',runtime+'</body>')])assert.notEqual(normalizePage(mutation),normalizePage(source));
});
