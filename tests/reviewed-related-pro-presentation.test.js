"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const quality = require("../scripts/lib/calculation-quality");
const { normalizeReviewedRelatedProPresentation: normalize } = require("../scripts/lib/reviewed-related-pro-presentation");
const review = require("../data/calculation-quality/reviews/2026-10-12-related-pro-copy.json");
const controllerReview = require("../data/calculation-quality/reviews/2026-10-12-sars-checklist-recovery.json").controllerReview;
const ROOT = path.resolve(__dirname, "..");
const formulas = quality.loadQualityArtifacts(ROOT).formulas.formulas;

for (const record of review.records) {
  const html = fs.readFileSync(path.join(ROOT, record.artifactPath), "utf8");
  const protectedDigest = record.id === "route-sars-efiling" ? controllerReview.successorArtifactDigest : record.legacyArtifactDigest;
  test(record.id + ": exact related Pro copy preserves the original protected digest", () => {
    const formula = formulas.find(item => item.id === record.id);
    assert.equal(formula.artifactPath, record.artifactPath);
    if (record.id === "route-sars-efiling") {
      assert.equal(controllerReview.legacyArtifactDigest, record.legacyArtifactDigest);
      assert.equal(html.split(controllerReview.afterReference).length - 1, 1);
      assert.equal(quality.digestHtmlFormulaSource(html.replace(controllerReview.afterReference, controllerReview.beforeReference)), record.legacyArtifactDigest);
    }
    assert.equal(formula.artifactDigest, protectedDigest);
    assert.equal(html.split(record.current).length, 2);
    assert.equal(normalize(html), html.replace(record.current, record.baseline));
    assert.equal(normalize(normalize(html)), normalize(html));
    assert.equal(quality.digestHtmlFormulaSource(html), protectedDigest);
    assert.equal(quality.digestHtmlFormulaSource(html.replace(record.current, record.baseline)), protectedDigest);
  });

  test(record.id + ": unrelated content and executable changes stay protected", () => {
    const variants = [
      html.replace(/(<h1\b[^>]*>)/i, "$1Unreviewed heading "),
      html.replace("</body>", "<p>Unreviewed disclaimer and source panel</p></body>"),
      html.replace(/(<script\b[^>]*\bsrc=["'])[^"']+/, "$1/unreviewed-runtime.js"),
      html.replace("</body>", '<input name="unreviewed-rate" value="0.37"></body>'),
      html.replace("</body>", "<script>function calculate(value) { return value * 0.37; }</script></body>"),
      html.replace("https://afrotools.com" + record.route, "https://afrotools.com/unreviewed/"),
      html.replace(record.current, record.current.replace("limited previews", "guaranteed results")),
      html.replace(record.current, record.current + record.current),
    ];
    for (const changed of variants) {
      assert.notEqual(changed, html);
      assert.notEqual(quality.digestHtmlFormulaSource(changed), protectedDigest);
    }
  });

  test(record.id + ": only one exact canonical and one exact anchor are accepted", () => {
    const unknownRoute = html.replace(/(<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["'])[^"']+/, "$1https://afrotools.com/unreviewed/");
    assert.equal(normalize(unknownRoute), unknownRoute);
    const duplicateCanonical = html.replace("</head>", '<link rel="canonical" href="https://afrotools.com' + record.route + '"></head>');
    assert.equal(normalize(duplicateCanonical), duplicateCanonical);
    const duplicateAnchor = html.replace(record.current, record.current + record.current);
    assert.equal(normalize(duplicateAnchor), duplicateAnchor);
  });
}

test("presentation scope is restricted to the three named canonical guide pages", () => {
  assert.deepEqual(review.records.map(record => record.id), ["route-etims-guide", "route-sars-efiling", "route-transfer-pricing"]);
  for (const record of review.records) {
    assert.match(record.current, /^<a href="\/pro\/" data-related-tool /);
    assert.match(record.baseline, /^<a href="\/pro\/" data-related-tool /);
    assert.doesNotMatch(record.current + record.baseline, /<script\b|<input\b|<h1\b|<body\b/i);
  }
});
