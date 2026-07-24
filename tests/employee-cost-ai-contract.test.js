#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifestApi = require('../assets/js/ai/tool-manifest.js');
const prefill = require('../assets/js/ai/prefill-adapters.js');
const invocationRuntime = require('../assets/js/ai/tool-invocation-runtime.js');
const contextBuilder = require('../scripts/build-ai-tool-context.js');
const sourceBuilder = require('../scripts/build-source-registry.js');

const entry = manifestApi.loadDefaultToolManifest().find(function (candidate) {
  return candidate.id === 'employee-cost';
});
assert.ok(entry, 'employee-cost manifest entry is missing');
assert.deepStrictEqual(entry.aiCapabilities, ['route_only']);
assert.deepStrictEqual(entry.requiredInputs, []);
assert.deepStrictEqual(entry.optionalInputs, []);
assert.deepStrictEqual(entry.outputTypes, ['number', 'report', 'pdf']);
assert.strictEqual(entry.privacyMode, 'browser_local');
assert.strictEqual(entry.sourcePolicy, 'user_input');
assert.deepStrictEqual(entry.monetizationSurfaces, []);

const invocation = manifestApi.buildToolInvocation(entry);
assert.strictEqual(invocation.action, 'open_existing_tool');
assert.strictEqual(invocation.invocationMode, 'route_only');
assert.strictEqual(invocation.canPrefill, false);
assert.strictEqual(prefill.getPrefillAdapter('employee-cost'), null);

const runtimeExecution = invocationRuntime.buildExecution({
  toolId: 'employee-cost',
  selectedRoute: '/tools/employee-cost/',
  toolCall: invocation,
  extractedInputs: {
    salary: 250000,
    employerObligations: 25000,
    benefits: 18000,
    sourceLabel: 'Private payroll source'
  }
});
assert.strictEqual(runtimeExecution.action, 'open_existing_tool');
assert.strictEqual(runtimeExecution.invocationMode, 'route_only');
assert.strictEqual(runtimeExecution.canPrefill, false);
assert.strictEqual(runtimeExecution.supported, false);
assert.strictEqual(runtimeExecution.payloadReady, false);
assert.strictEqual(runtimeExecution.payload, null);
assert.deepStrictEqual(runtimeExecution.normalizedInputs, {});
assert.strictEqual(runtimeExecution.storagePolicy, 'none');
assert.strictEqual(runtimeExecution.route, '/tools/employee-cost/');

const builtContext = contextBuilder.buildAll();
const context = builtContext.contexts['employee-cost'];
const facts = builtContext.records['employee-cost'].sourceRecord.facts;
assert.ok(context.includes('Route users to the canonical calculator without prefill.'));
assert.ok(context.includes('No salary, cost or source field is sent to AI.'));
assert.strictEqual(facts.mode, 'manual_user_input');
assert.strictEqual(facts.networkData, false);
assert.strictEqual(facts.aiPrefill, false);
assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);

const source = sourceBuilder.buildRegistry().registry.sources.find(function (candidate) {
  return candidate.id === 'employee-cost-user-input-method';
});
assert.ok(source, 'employee-cost source-registry binding is missing');
assert.deepStrictEqual(source.toolIds, ['employee-cost']);
assert.deepStrictEqual(source.routes, ['/tools/employee-cost']);
assert.ok(source.notes.includes('cannot prefill or receive those calculator fields'));

const page = fs.readFileSync(path.join(ROOT, 'tools', 'employee-cost', 'index.html'), 'utf8');
assert.ok(page.includes('The canonical planner supplies no statutory rate.'));
assert.ok(page.includes("new Blob([lastBrief], { type: 'text/plain;charset=utf-8' })"));
assert.ok(page.includes('window.print()'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|\.netlify\/functions|\/api\//.test(page), 'employee-cost calculator must not send form data over the network');
assert.ok(!page.includes('afrotools.aiPrefillDraft'), 'employee-cost must not consume an AI prefill payload');

console.log('Employee Cost AI and privacy contract validated.');
