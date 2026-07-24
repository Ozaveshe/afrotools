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
  return candidate.id === 'retrenchment-calculator';
});
assert.ok(entry, 'retrenchment-calculator manifest entry is missing');
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
assert.strictEqual(prefill.getPrefillAdapter('retrenchment-calculator'), null);

const runtimeExecution = invocationRuntime.buildExecution({
  toolId: 'retrenchment-calculator',
  selectedRoute: '/tools/retrenchment-calculator/',
  toolCall: invocation,
  extractedInputs: {
    monthlyPay: 250000,
    serviceYears: 7,
    additionalMonths: 4,
    severanceWeeks: 1,
    noticeMonths: 1,
    leaveDays: 10,
    payrollDivisor: 30,
    otherAmounts: 15000,
    deductions: 5000,
    sourceLabel: 'Private retrenchment rule',
    sourceDate: '2026-07-01'
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
assert.strictEqual(runtimeExecution.route, '/tools/retrenchment-calculator/');

const builtContext = contextBuilder.buildAll();
const context = builtContext.contexts['retrenchment-calculator'];
const facts = builtContext.records['retrenchment-calculator'].sourceRecord.facts;
assert.ok(context.includes('Route users to the canonical calculator without prefill.'));
assert.ok(context.includes('No pay, service, package, or rule-source field is sent to AI or stored in local or session storage.'));
assert.ok(context.includes('Exports are limited to copy, TXT and browser print-to-PDF.'));
assert.strictEqual(facts.mode, 'manual_user_input');
assert.strictEqual(facts.networkData, false);
assert.strictEqual(facts.bundledSeveranceRule, false);
assert.strictEqual(facts.lawfulnessDecision, false);
assert.strictEqual(facts.aiPrefill, false);
assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
assert.strictEqual(facts.sensitiveFieldsPersisted, false);
assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);
assert.deepStrictEqual(facts.exportActions, ['copy', 'txt', 'print_pdf']);

const source = sourceBuilder.buildRegistry().registry.sources.find(function (candidate) {
  return candidate.id === 'retrenchment-user-input-method';
});
assert.ok(source, 'retrenchment source-registry binding is missing');
assert.deepStrictEqual(source.toolIds, ['retrenchment-calculator']);
assert.deepStrictEqual(source.routes, ['/tools/retrenchment-calculator']);
assert.ok(source.notes.includes('cannot prefill or receive calculator or rule-source fields'));
assert.ok(source.notes.includes('does not persist the summary'));

const page = fs.readFileSync(path.join(ROOT, 'tools', 'retrenchment-calculator', 'index.html'), 'utf8');
const planner = fs.readFileSync(path.join(ROOT, 'tools', 'retrenchment-calculator', 'verified-planner.js'), 'utf8');
assert.ok(page.includes('Official rule or contract source'));
assert.ok(page.includes('/tools/retrenchment-calculator/verified-planner.js'));
assert.ok(planner.includes('navigator.clipboard.writeText'));
assert.ok(planner.includes('retrenchment-package-estimate.txt'));
assert.ok(planner.includes('window.print()'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|\.netlify\/functions|\/api\//.test(page + '\n' + planner), 'retrenchment calculator must not send form data over the network');
assert.ok(!/localStorage|sessionStorage|afrotools\.aiPrefillDraft/.test(page + '\n' + planner), 'retrenchment calculator must not persist or consume sensitive calculator fields');

console.log('Retrenchment AI, governing-rule, export, and sensitive-data contract validated.');
