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
  return candidate.id === 'maternity-leave';
});
assert.ok(entry, 'maternity-leave manifest entry is missing');
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
assert.strictEqual(prefill.getPrefillAdapter('maternity-leave'), null);

const runtimeExecution = invocationRuntime.buildExecution({
  toolId: 'maternity-leave',
  selectedRoute: '/tools/maternity-leave/',
  toolCall: invocation,
  extractedInputs: {
    monthlySalary: 250000,
    startDate: '2026-08-01',
    plannedDays: 90,
    requestedDays: 100,
    payRate: 80,
    companyDays: 112,
    companyRate: 100,
    sourceLabel: 'Private official leave rule',
    sourceDate: '2026-07-01',
    leaveNotes: 'Private employee circumstances'
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
assert.strictEqual(runtimeExecution.route, '/tools/maternity-leave/');

const builtContext = contextBuilder.buildAll();
const context = builtContext.contexts['maternity-leave'];
const facts = builtContext.records['maternity-leave'].sourceRecord.facts;
assert.ok(context.includes('Route users to the canonical planner without prefill.'));
assert.ok(context.includes('No leave, pay, source, notes, or policy field is sent to AI or stored in local or session storage.'));
assert.ok(context.includes('Exports are limited to copy, TXT and browser print-to-PDF.'));
assert.strictEqual(facts.mode, 'manual_user_input');
assert.strictEqual(facts.networkData, false);
assert.strictEqual(facts.bundledLeaveRule, false);
assert.strictEqual(facts.officialRuleRequired, true);
assert.strictEqual(facts.aiPrefill, false);
assert.strictEqual(facts.sensitiveFieldsSentToAI, false);
assert.strictEqual(facts.sensitiveFieldsPersisted, false);
assert.deepStrictEqual(facts.outputs, ['number', 'report', 'pdf']);
assert.deepStrictEqual(facts.exportActions, ['copy', 'txt', 'print_pdf']);

const source = sourceBuilder.buildRegistry().registry.sources.find(function (candidate) {
  return candidate.id === 'parental-leave-user-input-method';
});
assert.ok(source, 'parental-leave source-registry binding is missing');
assert.deepStrictEqual(source.toolIds, ['maternity-leave']);
assert.deepStrictEqual(source.routes, ['/tools/maternity-leave']);
assert.ok(source.notes.includes('cannot prefill or receive those fields'));
assert.ok(source.notes.includes('does not persist the summary'));

const page = fs.readFileSync(path.join(ROOT, 'tools', 'maternity-leave', 'index.html'), 'utf8');
const planner = fs.readFileSync(path.join(ROOT, 'tools', 'maternity-leave', 'verified-planner.js'), 'utf8');
assert.ok(page.includes('Official rule source label'));
assert.ok(page.includes('/tools/maternity-leave/verified-planner.js'));
assert.ok(page.includes('The verified leave planner did not load.'));
assert.ok(!page.includes('id="saveScenario"'));
assert.ok(planner.includes('Based only on the official-rule values entered above.'));
assert.ok(planner.includes('navigator.clipboard.writeText'));
assert.ok(planner.includes('parental-leave-planning-summary.txt'));
assert.ok(planner.includes('window.print()'));
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|\.netlify\/functions|\/api\//.test(page + '\n' + planner), 'maternity leave planner must not send form data over the network');
assert.ok(!/localStorage|sessionStorage|afrotools\.aiPrefillDraft|maternity-leave:last-summary/.test(page + '\n' + planner), 'maternity leave planner must not persist or consume sensitive calculator fields');

console.log('Maternity Leave AI, official-rule, export, and sensitive-data contract validated.');
