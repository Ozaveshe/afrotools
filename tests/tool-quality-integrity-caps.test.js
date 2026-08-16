'use strict';

const assert = require('assert');
const { detectFeatures, scoreTool } = require('../scripts/audit-tool-quality');

const pageInfo = {
  exists: true,
  filePath: __filename,
  relative: 'tests/tool-quality-integrity-caps.test.js',
  route: '/tools/integrity-fixture/',
};
const verification = { tools: {} };

function evaluate(html, overrides = {}) {
  const tool = Object.assign({
    id: 'integrity-fixture',
    name: 'Integrity Fixture',
    href: '/tools/integrity-fixture/',
    category: 'default',
    status: 'live',
    priority: 90,
  }, overrides);
  const features = detectFeatures(tool, html, pageInfo, verification);
  return { features, score: scoreTool(tool, pageInfo, features, null) };
}

const shell = `<!doctype html><html lang="en"><head>
<title>Integrity fixture calculator | AfroTools</title>
<meta name="description" content="A sufficiently descriptive integrity fixture used to prove that quality caps fail closed for misleading public app surfaces.">
<link rel="canonical" href="https://afrotools.com/tools/integrity-fixture/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Fixture"}</script>
</head><body><h1>Integrity fixture</h1><main>
<form><label>Amount <input name="amount" value="100"></label><button>Calculate estimate</button></form>
<output id="result">Result ready</output><p>Methodology, assumptions, source and disclaimer: verify with the official authority.</p>
</main></body></html>`;

{
  const html = shell.replace('</main>', `<section class="df-upgrade" data-df-upgrade="integrity-fixture">
  <p>Not sure how to get the most from the Integrity Fixture? Enter your details and it returns a clear result.</p>
  <p>It is as accurate as the values you enter and is completely free, works on any phone.</p>
  </section></main>`);
  const result = evaluate(html);
  assert.equal(result.features.qualityWarnings.genericDecisionWorkspace, true);
  assert(result.score.score <= 64, `generic score padding must be capped at D, got ${result.score.score}`);
  assert(result.score.quality_deductions.includes('generic score-oriented decision workspace'));
}

{
  const html = shell.replace('</head>', '<meta name="robots" content="noindex,follow"></head>');
  const result = evaluate(html);
  assert.equal(result.features.qualityWarnings.liveNoindex, true);
  assert(result.score.score <= 44, `live noindex route must be capped at F, got ${result.score.score}`);
  assert(result.score.quality_deductions.includes('live/new registry row resolves to a noindex page'));
}

{
  const html = shell.replace('</main>', `<section class="df-upgrade" data-df-upgrade="integrity-fixture">
  <h2>Fuel budget brief</h2><p>Estimate litres from generator size, measured load and run hours.</p>
  </section></main>`);
  const result = evaluate(html);
  assert.equal(result.features.qualityWarnings.genericDecisionWorkspace, false);
  assert(!result.score.quality_deductions.includes('generic score-oriented decision workspace'));
}

console.log('Tool quality integrity caps passed.');
