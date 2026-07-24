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
  return candidate.id === 'domestic-worker';
});
assert.ok(entry, 'domestic-worker manifest entry is missing');
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
assert.strictEqual(prefill.getPrefillAdapter('domestic-worker'), null);

const runtimeExecution = invocationRuntime.buildExecution({
  toolId: 'domestic-worker',
  selectedRoute: '/tools/domestic-worker/',
  toolCall: invocation,
  extractedInputs: {
    basePay: 90000,
    legalFloor: 70000,
    hoursPerWeek: 45,
    overtimeMultiplier: 1.5,
    employerContribution: 5,
    sourceLabel: 'Private labour authority notice',
    sourceDate: '2026-07-01',
    contractStatus: 'draft',
    notes: 'Private household terms'
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
assert.strictEqual(runtimeExecution.route, '/tools/domestic-worker/');

const builtContext = contextBuilder.buildAll();
const context = builtContext.contexts['domestic-worker'];
const facts = builtContext.records['domestic-worker'].sourceRecord.facts;
assert.ok(context.includes('Route users to the canonical calculator without prefill.'));
assert.ok(context.includes('No calculator, source or contract-readiness field is sent to AI.'));
assert.ok(context.includes('Exports are limited to copy, TXT and browser print-to-PDF.'));
assert.strictEqual(facts.mode, 'manual_user_input');
assert.strictEqual(facts.networkData, false);
assert.strictEqual(facts.bundledWageRate, false);
assert.strictEqual(facts.aiPrefill, false);
assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);
assert.deepStrictEqual(facts.exportActions, ['copy', 'txt', 'print_pdf']);

const source = sourceBuilder.buildRegistry().registry.sources.find(function (candidate) {
  return candidate.id === 'domestic-worker-user-input-method';
});
assert.ok(source, 'domestic-worker source-registry binding is missing');
assert.deepStrictEqual(source.toolIds, ['domestic-worker']);
assert.deepStrictEqual(source.routes, ['/tools/domestic-worker']);
assert.ok(source.notes.includes('cannot prefill or receive calculator, source or contract-readiness fields'));

const page = fs.readFileSync(path.join(ROOT, 'tools', 'domestic-worker', 'index.html'), 'utf8');
assert.ok(page.includes('AfroTools does not hard-code official domestic-worker rates here.'));
assert.ok(page.includes('Wage source date'));
assert.ok(page.includes('navigator.clipboard.writeText(lastSummary)'));
assert.ok(page.includes('new Blob([lastSummary], { type: "text/plain;charset=utf-8" })'));
assert.ok(page.includes('a.download = "domestic-worker-salary-plan.txt"'));
assert.ok(page.includes('window.print()'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|\.netlify\/functions|\/api\//.test(page), 'domestic-worker calculator must not send form data over the network');
assert.ok(!/localStorage|sessionStorage|afrotools\.aiPrefillDraft/.test(page), 'domestic-worker calculator must not persist or consume calculator fields');

console.log('Domestic Worker AI, source, export, and privacy contract validated.');
