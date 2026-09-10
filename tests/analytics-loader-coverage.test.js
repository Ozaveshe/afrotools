"use strict";

const assert = require("assert");
const {
  analyticsVersion,
  bootstrapVersion,
  canonicalLoaderTag,
  earlyBootstrapTag,
  insertAfterOpeningHead,
  insertBeforeClosingBody,
  normalizeLoaderInHtml,
  normalizeBootstrapInHtml,
  scanCoverage,
  shouldSkipRelativePath,
  shouldUseEarlyBootstrap,
} = require("../scripts/inject-analytics-loader");

const expectedMalformedDocuments = [
  "jamb/commerce/1997/index.html",
  "jamb/english/2000/index.html",
  "jamb/english/2009/index.html",
  "jamb/mathematics/1987/index.html",
];

assert.strictEqual(shouldSkipRelativePath(".claude/worktrees/stale/index.html"), true);
assert.strictEqual(shouldSkipRelativePath("audit-results/browser-proof/index.html"), true);
assert.strictEqual(shouldSkipRelativePath("fr/widgets/iframe/template.html"), true);
assert.strictEqual(shouldSkipRelativePath("widgets/iframe/financial-vat.html"), true);
assert.strictEqual(shouldSkipRelativePath("tools/salary-calculator/index.html"), false);
assert.strictEqual(shouldUseEarlyBootstrap("index.html"), true);
assert.strictEqual(shouldUseEarlyBootstrap("fr/index.html"), true);
assert.strictEqual(shouldUseEarlyBootstrap("sw/index.html"), false);
assert.strictEqual(shouldUseEarlyBootstrap("ha/index.html"), false);
assert.strictEqual(shouldUseEarlyBootstrap("yo/index.html"), false);

const tag = canonicalLoaderTag(analyticsVersion());
const inserted = insertBeforeClosingBody("<html><body>\n</body></html>", tag);
assert.strictEqual((inserted.match(/lazy-analytics\.js/g) || []).length, 1);
assert.ok(inserted.indexOf(tag) < inserted.indexOf("</body>"));

const earlyTag = earlyBootstrapTag(bootstrapVersion(), analyticsVersion());
const earlyInserted = insertAfterOpeningHead("<html><head><title>Test</title></head><body></body></html>", earlyTag);
assert.strictEqual((earlyInserted.match(/analytics-bootstrap\.js/g) || []).length, 1);
assert.ok(earlyInserted.indexOf(earlyTag) < earlyInserted.indexOf("<title>"));

const movedEarly = normalizeBootstrapInHtml(
  `<html><head><title>Test</title></head><body>${tag}</body></html>`,
  earlyTag,
  true,
);
assert.strictEqual(movedEarly.injected, true);
assert.ok(movedEarly.html.indexOf(earlyTag) < movedEarly.html.indexOf("<title>"));
assert.strictEqual(normalizeBootstrapInHtml(movedEarly.html, earlyTag, true).html, movedEarly.html);

// A stable bootstrap URL must not preserve an old runtime cache key.
for (const staleTag of [
  earlyTag.replace(/data-loader-version="[^"]+"/, 'data-loader-version="00000000"'),
  earlyTag.replace(/ data-loader-version="[^"]+"/, ''),
]) {
  const staleHtml = `<html><head>${staleTag}<title>Fixture</title></head><body>${tag}</body></html>`;
  const repaired = normalizeBootstrapInHtml(staleHtml, earlyTag, true);
  assert.strictEqual(repaired.normalized, true);
  assert.ok(repaired.html.includes(earlyTag));
  assert.strictEqual((repaired.html.match(/analytics-bootstrap\.js/g) || []).length, 1);
  assert.ok(repaired.html.indexOf(earlyTag) < repaired.html.indexOf('<title>'));
  const second = normalizeBootstrapInHtml(repaired.html, earlyTag, true);
  assert.strictEqual(second.html, repaired.html);
  assert.strictEqual(second.normalized, false);
}

