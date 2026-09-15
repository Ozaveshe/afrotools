'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { outputs, normalizePage } = require('../scripts/build-ssce-practice-locales');

for (const locale of ['fr', 'sw']) {
  test(`${locale} SSCE release formatting preserves the source contract`, () => {
    const [file, source] = [...outputs()].find(([file]) => file.startsWith(locale + '/'));
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
      ['id="practice-start"', 'id="broken-start"'],
      ['hreflang="en"', 'hreflang="de"'],
      ['name="description"', 'name="missing-description"'],
      ['waec-calculator.webp', 'wrong-image.webp']
    ]) {
      assert.notEqual(normalizePage(source), normalizePage(source.replace(before, after)), before);
    }
  });
}
