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
  return candidate.id === 'contractor-vs-employee';
});
assert.ok(entry, 'contractor-vs-employee manifest entry is missing');
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
assert.strictEqual(prefill.getPrefillAdapter('contractor-vs-employee'), null);

const runtimeExecution = invocationRuntime.buildExecution({
  toolId: 'contractor-vs-employee',
  selectedRoute: '/tools/contractor-vs-employee/',
  toolCall: invocation,
  extractedInputs: {
    employeeBase: 250000,
    employeeAddons: 30000,
    employeeOther: 15000,
    contractorQuote: 325000,
    contractorOther: 12000,
    contractTerms: 'Private engagement terms'
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
assert.strictEqual(runtimeExecution.route, '/tools/contractor-vs-employee/');

const builtContext = contextBuilder.buildAll();
const context = builtContext.contexts['contractor-vs-employee'];
const facts = builtContext.records['contractor-vs-employee'].sourceRecord.facts;
assert.ok(context.includes('Route users to the canonical calculator without prefill.'));
assert.ok(context.includes('No calculator or contract field is sent to AI.'));
assert.ok(context.includes('Cost arithmetic never decides worker classification.'));
assert.strictEqual(facts.mode, 'manual_user_input');
assert.strictEqual(facts.networkData, false);
assert.strictEqual(facts.aiPrefill, false);
assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
assert.strictEqual(facts.classificationVerdict, false);
assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);

const source = sourceBuilder.buildRegistry().registry.sources.find(function (candidate) {
  return candidate.id === 'contractor-vs-employee-user-input-method';
});
assert.ok(source, 'contractor-vs-employee source-registry binding is missing');
assert.deepStrictEqual(source.toolIds, ['contractor-vs-employee']);
assert.deepStrictEqual(source.routes, ['/tools/contractor-vs-employee']);
assert.ok(source.notes.includes('cannot prefill or receive calculator or contract fields'));

const page = fs.readFileSync(path.join(ROOT, 'tools', 'contractor-vs-employee', 'index.html'), 'utf8');
assert.ok(page.includes('Enter the actual recurring costs you know.'));
assert.ok(page.includes('cost does not determine worker status.'));
assert.ok(page.includes('navigator.clipboard.writeText(lastNote)'));
assert.ok(page.includes('window.print()'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|\.netlify\/functions|\/api\//.test(page), 'contractor-vs-employee calculator must not send form data over the network');
assert.ok(!/localStorage|sessionStorage|afrotools\.aiPrefillDraft/.test(page), 'contractor-vs-employee calculator must not persist or consume calculator fields');

console.log('Contractor vs Employee AI, classification, and privacy contract validated.');