const normalized = normalizeLoaderInHtml(
  '<html><body><script defer src="/assets/js/lazy-analytics.js"></script></body></html>',
  tag
);
assert.strictEqual(normalized.normalized, true);
assert.strictEqual(normalized.html,
  `<html><body><script defer src="/assets/js/lazy-analytics.js?v=${analyticsVersion()}"></script></body></html>`);

// Hash-only updates preserve source-owner whitespace and execution order,
// including historical escaped closers next to otherwise valid loader tags.
let inPlaceFixtures = 0;
for (const newline of ['\n', '\r\n']) {
  for (const quote of ['"', "'"]) {
    const staleLoader = `<script${newline}      defer src=${quote}/assets/js/lazy-analytics.js?v=old${quote}${newline}      data-owner="fixture"></script>`;
    const before = `<html><head></head><body>${newline}  <script>window.before = true;</script>${newline}    `;
    const after = `${newline}  <\\/script>${newline}  <script>window.after = true;</script>${newline}</body></html>`;
    const source = before + staleLoader + after;
    const result = normalizeLoaderInHtml(source, tag);
    assert.strictEqual(result.html, before + staleLoader.replace('?v=old', `?v=${analyticsVersion()}`) + after);
    assert.strictEqual(result.normalized, true);
    assert.deepStrictEqual(normalizeLoaderInHtml(result.html, tag), {
      html: result.html, duplicate: false, injected: false, normalized: false,
    });
    inPlaceFixtures += 1;

    const staleBootstrap = `<script${newline}      src=${quote}/assets/js/analytics-bootstrap.js?v=old${quote}${newline}      data-loader-version=${quote}old-runtime${quote} async></script>`;
    const headBefore = `<html><head>${newline}  <script>window.headBefore = true;</script>${newline}    `;
    const headAfter = `${newline}  <script>window.headAfter = true;</script>${newline}</head><body></body></html>`;
    const bootstrapResult = normalizeBootstrapInHtml(headBefore + staleBootstrap + headAfter, earlyTag, true);
    const expected = staleBootstrap.replace('?v=old', `?v=${bootstrapVersion()}`).replace('old-runtime', analyticsVersion());
    assert.strictEqual(bootstrapResult.html, headBefore + expected + headAfter);
    assert.strictEqual(bootstrapResult.normalized, true);
    assert.strictEqual(normalizeBootstrapInHtml(bootstrapResult.html, earlyTag, true).normalized, false);
    inPlaceFixtures += 1;
  }
}

for (const timing of ['', 'async', 'defer async']) {
  const prefix = '<html><head></head><body><script>window.before = true;</script>\n  ';
  const suffix = '\n<script>window.after = true;</script></body></html>';
  const result = normalizeLoaderInHtml(`${prefix}<script src="/assets/js/lazy-analytics.js?v=old" ${timing}></script>${suffix}`, tag);
  assert.strictEqual(result.html, prefix + tag + suffix);
  assert.strictEqual(normalizeLoaderInHtml(result.html, tag).normalized, false);
  inPlaceFixtures += 1;
}
for (const timing of ['', 'defer', 'async defer']) {
  const prefix = '<html><head><title>Keep position</title>\n  ';
  const suffix = '\n<script>window.after = true;</script></head><body></body></html>';
  const result = normalizeBootstrapInHtml(`${prefix}<script src="/assets/js/analytics-bootstrap.js?v=old" ${timing}></script>${suffix}`, earlyTag, true);
  assert.strictEqual(result.html, prefix + earlyTag + suffix);
  assert.strictEqual(normalizeBootstrapInHtml(result.html, earlyTag, true).normalized, false);
  inPlaceFixtures += 1;
}

