#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const router = require('../assets/js/ai/intent-router.js');
const manifestApi = require('../assets/js/ai/tool-manifest.js');

const ROOT = path.resolve(__dirname, '..');
const evalSet = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'ai', 'fr-fintech-banking-intent-eval.json'),
  'utf8'
));
const parity = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json'),
  'utf8'
));
const manifest = manifestApi.getToolManifestForRouter();

assert.strictEqual(evalSet.expectedApps, 31);
assert.strictEqual(evalSet.cases.length, 31);
assert.strictEqual(parity.routes.length, 31);
assert.strictEqual(new Set(evalSet.cases.map((entry) => entry.toolId)).size, 31);

for (const entry of evalSet.cases) {
  const decision = router.routeDeterministically(entry.query, { manifest, locale: 'fr' });
  const validation = router.validateRouterOutput(decision);
  assert.deepStrictEqual(validation.errors, [], entry.query);
  assert.strictEqual(decision.selectedToolId, entry.toolId, entry.query);
  assert.strictEqual(decision.selectedRoute.split('?')[0], entry.route, entry.query);
  assert.strictEqual(decision._meta.localeRoute.locale, 'fr', entry.query);
  assert.strictEqual(decision._meta.localeRoute.status, 'mapped', entry.query);
  assert.ok(fs.existsSync(path.join(ROOT, entry.route.replace(/^\/+|\/+$/g, ''), 'index.html')), entry.route);
}

console.log(`French Fintech AI routing: ${evalSet.cases.length}/${evalSet.expectedApps} exact routes passed.`);
