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
  return candidate.id === 'gratuity-calculator';
});
assert.ok(entry, 'gratuity-calculator manifest entry is missing');
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
assert.strictEqual(prefill.getPrefillAdapter('gratuity-calculator'), null);

const runtimeExecution = invocationRuntime.buildExecution({
  toolId: 'gratuity-calculator',
  selectedRoute: '/tools/gratuity-calculator/',
  toolCall: invocation,
  extractedInputs: {
    monthlyPay: 250000,
    serviceYears: 5,
    additionalMonths: 6,
    eligibleDays: 21,
    payrollDivisor: 30,
    additions: 15000,
    deductions: 5000,
    sourceLabel: 'Private final-pay rule',
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
assert.strictEqual(runtimeExecution.route, '/tools/gratuity-calculator/');

const builtContext = contextBuilder.buildAll();
const context = builtContext.contexts['gratuity-calculator'];
const facts = builtContext.records['gratuity-calculator'].sourceRecord.facts;
assert.ok(context.includes('Route users to the canonical calculator without prefill.'));
assert.ok(context.includes('No calculator or rule-source field is sent to AI.'));
assert.ok(context.includes('Exports are limited to copy, TXT and browser print-to-PDF.'));
assert.strictEqual(facts.mode, 'manual_user_input');
assert.strictEqual(facts.networkData, false);
assert.strictEqual(facts.bundledGratuityRate, false);
assert.strictEqual(facts.eligibilityDecision, false);
assert.strictEqual(facts.aiPrefill, false);
assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);
assert.deepStrictEqual(facts.exportActions, ['copy', 'txt', 'print_pdf']);

const source = sourceBuilder.buildRegistry().registry.sources.find(function (candidate) {
  return candidate.id === 'gratuity-user-input-method';
});
assert.ok(source, 'gratuity source-registry binding is missing');
assert.deepStrictEqual(source.toolIds, ['gratuity-calculator']);
assert.deepStrictEqual(source.routes, ['/tools/gratuity-calculator']);
assert.ok(source.notes.includes('cannot prefill or receive calculator or rule-source fields'));

const page = fs.readFileSync(path.join(ROOT, 'tools', 'gratuity-calculator', 'index.html'), 'utf8');
assert.ok(page.includes('This canonical planner does not supply a statutory gratuity rate.'));
assert.ok(page.includes('Rule or contract source label'));
assert.ok(page.includes('navigator.clipboard.writeText(lastEstimate)'));
assert.ok(page.includes("new Blob([lastEstimate], { type: 'text/plain;charset=utf-8' })"));
assert.ok(page.includes("link.download = 'gratuity-final-pay-estimate.txt'"));
assert.ok(page.includes('window.print()'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|\.netlify\/functions|\/api\//.test(page), 'gratuity calculator must not send form data over the network');
assert.ok(!/localStorage|sessionStorage|afrotools\.aiPrefillDraft/.test(page), 'gratuity calculator must not persist or consume calculator fields');

console.log('Gratuity AI, source, export, and privacy contract validated.');
