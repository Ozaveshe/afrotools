const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const engine = require('../tools/medical-report/medical-report-engine.js');

const biomarkers = {
  WBC: { name: 'White Blood Cell Count', unit: 'x10^9/L', low: 4, high: 11, category: 'CBC' },
  HDL: { name: 'HDL Cholesterol', unit: 'mg/dL', low: 40, high: 999, category: 'Lipid' },
};

{
  const [result] = engine.parse('WBC: 12 x10^9/L Reference range: 4.0 - 13.0', biomarkers, ['CBC']);
  assert.strictEqual(result.status, 'normal', 'lab range must override the narrower general fallback');
  assert.strictEqual(result.referenceSource, 'lab');
  assert.deepStrictEqual([result.biomarker.low, result.biomarker.high], [4, 13]);
}

{
  const [result] = engine.parse('WBC 12 x10^9/L (4.0-11.0) CRITICAL', biomarkers, ['CBC']);
  assert.strictEqual(result.status, 'high');
  assert.strictEqual(result.referenceSource, 'lab');
  assert.strictEqual(result.labFlag, 'critical');
}

{
  const [result] = engine.parse('WBC: 3.5 x10^9/L', biomarkers, ['CBC']);
  assert.strictEqual(result.status, 'low');
  assert.strictEqual(result.referenceSource, 'general');
}

{
  const [result] = engine.parse('HDL: 50 mg/dL Ref > 40', biomarkers, ['Lipid']);
  assert.strictEqual(result.referenceSource, 'lab');
  assert.strictEqual(result.status, 'normal');
  assert.strictEqual(result.biomarker.high, 999);
}

{
  const results = engine.parse(
    'Patient: PRIVATE_RAW_REPORT_SENTINEL\nWBC: 7.2 x10^9/L Reference range: 4-11',
    biomarkers,
    ['CBC']
  );
  const payload = JSON.stringify(engine.aiMarkers(results));
  assert(!payload.includes('PRIVATE_RAW_REPORT_SENTINEL'));
  assert.deepStrictEqual(Object.keys(engine.aiMarkers(results)[0]), [
    'marker', 'value', 'unit', 'status', 'referenceLow', 'referenceHigh',
    'referenceSource', 'labFlag',
  ]);
}

const html = fs.readFileSync('tools/medical-report/index.html', 'utf8');
assert.match(html, /medical-report-engine\.js/);
assert.match(html, /assets\/vendor\/tesseract\/tesseract\.min\.js/);
assert.match(html, /assets\/vendor\/pdfjs\/pdf\.min\.js/);
assert.match(html, /assets\/vendor\/pdfjs\/pdf\.worker\.min\.js/);
assert.doesNotMatch(html, /assets\/css\/typography\.css/, 'route must not request the missing legacy typography stylesheet');
assert.match(html, /assets\/css\/tokens\.min\.css/);
assert.match(html, /assets\/css\/global\.min\.css/);
assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs\.cloudflare/);
assert.match(html, /Lab range first/);
assert.match(html, /Reference policy reviewed 26 July 2026/);
assert.match(html, /AI is never contacted automatically/);
assert.match(html, /buildAiInterpretationRequest/);
assert.match(html, /renderLocalInterpretation\(parsedResults\)/);
assert.doesNotMatch(html, /if\s*\(hasAIConsent\(\)\)\s*\{\s*fetchAIInterpretation\(parsedResults\)/);
assert.match(html, /data-health-action="pdf"[^>]*>Download PDF</);
assert.match(html, /data-health-action="save"[^>]*>Save on this device</);
assert.match(html, /data-health-action="sync"[^>]*>Save metadata to account \(optional\)</);
assert.match(html, /role="tablist"/);
assert.match(html, /role="alert"/);
assert.match(html, /prefers-reduced-motion/);
assert.match(html, /\[data-theme="dark"\]/);

const scripts = [...html.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .filter((body) => body.trim());
scripts.forEach((body, index) => {
  assert.doesNotThrow(() => new vm.Script(body), `classic inline script ${index + 1} must parse`);
});

const context = JSON.parse(fs.readFileSync('data/ai/tool-context/medical-report.json', 'utf8'));
assert.strictEqual(context.status, 'unverified-static');
assert.match(context.staticText, /bounded parsed marker data only/);
assert.match(context.staticText, /laboratory range/);
assert.match(context.staticText, /Never request or repeat raw report text/);
assert.doesNotMatch(context.staticText, /start medication|change medication|diagnose the user/i);

console.log('medical-report VIP tests passed');
