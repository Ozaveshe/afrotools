"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { earlyBootstrapTag, normalizeBootstrapInHtml } = require("../scripts/inject-analytics-loader");

const canonical = earlyBootstrapTag("bootstrap", "runtime");
const stale = earlyBootstrapTag("previous", "old-runtime");
const style = "<style>@view-transition { navigation: auto }\n@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none } }</style>";
const page = head => "<html><head>" + head + "</head><body></body></html>";

for (const [name, head] of [
  ["missing bootstrap", style],
  ["stale bootstrap before opt-in", stale + "\n" + style],
  ["current bootstrap before opt-in", canonical + "\n" + style],
  ["stale bootstrap after opt-in", style + "\n" + stale],
  ["current bootstrap after opt-in", style + "\n" + canonical],
]) {
  test(name, () => {
    const { html } = normalizeBootstrapInHtml(page(head), canonical, true);
    assert.ok(html.includes(style));
    assert.equal(html.split(canonical).length, 2);
    assert.ok(html.indexOf(style) < html.indexOf(canonical));
    assert.deepEqual(normalizeBootstrapInHtml(html, canonical, true), {
      html, duplicate: false, injected: false, normalized: false,
    });
    if (head === style + "\n" + canonical) assert.equal(html, page(head));
  });
}

test("ordinary styles and locale bootstrap exclusions retain their existing behavior", () => {
  const ordinary = "<style>body { color: black }</style>";
  const { html } = normalizeBootstrapInHtml(page(ordinary), canonical, true);
  assert.ok(html.indexOf(canonical) < html.indexOf(ordinary));
  assert.equal(normalizeBootstrapInHtml(page(style), canonical, false).html, page(style));
  assert.equal(normalizeBootstrapInHtml(page(canonical + style), canonical, false).html, page(style));
});