const misplacedLoader = normalizeLoaderInHtml(`<html><head>${tag}</head><body><main>Body</main></body></html>`, tag);
assert.ok(misplacedLoader.html.indexOf(tag) > misplacedLoader.html.indexOf('<main>'));
assert.strictEqual((misplacedLoader.html.match(/lazy-analytics\.js/g) || []).length, 1);
assert.strictEqual(normalizeLoaderInHtml(misplacedLoader.html, tag).normalized, false);
const misplacedBootstrap = normalizeBootstrapInHtml(`<html><head><title>Head</title></head><body>${earlyTag}</body></html>`, earlyTag, true);
assert.ok(misplacedBootstrap.html.indexOf(earlyTag) < misplacedBootstrap.html.indexOf('<title>'));
assert.strictEqual((misplacedBootstrap.html.match(/analytics-bootstrap\.js/g) || []).length, 1);
assert.strictEqual(normalizeBootstrapInHtml(misplacedBootstrap.html, earlyTag, true).normalized, false);
inPlaceFixtures += 2;

for (const runtimeAttribute of ['', 'data-loader-version=old-runtime ']) {
  const source = `<html><head>\n  <script src="/assets/js/analytics-bootstrap.js?v=${bootstrapVersion()}" ${runtimeAttribute}async></script>\n<title>Keep position</title></head><body></body></html>`;
  const result = normalizeBootstrapInHtml(source, earlyTag, true);
  assert.ok(result.html.includes(`data-loader-version="${analyticsVersion()}"`));
  assert.strictEqual(result.html.slice(0, result.html.indexOf('<script')), '<html><head>\n  ');
  assert.strictEqual(result.html.slice(result.html.indexOf('</script>')), source.slice(source.indexOf('</script>')));
  assert.strictEqual(normalizeBootstrapInHtml(result.html, earlyTag, true).normalized, false);
  inPlaceFixtures += 1;
}

const duplicate = normalizeLoaderInHtml(
  `<html><body>${tag}${tag}</body></html>`,
  tag
);
assert.strictEqual(duplicate.duplicate, true);
assert.strictEqual(duplicate.html, `<html><body>${tag}${tag}</body></html>`);
const duplicateBootstrapHtml = `<html><head>${earlyTag}${earlyTag}</head><body></body></html>`;
assert.deepStrictEqual(normalizeBootstrapInHtml(duplicateBootstrapHtml, earlyTag, true), {
  html: duplicateBootstrapHtml, duplicate: true, injected: false, normalized: false,
});

const report = scanCoverage();
assert.ok(report.eligible > 10000, `expected more than 10,000 public HTML documents, found ${report.eligible}`);
assert.deepStrictEqual(report.missing, [], `analytics loader missing from: ${report.missing.slice(0, 20).join(", ")}`);
assert.deepStrictEqual(report.nonCanonical, [], `stale analytics loader found in: ${report.nonCanonical.slice(0, 20).join(", ")}`);
assert.deepStrictEqual(report.duplicates, [], `duplicate analytics loader found in: ${report.duplicates.slice(0, 20).join(", ")}`);
assert.deepStrictEqual(report.missingBootstrap, [], `early analytics bootstrap missing from: ${report.missingBootstrap.slice(0, 20).join(", ")}`);
assert.deepStrictEqual(report.nonCanonicalBootstrap, [], `stale early analytics bootstrap found in: ${report.nonCanonicalBootstrap.slice(0, 20).join(", ")}`);
assert.deepStrictEqual(report.duplicateBootstrap, [], `duplicate early analytics bootstrap found in: ${report.duplicateBootstrap.slice(0, 20).join(", ")}`);
assert.deepStrictEqual(
  report.malformed.filter((file) => !expectedMalformedDocuments.includes(file)),
  [],
  `new malformed public HTML documents found: ${report.malformed.join(", ")}`
);

console.log(
  `analytics-loader-coverage.test.js passed (${inPlaceFixtures} in-place/repair fixtures; ${report.covered}/${report.eligible} eligible pages covered)`
);
