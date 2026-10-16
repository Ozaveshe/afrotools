'use strict';
// Actual readable engine and account controller; SDK is an offline boundary.
// Complete maintained flow/hub inline scripts run at an event/storage seam.
// These tests do not establish native interaction or provider persistence.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(process.env.PAYROLL_CLOUD_ENGINE_INPUT || path.join(root, 'engines/src/afropayroll-os-engine.js'), 'utf8');
const cloudSource = fs.readFileSync(path.join(root, 'assets/js/lib/payroll-cloud-sync.js'), 'utf8');
const cloud = require('../assets/js/lib/payroll-cloud-sync.js');
const stamp = '2026-10-16T12:00:00.000Z';
function progress(overrides = {}) { return { country: 'NG', currentStep: 0, totalSteps: 7, carryData: { country: 'NG', salary: '12345', role: 'Synthetic role' }, stepStatuses: Array(7).fill('pending'), ...overrides }; }
function sdkFixture(options = {}) {
  let user = 'account-a', enabled = true, writes = [], reads = [], touches = 0;
  const client = { from(table) {
    touches++; assert.equal(table, 'apo_workflows');
    const query = { select(columns) { reads.push(columns); return query; }, eq() { return query; }, neq() { return query; },
      maybeSingle: async () => options.read ? options.read() : ({ data: null, error: null }),
      order: async () => options.list ? options.list() : ({ data: [], error: null }),
      upsert(body, conflict) { writes.push({ body, conflict }); return { select(columns) { reads.push(columns); return { single: async () => options.write ? options.write(body) : ({ data: { user_id: body.user_id, journey_type: body.journey_type, sync_consent_version: body.sync_consent_version, sync_consented_at: body.sync_consented_at, updated_at: stamp }, error: null }) }; } }; } };
    return query;
  } };
  const auth = { getUser: () => user ? { id: user } : null, isLoggedIn: () => !!user, getSupabase: () => options.noClient ? null : client };
  const context = { window: { AfroAuth: auth } }; vm.runInNewContext(source, context);
  return { engine: context.window.AfroTools.engines.afropayrollOs, auth, writes, reads, touches: () => touches,
    account: () => user, switch: value => { user = value; }, revoke: () => { enabled = false; },
    permission: () => ({ accountId: user, consentVersion: cloud.VERSION, consentedAt: stamp, canRequest: () => enabled }) };
}
function remote(p = progress()) { return { data: { country: p.country, current_step: p.currentStep, total_steps: p.totalSteps, carry_data: p.carryData, step_statuses: p.stepStatuses, updated_at: stamp, sync_consent_version: cloud.VERSION, sync_consented_at: stamp }, error: null }; }
function defer() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
for (const method of ['syncToSupabase', 'loadProgressFromSupabase', 'getIncompleteJourneysFromSupabase']) test('engine blocks legacy permission-free ' + method, async () => {
  const f = sdkFixture();
  const result = method === 'syncToSupabase' ? await f.engine[method]('new-hire', 'account-a', progress()) : method === 'loadProgressFromSupabase' ? await f.engine[method]('new-hire', 'account-a') : await f.engine[method]('account-a');
  assert.equal(f.touches(), 0); assert.equal(result.ok, false); assert.equal(result.reason, 'consent-required');
});
for (const change of [p => { p.accountId = 'other'; }, p => { p.consentVersion = 'old'; }, p => { p.canRequest = () => false; }, p => { p.consentedAt = ''; }]) test('engine save rejects invalid permission before SDK ' + change.toString(), async () => {
  const f = sdkFixture(), p = f.permission(); change(p); const result = await f.engine.syncToSupabase('new-hire', 'account-a', progress(), p); assert.equal(result.ok, false); assert.equal(f.touches(), 0);
});
test('engine save explicitly includes full useful copy plus consent and validates metadata acknowledgement', async () => {
  const f = sdkFixture(); const result = await f.engine.syncToSupabase('new-hire', 'account-a', progress(), f.permission());
  assert.equal(result.ok, true); assert.equal(f.writes[0].body.carry_data.salary, '12345'); assert.equal(f.writes[0].body.carry_data.role, 'Synthetic role');
  assert.equal(f.writes[0].body.sync_consent_version, cloud.VERSION); assert.equal(f.writes[0].body.sync_consented_at, stamp);
  assert.equal(f.writes[0].body.status, 'in-progress'); assert.equal(f.writes[0].body.last_completed_at, null);
  assert.equal(f.reads[0], 'user_id,journey_type,sync_consent_version,sync_consented_at,updated_at'); assert.equal(f.writes[0].conflict.onConflict, 'user_id,journey_type');
});
for (const [label, response, reason] of [
  ['SDK error', { data: null, error: { code: '42501', message: 'PRIVATE_PROVIDER_DETAIL' } }, 'request-failed'],
  ['missing relation', { data: null, error: { code: '42P01' } }, 'backend-unavailable'],
  ['schema cache missing relation', { data: null, error: { code: 'PGRST205' } }, 'backend-unavailable'],
  ['empty ACK', { data: null, error: null }, 'unconfirmed'],
  ['wrong ACK account', { data: { user_id: 'other', journey_type: 'new-hire', sync_consent_version: cloud.VERSION, sync_consented_at: stamp, updated_at: stamp } }, 'unconfirmed']
]) test('engine distinguishes ' + label, async () => {
  const f = sdkFixture({ write: async () => response }); const result = await f.engine.syncToSupabase('new-hire', 'account-a', progress(), f.permission());
  assert.equal(result.ok, false); assert.equal(result.reason, reason); assert.equal(JSON.stringify(result).includes('PRIVATE_PROVIDER_DETAIL'), false);
});
test('missing client is distinct and does not imply saved or empty copy', async () => {
  const f = sdkFixture({ noClient: true }); for (const result of [await f.engine.syncToSupabase('new-hire', 'account-a', progress(), f.permission()), await f.engine.loadProgressFromSupabase('new-hire', 'account-a', f.permission()), await f.engine.getIncompleteJourneysFromSupabase('account-a', f.permission())]) { assert.equal(result.ok, false); assert.equal(result.reason, 'client-unavailable'); }
});
for (const change of [{ totalSteps: 8 }, { currentStep: 7 }, { carryData: { country: 'KE' } }, { stepStatuses: [] }, { country: 'not-country' }, { carryData: { country: 'NG', salary: 'Infinity' } }]) test('engine rejects incompatible saved progress ' + JSON.stringify(change), async () => {
  const f = sdkFixture(); const result = await f.engine.syncToSupabase('new-hire', 'account-a', progress(change), f.permission()); assert.equal(result.reason, 'invalid-copy'); assert.equal(f.touches(), 0);
});
test('completion requires all done; skipped remains incomplete', async () => {
  const f = sdkFixture(); await f.engine.syncToSupabase('new-hire', 'account-a', progress({ stepStatuses: Array(7).fill('skipped') }), f.permission()); assert.equal(f.writes[0].body.status, 'in-progress');
  await f.engine.syncToSupabase('new-hire', 'account-a', progress({ currentStep: 7, stepStatuses: Array(7).fill('done') }), f.permission()); assert.equal(f.writes[1].body.status, 'complete'); assert.ok(f.writes[1].body.last_completed_at);
});
test('read distinguishes valid empty from SDK error and valid consented copy', async () => {
  const empty = sdkFixture(); const result = await empty.engine.loadProgressFromSupabase('new-hire', 'account-a', empty.permission()); assert.equal(result.ok, true); assert.equal(result.progress, null);
  const error = sdkFixture({ read: async () => ({ error: { code: '42P01' } }) }); assert.equal((await error.engine.loadProgressFromSupabase('new-hire', 'account-a', error.permission())).reason, 'backend-unavailable');
  const good = sdkFixture({ read: async () => remote() }); assert.equal((await good.engine.loadProgressFromSupabase('new-hire', 'account-a', good.permission())).progress.carryData.role, 'Synthetic role');
});
test('read rejects unconsented legacy and malformed copies', async () => {
  for (const data of [{ ...remote().data, sync_consent_version: undefined }, { ...remote().data, step_statuses: [] }, { ...remote().data, updated_at: 'invalid' }]) {
    const f = sdkFixture({ read: async () => ({ data }) }); assert.equal((await f.engine.loadProgressFromSupabase('new-hire', 'account-a', f.permission())).reason, 'invalid-copy');
  }
});
test('late SDK save acknowledgement is ignored after revocation/account change', async () => {
  for (const change of ['revoke', 'switch']) {
    const d = defer(), f = sdkFixture({ write: () => d.promise }); const request = f.engine.syncToSupabase('new-hire', 'account-a', progress(), f.permission());
    if (change === 'switch') f.switch('account-b'); else f.revoke();
    d.resolve({ data: { user_id: 'account-a', journey_type: 'new-hire', sync_consent_version: cloud.VERSION, sync_consented_at: stamp, updated_at: stamp } }); assert.equal((await request).reason, 'cancelled');
  }
});
test('metadata list reads no private carry fields and rejects SDK errors', async () => {
  const f = sdkFixture(); const result = await f.engine.getIncompleteJourneysFromSupabase('account-a', f.permission()); assert.equal(result.ok, true); assert.equal(result.journeys.length, 0); assert.doesNotMatch(f.reads[0], /carry_data|salary|role/);
  const bad = sdkFixture({ list: async () => ({ error: { code: '42501' } }) }); assert.equal((await bad.engine.getIncompleteJourneysFromSupabase('account-a', bad.permission())).ok, false);
});
function controllerFixture(options = {}) {
  let account = 'account-a', statuses = [], restores = [], undos = [], snapshot = progress(), grants = [], backups = [];
  const engine = options.engine || { syncToSupabase: async (...args) => { grants.push(args); return { ok: true }; }, loadProgressFromSupabase: async (...args) => { grants.push(args); return { ok: true, progress: progress() }; } };
  const controller = cloud.create({ engine, journeyId: 'new-hire', account: () => account, status: text => statuses.push(text), snapshot: () => snapshot,
    confirm: () => options.confirm !== false, backup: () => { backups.push('backup'); return options.backupFailure ? null : { saved: 'local' }; }, restore: p => { restores.push(p); return true; }, undo: p => { undos.push(p); return true; } });
  return { controller, grants, backups, restores, undos, statuses, switch: value => { account = value; }, last: () => statuses.at(-1), setSnapshot: value => { snapshot = value; } };
}
test('controller default and anonymous state make zero requests; consent alone makes zero requests', async () => {
  const f = controllerFixture(); await f.controller.save(); await f.controller.load(); assert.equal(f.grants.length, 0);
  f.switch(''); assert.equal(f.controller.consent(true), false); await f.controller.save(); assert.equal(f.grants.length, 0);
  f.switch('account-a'); assert.equal(f.controller.consent(true), true); assert.equal(f.grants.length, 0);
});
test('explicit save is account bound and supplies action timestamp without altering copy', async () => {
  const f = controllerFixture(); f.controller.consent(true); assert.equal(await f.controller.save(), true); assert.equal(f.grants.length, 1); assert.equal(f.grants[0][1], 'account-a'); assert.equal(f.grants[0][3].consentVersion, cloud.VERSION); assert.ok(Number.isFinite(Date.parse(f.grants[0][3].consentedAt))); assert.equal(f.restores.length, 0); assert.match(f.last(), /was saved/);
});
test('account switch/logout requires fresh consent and keeps device copy', async () => {
  const f = controllerFixture(); f.controller.consent(true); f.switch('account-b'); f.controller.accountChanged(); await f.controller.save(); assert.equal(f.grants.length, 0); assert.equal(f.restores.length, 0);
  f.controller.consent(true); await f.controller.save(); assert.equal(f.grants[0][1], 'account-b'); f.switch(''); f.controller.accountChanged(); await f.controller.load(); assert.equal(f.grants.length, 1);
});
for (const event of ['edit', 'off', 'account']) test('late load cannot replace local draft after ' + event, async () => {
  const d = defer(), f = controllerFixture({ engine: { loadProgressFromSupabase: () => d.promise } }); f.controller.consent(true); const request = f.controller.load();
  if (event === 'edit') f.controller.changed(); else if (event === 'off') f.controller.consent(false); else { f.switch('account-b'); f.controller.accountChanged(); }
  d.resolve({ ok: true, progress: progress() }); assert.equal(await request, false); assert.equal(f.restores.length, 0); assert.equal(f.backups.length, 0);
});
test('late save ACK never claims newer edits saved', async () => {
  const d = defer(), f = controllerFixture({ engine: { syncToSupabase: () => d.promise } }); f.controller.consent(true); const request = f.controller.save(); f.controller.changed(); d.resolve({ ok: true }); assert.equal(await request, false); assert.doesNotMatch(f.last(), /was saved/); assert.match(f.last(), /newer device changes/);
});
test('restore cancellation and backup failure preserve local draft', async () => {
  for (const options of [{ confirm: false }, { backupFailure: true }]) { const f = controllerFixture(options); f.controller.consent(true); assert.equal(await f.controller.load(), false); assert.equal(f.restores.length, 0); }
});
test('confirmed restore retains backup and Undo restores it without cloud write', async () => {
  const f = controllerFixture(); f.controller.consent(true); assert.equal(await f.controller.load(), true); assert.equal(f.backups.length, 1); assert.equal(f.restores.length, 1); assert.equal(f.controller.undo(), true); assert.equal(f.undos[0].saved, 'local'); assert.equal(f.grants.length, 1);
});
test('missing backend is honest and local-only remains available', async () => {
  const f = controllerFixture({ engine: { syncToSupabase: async () => ({ ok: false, reason: 'backend-unavailable' }) } }); f.controller.consent(true); assert.equal(await f.controller.save(), false); assert.match(f.last(), /storage is unavailable/); assert.match(f.last(), /device copy is unchanged/); assert.doesNotMatch(f.last(), /was saved/);
});
async function actualFlow(options = {}) {
  const prior = fs.readFileSync(path.join(root, 'tests/afropayroll-guided-flow-state.test.js'), 'utf8');
  const start = prior.indexOf('async function fixture('), end = prior.indexOf('\nconst saved =', start);
  const html = fs.readFileSync(path.join(root, 'tools/afropayroll-os/flow.html'), 'utf8');
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('function showComplete('));
  let context; const events = {}, docEvents = {};
  const instrumented = { ...vm, createContext(value) {
    context = value; value.window.AfroAuth = options.auth; value.window.confirm = () => options.confirm !== false;
    value.window.addEventListener = (name, callback) => { (events[name] ||= []).push(callback); };
    value.document.addEventListener = (name, callback) => { (docEvents[name] ||= []).push(callback); };
    return vm.createContext(value);
  }, runInContext(input, value) { const result = vm.runInContext(input, value); if (input === source) vm.runInContext(cloudSource, value); return result; } };
  const fixture = vm.runInNewContext('(' + prior.slice(start, end) + ')', { html, script, engineSource: source, vm: instrumented, URLSearchParams, assert });
  const f = await fixture(options);
  return { ...f, context, events, edit(id, value) { f.node(id).value = value; for (const callback of docEvents.input || []) callback({ target: f.node(id) }); },
    authChange() { for (const callback of events['afro-auth-change'] || []) callback(); }, async action(id) { f.click(id); await new Promise(resolve => setImmediate(resolve)); },
    grant(value = true) { f.node('apo-account-consent').checked = value; f.node('apo-account-consent').dispatch('change'); } };
}
test('actual signed-in flow Start/Next/resume makes no cloud request or unsupported claim', async () => {
  const sdk = sdkFixture(), f = await actualFlow({ auth: sdk.auth, resume: true, country: 'NG' }); f.click('apo-start-btn'); f.click('apo-next-btn'); assert.equal(sdk.touches(), 0); assert.doesNotMatch(f.node('apo-sync-note').textContent, /now syncs/); assert.equal(f.node('apo-account-save').disabled, true); assert.equal(f.progress().country, 'NG');
});
test('actual flow consent then explicit Save sends selected account and preserves device draft', async () => {
  const sdk = sdkFixture(), f = await actualFlow({ auth: sdk.auth, salary: '12345' }); f.node('setup-role').value = 'Synthetic role'; f.click('apo-start-btn'); f.grant(); assert.equal(sdk.touches(), 0); await f.action('apo-account-save'); assert.equal(sdk.writes.length, 1); assert.equal(sdk.writes[0].body.carry_data.salary, '12345'); assert.equal(f.progress().carryData.role, 'Synthetic role'); assert.match(f.node('apo-account-status').textContent, /was saved/);
});
test('actual flow confirmed account restore stays review-only and Undo recovers typed setup fields', async () => {
  const sdk = sdkFixture({ read: async () => remote(progress({ country: 'KE', totalSteps: 7, carryData: { country: 'KE', salary: '7654', role: 'Remote synthetic' } })) });
  const f = await actualFlow({ auth: sdk.auth, salary: '12345' }); f.edit('setup-role', 'Unstarted typed local'); f.grant(); await f.action('apo-account-load');
  assert.equal(f.node('setup-country').value, 'KE'); assert.equal(f.node('setup-role').value, 'Remote synthetic'); assert.equal(f.node('apo-flow-layout').style.display, 'none'); assert.equal(sdk.writes.length, 0); assert.equal(f.node('apo-account-undo').hidden, false);
  await f.action('apo-account-undo'); assert.equal(f.node('setup-role').value, 'Unstarted typed local'); assert.equal(f.node('setup-salary').value, '12345'); assert.equal(f.store.has('apo_journey_new-hire'), false); assert.ok(f.store.has('apo_restore_backup_new-hire'));
});
test('actual flow edit during account load is preserved; no backup/restore occurs', async () => {
  const d = defer(), sdk = sdkFixture({ read: () => d.promise }), f = await actualFlow({ auth: sdk.auth }); f.grant(); f.click('apo-account-load'); f.edit('setup-role', 'Later local edit'); d.resolve(remote()); await new Promise(resolve => setImmediate(resolve)); assert.equal(f.node('setup-role').value, 'Later local edit'); assert.equal(f.store.has('apo_restore_backup_new-hire'), false);
});
test('actual flow account switch clears checkbox and stops future SDK writes', async () => {
  const sdk = sdkFixture(), f = await actualFlow({ auth: sdk.auth }); f.click('apo-start-btn'); f.grant(); sdk.switch('account-b'); f.authChange(); await f.action('apo-account-save'); assert.equal(f.node('apo-account-consent').checked, false); assert.equal(sdk.touches(), 0); assert.ok(f.progress().country);
});
test('actual flow failed local backup refuses account restore and retains typed draft', async () => {
  const sdk = sdkFixture({ read: async () => remote() }), f = await actualFlow({ auth: sdk.auth, salary: '12345' }); f.edit('setup-role', 'Retained local draft');
  const original = f.context.localStorage.setItem; f.context.localStorage.setItem = (key, value) => { if (key.startsWith('apo_restore_backup_')) throw Error('storage unavailable'); original(key, value); };
  f.grant(); await f.action('apo-account-load'); assert.equal(f.node('setup-role').value, 'Retained local draft'); assert.equal(f.node('apo-account-undo').hidden, undefined); assert.match(f.node('apo-account-status').textContent, /Nothing was replaced/);
});
test('actual flow restores active local checklist and uncommitted carry edit on Undo', async () => {
  const sdk = sdkFixture({ read: async () => remote() }), f = await actualFlow({ auth: sdk.auth, salary: '' }); f.click('apo-start-btn');
  f.edit('carry-salary', '23456'); const before = JSON.stringify(f.progress()); f.grant(); await f.action('apo-account-load'); await f.action('apo-account-undo');
  assert.equal(JSON.stringify(f.progress()), before); assert.equal(f.node('carry-salary').value, '23456'); assert.equal(f.node('apo-flow-layout').style.display, 'block');
});
test('actual flow SDK failure never announces account save success or logs provider detail', async () => {
  const sdk = sdkFixture({ write: async () => ({ error: { code: '42501', message: 'PRIVATE_PROVIDER_DETAIL' } }) }), f = await actualFlow({ auth: sdk.auth }); f.click('apo-start-btn'); f.grant(); await f.action('apo-account-save');
  assert.match(f.node('apo-account-status').textContent, /request failed/); assert.doesNotMatch(f.node('apo-account-status').textContent, /was saved|PRIVATE_PROVIDER_DETAIL/); assert.equal(f.progress().country, 'NG');
});
test('actual hub waits for grant AND explicit list action, reads metadata only, and clears on account change', async () => {
  const sdk = sdkFixture({ list: async () => ({ data: [{ journey_type: 'new-hire', current_step: 1, total_steps: 7, updated_at: stamp, status: 'in-progress', sync_consent_version: cloud.VERSION, sync_consented_at: stamp }] }) });
  const html = fs.readFileSync(path.join(root, 'tools/afropayroll-os/index.html'), 'utf8');
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes('function showResumeBanner('));
  const nodes = new Map(), events = {};
  function node(tag = 'div') { return { tagName: tag, listeners: {}, children: [], style: {}, textContent: '', addEventListener(type, callback) { this.listeners[type] = callback; }, appendChild(child) { this.children.push(child); } }; }
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(match[1], node());
  const document = { getElementById: id => nodes.get(id), createElement: node, querySelectorAll: () => [] };
  const context = { window: { AfroAuth: sdk.auth, addEventListener: (name, callback) => { events[name] = callback; } }, document, localStorage: { getItem: () => null }, console, encodeURIComponent };
  vm.createContext(context); vm.runInContext(source, context); vm.runInContext(cloudSource, context); await vm.runInContext(script, context);
  assert.equal(sdk.touches(), 0); const checkbox = nodes.get('apo-account-consent'); checkbox.checked = true; checkbox.listeners.change(); assert.equal(sdk.touches(), 0);
  await nodes.get('apo-account-load').listeners.click(); assert.equal(sdk.touches(), 1); assert.doesNotMatch(sdk.reads[0], /carry_data|salary|role/);
  const link = nodes.get('apo-account-journeys').children[0].children[0]; assert.equal(link.href, 'flow.html?journey=new-hire'); assert.doesNotMatch(link.textContent, /Pro/);
  sdk.switch('account-b'); events['afro-auth-change'](); assert.equal(checkbox.checked, false); assert.equal(nodes.get('apo-account-load').disabled, true); assert.equal(nodes.get('apo-account-journeys').textContent, '');
});
