'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const quality = require('../scripts/lib/calculation-quality');
const review = require('../data/image-generation/reviewed-discovery-artwork-presentation.json');
const ROOT = path.resolve(__dirname, '..');
const formulas = quality.loadQualityArtifacts(ROOT).formulas.formulas;

for (const record of review.records) {
  const source = fs.readFileSync(path.join(ROOT, record.artifactPath), 'utf8');
  test(record.id + ': reviewed artwork preserves the current protected formula digest', () => {
    const formula = formulas.find(item => item.id === record.id);
    assert.equal(formula.artifactPath, record.artifactPath);
    assert.equal(quality.digestHtmlFormulaSource(source), formula.artifactDigest);
    // Later reviewed content changes can advance the formula digest. Prove the
    // original artwork substitution is still neutral without rewriting its
    // historical review or ignoring any current content and runtime changes.
    let originalArtwork = source;
    for (const patch of record.patches.slice().reverse()) {
      assert.equal(originalArtwork.split(patch.current).length, 2);
      originalArtwork = originalArtwork.replace(patch.current, patch.baseline);
    }
    assert.notEqual(originalArtwork, source);
    assert.equal(quality.digestHtmlFormulaSource(originalArtwork), formula.artifactDigest);
    assert.notEqual(record.reviewedImageArtifactDigest, formula.artifactDigest);
  });
  test(record.id + ': content and executable wiring remain protected', () => {
    const currentDigest = formulas.find(item => item.id === record.id).artifactDigest;
    const heading = source.replace(/(<h1\b[^>]*>)/i, '$1Unreviewed instruction ');
    assert.notEqual(heading, source);
    assert.notEqual(quality.digestHtmlFormulaSource(heading), currentDigest);
    const runtime = source.replace(/(<script\b[^>]*\bsrc=["'])[^"']+["']/i, '$1/unreviewed-runtime.js"');
    assert.notEqual(runtime, source);
    assert.notEqual(quality.digestHtmlFormulaSource(runtime), currentDigest);
    const formula = source.replace('</body>', '<script>function calculate(value) { return value * 0.37; }</script></body>');
    assert.notEqual(formula, source);
    assert.notEqual(quality.digestHtmlFormulaSource(formula), currentDigest);
  });
  test(record.id + ': unknown image and canonical changes remain protected', () => {
    const currentDigest = formulas.find(item => item.id === record.id).artifactDigest;
    const image = source.replace(/https:\/\/afrotools\.com\/assets\/img\/tools\/[^"']+\.webp/, 'https://afrotools.com/assets/img/tools/unreviewed.webp');
    assert.notEqual(image, source);
    assert.notEqual(quality.digestHtmlFormulaSource(image), currentDigest);
    const canonical = source.replace(/(<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["'])[^"']+/, '$1https://afrotools.com/unreviewed/');
    assert.notEqual(canonical, source);
    assert.notEqual(quality.digestHtmlFormulaSource(canonical), currentDigest);
  });
}

test('artwork review covers only the five named presentation deltas', () => {
  assert.deepEqual(review.records.map(item => item.id), ['route-cbk-rates', 'route-cnps-guide', 'route-etims-guide', 'route-itax-guide', 'route-sars-efiling']);
  for (const record of review.records) {
    assert.ok(record.patches.length);
    for (const patch of record.patches) {
      assert.ok(patch.current && patch.baseline);
      assert.doesNotMatch(patch.current + patch.baseline, /<body\b|<input\b|<button\b/i);
    }
  }
});
