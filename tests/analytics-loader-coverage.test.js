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

const normalized = normalizeLoaderInHtml(
  '<html><body><script defer src="/assets/js/lazy-analytics.js"></script></body></html>',
  tag
);
assert.strictEqual(normalized.normalized, true);
assert.strictEqual(normalized.html.includes(tag), true);

const duplicate = normalizeLoaderInHtml(
  `<html><body>${tag}${tag}</body></html>`,
  tag
);
assert.strictEqual(duplicate.duplicate, true);

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
  `analytics-loader-coverage.test.js passed (${report.covered}/${report.eligible} eligible pages covered)`
);
