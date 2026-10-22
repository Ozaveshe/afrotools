'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const controllerReview = require('../data/calculation-quality/reviews/2026-10-12-sars-checklist-recovery.json').controllerReview;
const quality = require('../scripts/lib/calculation-quality');
const review = require('../data/image-generation/reviewed-discovery-artwork-presentation.json');
const ROOT = path.resolve(__dirname, '..');
const formulas = quality.loadQualityArtifacts(ROOT).formulas.formulas;

for (const record of review.records) {
  const source = fs.readFileSync(path.join(ROOT, record.artifactPath), 'utf8');
  const protectedDigest = record.id === 'route-sars-efiling' ? controllerReview.successorArtifactDigest : record.legacyArtifactDigest;
  test(record.id + ': reviewed artwork retains the existing protected digest', () => {
    const formula = formulas.find(item => item.id === record.id);
    assert.equal(formula.artifactPath, record.artifactPath);
    if (record.id === 'route-sars-efiling') {
      assert.equal(controllerReview.artifactPath, record.artifactPath);
      assert.equal(controllerReview.runtimePath, 'assets/js/lib/sars-efiling-guide.js');
      assert.equal(controllerReview.legacyArtifactDigest, record.legacyArtifactDigest);
      assert.match(controllerReview.beforeReference, /^\/assets\/js\/lib\/sars-efiling-guide\.js\?v=[a-f0-9]{8}$/);
      assert.match(controllerReview.afterReference, /^\/assets\/js\/lib\/sars-efiling-guide\.js\?v=[a-f0-9]{8}$/);
      assert.notEqual(controllerReview.beforeReference, controllerReview.afterReference);
      assert.equal(source.split(controllerReview.afterReference).length - 1, 1);
      const restored = source.replace(controllerReview.afterReference, controllerReview.beforeReference);
      assert.equal(quality.digestHtmlFormulaSource(restored), record.legacyArtifactDigest);
      const runtime = fs.readFileSync(path.join(ROOT, controllerReview.runtimePath), 'utf8').replace(/\r\n?/g, '\n');
      assert.equal(crypto.createHash('sha256').update(runtime).digest('hex'), controllerReview.runtimeSha256);
      assert.notEqual(protectedDigest, record.legacyArtifactDigest);
    }
    assert.equal(formula.artifactDigest, protectedDigest);
    assert.equal(quality.digestHtmlFormulaSource(source), formula.artifactDigest);
    assert.notEqual(record.reviewedImageArtifactDigest, formula.artifactDigest);
  });
  test(record.id + ': content and executable wiring remain protected', () => {
    const heading = source.replace(/(<h1\b[^>]*>)/i, '$1Unreviewed instruction ');
    assert.notEqual(heading, source);
    assert.notEqual(quality.digestHtmlFormulaSource(heading), protectedDigest);
    const runtime = source.replace(/(<script\b[^>]*\bsrc=["'])[^"']+["']/i, '$1/unreviewed-runtime.js"');
    assert.notEqual(runtime, source);
    assert.notEqual(quality.digestHtmlFormulaSource(runtime), protectedDigest);
    const formula = source.replace('</body>', '<script>function calculate(value) { return value * 0.37; }</script></body>');
    assert.notEqual(formula, source);
    assert.notEqual(quality.digestHtmlFormulaSource(formula), protectedDigest);
  });
  test(record.id + ': unknown image and canonical changes remain protected', () => {
    const image = source.replace(/https:\/\/afrotools\.com\/assets\/img\/tools\/[^"']+\.webp/, 'https://afrotools.com/assets/img/tools/unreviewed.webp');
    assert.notEqual(image, source);
    assert.notEqual(quality.digestHtmlFormulaSource(image), protectedDigest);
    const canonical = source.replace(/(<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["'])[^"']+/, '$1https://afrotools.com/unreviewed/');
    assert.notEqual(canonical, source);
    assert.notEqual(quality.digestHtmlFormulaSource(canonical), protectedDigest);
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

// Shared presentation cache changes must preserve the actual legacy formula
// identities; unknown keys and injected calculator code must still fail closed.
test('reviewed footer build preserves all24 original formula digests and rejects unreviewed changes', () => {
  const footerReview = require('../data/calculation-quality/reviews/2026-10-22-swahili-footer-cache-reconciliation.json');
  assert.equal(footerReview.formulaIds.length, 24);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'assets/js/components/footer.js'))).digest('hex'), 'dbbb2e7a062af5a5e3f524785761690cbb5c1ee64a6bd16f0bbef210ca8f271b');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'assets/js/components/footer.min.js'))).digest('hex'), '3f9ee6c16cf730380f20c8cca5c675759879a84fcfd7a9df8be3cb5a85d338b0');
  for (const id of footerReview.formulaIds) {
    const formula = formulas.find(row => row.id === id);
    assert.ok(formula, id);
    const html = fs.readFileSync(path.join(ROOT, formula.artifactPath), 'utf8');
    const current = '/assets/js/components/footer.min.js?v=ef7e6da2';
    assert.ok(html.includes(current), id + ': reviewed footer reference');
    assert.equal(quality.digestHtmlFormulaSource(html), formula.artifactDigest, id);
    assert.equal(quality.digestHtmlFormulaSource(html.replaceAll(current, '/assets/js/components/footer.min.js?v=6bd937ab')), formula.artifactDigest, id + ': original footer representation');
    for (const changed of [
      html.replaceAll(current, '/assets/js/components/footer.min.js?v=deadbeef'),
      html.replaceAll(current, current + '0'),
      html.replaceAll(current, current + '&unreviewed=1'),
      html.replace('</body>', '<script>function calculate(value) { return value * 0.37; }</script></body>')
    ]) {
      assert.notEqual(changed, html, id);
      assert.notEqual(quality.digestHtmlFormulaSource(changed), formula.artifactDigest, id + ': unknown footer/query or calculator code must remain protected');
    }
  }
});
