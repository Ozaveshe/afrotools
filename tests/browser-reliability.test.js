'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyRuntime, applyRuntimeGate } = require('../scripts/lib/browser-reliability');
const { detectFeatures, scoreTool } = require('../scripts/audit-tool-quality');
const ok = { ok: true, status: 200 };
test('HTTP failure overrides a perfect static score', () => {
  assert.equal(applyRuntimeGate(100, { ok: false, status: 404 }).score, 44);
  assert.equal(applyRuntimeGate(100, { ...ok, pageErrors: 1 }).score, 44);
  assert.equal(applyRuntimeGate(100, { ...ok, error: 'navigation timed out' }).score, 44);
});
test('local file route probe requires matching canonical and never proves production', () => {
  const gap = { ok: false, status: 404, redirectProbe: { status: 200, canonicalMatches: true } };
  assert.equal(classifyRuntime(gap).status, 'local-redirect-emulation-gap');
  assert.equal(applyRuntimeGate(100, gap).score, 84);
  assert.equal(classifyRuntime({ ...gap, environment: 'production' }).status, 'production-http-failure');
  assert.equal(classifyRuntime({ ...gap, redirectProbe: { status: 200, canonicalMatches: false } }).gate, 'failed');
});
test('unknown errors, policy conflicts and external failures stay reviewable', () => {
  for (const result of [{ consoleErrors: 1 }, { failedResponseCount: 1 }, { thirdPartyFailures: ['https://example.test'] }, { consoleErrors: 1, sampleConsoleErrors: ['violates Content Security Policy'] }]) {
    assert.equal(classifyRuntime({ ...ok, ...result }).gate, 'review');
    assert.equal(applyRuntimeGate(100, { ...ok, ...result }).score, 84);
  }
});
test('fallback label needs a passing named assertion and does not excuse exceptions', () => {
  assert.equal(classifyRuntime({ ...ok, intentionalFallback: { test: 'offline result', assertionPassed: true } }).status, 'verified-intentional-fallback');
  assert.equal(classifyRuntime({ ...ok, pageErrors: 1, intentionalFallback: { test: 'offline result', assertionPassed: true } }).gate, 'failed');
  assert.equal(classifyRuntime(null).gate, 'unverified');
  assert.equal(classifyRuntime({ ...ok, blockedByHarness: ['https://example.test'] }).gate, 'passed');
});
test('scoreTool integration cannot leave a tested broken page at A', () => {
  const fs = require('fs');
  const route = '/fr/tools/assurance-auto/ghana/';
  const pageInfo = { exists: true, filePath: require('path').resolve('fr/tools/assurance-auto/ghana.html'), relative: 'fr/tools/assurance-auto/ghana.html', route };
  const tool = { id: 'fixture', href: route, category: 'insurance', status: 'live' };
  const features = detectFeatures(tool, fs.readFileSync(pageInfo.relative, 'utf8'), pageInfo, { tools: {} });
  const result = scoreTool(tool, pageInfo, features, { ok: false, status: 404 });
  assert.equal(result.rank, 'F');
  assert.equal(result.runtime.gate, 'failed');
});
