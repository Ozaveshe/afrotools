'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const api = require('../scripts/lib/canonical-registry');
const sources = api.loadSources();

function registryWith(change) {
  return api.buildCanonicalRegistry({
    ...sources,
    tools: sources.tools.map(tool => tool.id === 'japa-calculator' ? { ...tool, ...change } : tool)
  });
}

test('explicit guest availability is independent of Pro bundle membership', () => {
  const registry = api.buildCanonicalRegistry(sources);
  for (const [id, expected] of Object.entries({
    'japa-calculator': 'free',
    'medical-report': 'free-and-pro',
    'business-planner': 'free-and-pro',
    'pdf-chat': 'free-and-pro'
  })) {
    assert.equal(sources.tools.find(tool => tool.id === id).proBundle, true);
    assert.equal(registry.tools.find(tool => tool.id === id).availability, expected);
  }
  for (const availability of ['free', 'free-and-pro', 'pro']) {
    assert.equal(registryWith({ availability, proBundle: true, revenue: 'Pro' }).tools.find(tool => tool.id === 'japa-calculator').availability, availability);
  }
  for (const availability of [null, 'unknown', true]) {
    assert(api.validateCanonicalRegistry(registryWith({ availability })).errors.some(issue => issue.code === 'TOOL_AVAILABILITY_INVALID'));
  }
});

test('dated catalogue rows retain their dates without an unsupported current claim', () => {
  const registry = api.buildCanonicalRegistry(sources);
  for (const tool of sources.tools) {
    const result = registry.tools.find(row => row.id === tool.id);
    assert.equal(result.dataFreshness.asOf, tool.dataAsOf || tool.lastUpdated || tool.updatedAt || null);
    assert.equal(result.dataFreshness.status, 'unknown');
  }
});

test('freshness dates validate calendar days and UTC timestamps, not review recency', () => {
  const cases = [
    [null, true], ['2000-01-01', true], ['2099-01-01', true],
    ['2024-02-29', true], ['2026-02-29', false], ['2026-02-30', false],
    ['2026-10-09T08:00:00Z', true], ['2026-10-09T08:00:00.123Z', true],
    ['2026-10-09T25:00:00Z', false], ['2026-10-09T08:00:00+01:00', false],
    ['not-a-date', false], [123, false]
  ];
  for (const [date, valid] of cases) {
    const registry = registryWith({ dataAsOf: date, lastUpdated: null, updatedAt: null });
    assert.equal(registry.tools.find(tool => tool.id === 'japa-calculator').dataFreshness.status, 'unknown');
    const invalidDate = api.validateCanonicalRegistry(registry).errors.some(issue => issue.code === 'TOOL_FRESHNESS_DATE_INVALID');
    assert.equal(invalidDate, !valid, String(date));
  }
});
