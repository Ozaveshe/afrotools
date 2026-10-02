const assert = require('node:assert/strict');
const router = require('../assets/js/ai/intent-router.js');
const manifestApi = require('../assets/js/ai/tool-manifest.js');
const manifest = manifestApi.getToolManifestForRouter();

for (const query of ['jollof rice recipe', 'How do I cook injera?', 'thieboudienne recipe', 'African recipes', 'Open my cookbook', 'What can I cook tonight?', 'weekly cooking plan']) {
  const result = router.routeDeterministically(query, { manifest });
  assert.equal(result.selectedToolId, 'afrokitchen', query);
  assert.equal(result.selectedRoute.split('?')[0], '/tools/afrokitchen/', query);
  assert.equal(result.privacyMode, 'browser_local');
  assert.equal(result._meta.providerUsed, false);
  assert.equal(result.canPrefill, false);
  assert.equal(result.handoffPlan.payloadLocation, 'none');
  assert.ok(!result.selectedRoute.includes(encodeURIComponent(query)));
}
for (const [query, tool] of [
  ['rice farm yield estimate', 'crop-yield-estimator'],
  ['tilapia fish farming ROI', 'fish-farming-roi'],
  ['create a receipt', 'invoice-generator'],
  ['write a CV for a chef', 'cv-builder'],
  ['find scholarships', 'scholarship-finder'],
  ['purple moon bicycle', 'tool-search']
]) assert.equal(router.routeDeterministically(query, { manifest }).selectedToolId, tool, query);

const missing = router.routeDeterministically('jollof rice recipe', { manifest: manifest.filter(tool => tool.id !== 'afrokitchen') });
assert.notEqual(missing.selectedToolId, 'afrokitchen', 'Never return an unregistered destination');
const kitchen = manifest.find(tool => tool.id === 'afrokitchen');
assert.deepEqual(kitchen.aiCapabilities, ['route_only']);
assert.ok(kitchen.userIntents.includes('African recipes'));
console.log('AfroKitchen discovery: recipe queries, existing routes, local-only contract and negative controls passed.');
