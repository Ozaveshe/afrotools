'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../fr/tools/formateur-json/index.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]).find(x => x.includes("getElementById('jsonFormatterForm')"));
assert.ok(script, 'execute the actual maintained French formatter inline implementation');
const oldInput = '{"ancien":1}', newInput = '{"nouveau":[2,true,null,"é"]}';
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function actualTool(options = {}) {
  const nodes = {}, copies = [], downloads = [], pending = [], timers = [], writes = [], stored = new Map(), blobs = new Map(); let requests = 0;
  for (const id of ['jsonFormatterForm', 'jsonInput', 'jsonOutput', 'jsonStatus', 'jsonValidity', 'jsonSize', 'jsonKeys', 'jsonDepth', 'jsonMinify', 'jsonRepair', 'jsonSample', 'jsonCopy', 'jsonDownload']) {
    nodes[id] = { value: id === 'jsonInput' ? (options.input ?? oldInput) : '', textContent: id === 'jsonCopy' ? 'Copier' : '', listeners: {}, selected: 0, classList: { toggle(name, value) { this[name] = value; } }, select() { this.selected++; }, addEventListener(type, fn) { this.listeners[type] = fn; } };
  }
  const navigator = {};
  if (!options.noClipboard) navigator.clipboard = { writeText(text) { copies.push(text); if (options.deferred) return new Promise((resolve, reject) => pending.push({ resolve, reject })); if (options.reject) return Promise.reject(Error('synthetic clipboard denied')); return Promise.resolve(); } };
  const context = { document: { getElementById: id => nodes[id], body: { appendChild() {} }, createElement(tag) { assert.equal(tag, 'a'); return { click() { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); }, remove() {} }; } }, navigator,
    localStorage: { setItem(key, value) { if (options.storageDenied) throw Error('synthetic storage denied'); writes.push([key, value]); stored.set(key, value); } }, Blob, Intl,
    URL: { createObjectURL(blob) { const id = 'blob:fixture-' + blobs.size; blobs.set(id, blob); return id; }, revokeObjectURL() {} }, setTimeout(fn) { timers.push(fn); }, fetch() { requests++; throw Error('No network in closed formatter regression'); } };
  vm.runInNewContext(script, context, { filename: 'actual-fr-json-formatter.js', timeout: 1000 });
  return { nodes, copies, downloads, pending, timers, writes, stored, requestCount: () => requests,
    edit(value) { nodes.jsonInput.value = value; nodes.jsonInput.listeners.input?.({ target: nodes.jsonInput }); },
    click(id) { nodes[id].listeners.click(); }, submit() { nodes.jsonFormatterForm.listeners.submit({ preventDefault() {} }); } };
}

test('Example creates genuine JSON and a validated matching formatted result', () => {
  const f = actualTool(); f.click('jsonSample');
  const value = JSON.parse(f.nodes.jsonInput.value); assert.equal(value.country, 'Sénégal'); assert.equal(value.items[0].count, 3);
  assert.deepEqual(JSON.parse(f.nodes.jsonOutput.value), value); assert.equal(f.nodes.jsonValidity.textContent, 'Valide'); assert.equal(f.requestCount(), 0);
});

test('Copy revalidates changed current valid input even when no input event was dispatched', async () => {
  const f = actualTool(); f.nodes.jsonInput.value = newInput; f.click('jsonCopy'); await flush();
  assert.deepEqual(JSON.parse(f.copies[0]), JSON.parse(newInput)); assert.equal(f.copies[0], f.nodes.jsonOutput.value); assert.equal(f.nodes.jsonValidity.textContent, 'Valide');
});

test('Download revalidates changed current valid input and uses the actual JSON file payload', async () => {
  const f = actualTool(); f.nodes.jsonInput.value = newInput; f.click('jsonDownload');
  assert.equal(f.downloads.length, 1); assert.equal(f.downloads[0].filename, 'afrotools-json-formate.json');
  assert.deepEqual(JSON.parse(await f.downloads[0].blob.text()), JSON.parse(newInput)); assert.equal(f.requestCount(), 0);
});

for (const invalid of ['{', '', '   ']) test('invalid or empty current input refuses stale Copy/Download: ' + JSON.stringify(invalid), async () => {
  const f = actualTool(); const saved = f.writes.length; f.nodes.jsonInput.value = invalid; f.click('jsonCopy'); await flush(); f.click('jsonDownload');
  assert.equal(f.copies.length, 0); assert.equal(f.downloads.length, 0); assert.equal(f.nodes.jsonOutput.value, ''); assert.equal(f.nodes.jsonValidity.textContent, 'Invalide');
  assert.equal(f.writes.length, saved); assert.notEqual(f.nodes.jsonCopy.textContent, 'Copié'); assert.equal(f.requestCount(), 0);
});

test('invalid rendered output cannot copy an empty string then falsely report Valide', async () => {
  const f = actualTool({ input: '{' }); f.click('jsonCopy'); await flush();
  assert.equal(f.copies.length, 0); assert.equal(f.nodes.jsonValidity.textContent, 'Invalide'); assert.equal(f.nodes.jsonOutput.value, '');
});

test('unchanged Minifier output keeps its exact compact bytes for Copy and Download', async () => {
  const f = actualTool({ input: newInput }); f.click('jsonMinify'); const compact = f.nodes.jsonOutput.value, writes = f.writes.length;
  assert.equal(compact, newInput); f.click('jsonCopy'); await flush(); f.click('jsonDownload');
  assert.equal(f.copies[0], compact); assert.equal(await f.downloads[0].blob.text(), compact); assert.equal(f.writes.length, writes);
});

test('real input edit invalidates old output/metrics/status and a later format recovers', () => {
  const f = actualTool(); f.edit(newInput); assert.equal(f.nodes.jsonOutput.value, ''); assert.equal(f.nodes.jsonValidity.textContent, 'À vérifier');
  for (const id of ['jsonSize', 'jsonKeys', 'jsonDepth']) assert.equal(f.nodes[id].textContent, '-');
  assert.match(f.nodes.jsonStatus.textContent, /Entrée modifiée/); f.submit(); assert.deepEqual(JSON.parse(f.nodes.jsonOutput.value), JSON.parse(newInput)); assert.equal(f.nodes.jsonValidity.textContent, 'Valide');
});

test('pending successful clipboard completion cannot bless an edited invalid input', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.edit('{'); const state = f.nodes.jsonStatus.textContent;
  f.pending[0].resolve(); await flush(); assert.equal(f.nodes.jsonValidity.textContent, 'À vérifier'); assert.equal(f.nodes.jsonStatus.textContent, state); assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); assert.equal(f.timers.length, 0);
});

test('edit A to B to A still invalidates an earlier clipboard completion', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.edit(newInput); f.edit(oldInput); f.submit(); const state = f.nodes.jsonStatus.textContent;
  f.pending[0].resolve(); await flush(); assert.equal(f.nodes.jsonStatus.textContent, state); assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); assert.equal(f.timers.length, 0);
});

test('re-rendering identical input invalidates an older clipboard success', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.click('jsonMinify'); const state = f.nodes.jsonStatus.textContent;
  f.pending[0].resolve(); await flush(); assert.equal(f.nodes.jsonStatus.textContent, state); assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); assert.equal(f.nodes.jsonOutput.value, oldInput);
});

test('old clipboard rejection must not select an edited output', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.edit('{'); f.pending[0].reject(Error('synthetic denial')); await flush();
  assert.equal(f.nodes.jsonOutput.selected, 0); assert.equal(f.nodes.jsonValidity.textContent, 'À vérifier');
});

test('a newer Copy invalidates both success and rejection of earlier clipboard operations', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.click('jsonCopy'); f.pending[0].resolve(); await flush();
  assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); f.pending[1].resolve(); await flush(); assert.equal(f.nodes.jsonCopy.textContent, 'Copié');
  f.click('jsonCopy'); f.click('jsonCopy'); f.pending[2].reject(Error('old denial')); await flush(); assert.equal(f.nodes.jsonOutput.selected, 0);
  f.pending[3].resolve(); await flush(); assert.equal(f.nodes.jsonCopy.textContent, 'Copié');
});

test('a later Download keeps its status when an earlier clipboard completion arrives', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.click('jsonDownload'); const state = f.nodes.jsonStatus.textContent;
  assert.match(state, /téléchargement/); f.pending[0].resolve(); await flush(); assert.equal(f.nodes.jsonStatus.textContent, state); assert.equal(f.nodes.jsonCopy.textContent, 'Copier');
});

test('current clipboard denial or absence selects current validated output without false copy success', async () => {
  for (const options of [{ reject: true }, { noClipboard: true }]) {
    const f = actualTool(options); f.nodes.jsonInput.value = newInput; f.click('jsonCopy'); await flush();
    assert.deepEqual(JSON.parse(f.nodes.jsonOutput.value), JSON.parse(newInput)); assert.equal(f.nodes.jsonOutput.selected, 1); assert.notEqual(f.nodes.jsonCopy.textContent, 'Copié'); assert.doesNotMatch(f.nodes.jsonStatus.textContent, /presse-papiers/);
  }
});

test('an older delayed label reset cannot clear a newer successful copy label', async () => {
  const f = actualTool(); f.click('jsonCopy'); await flush(); assert.equal(f.timers.length, 1);
  f.edit(newInput); f.click('jsonCopy'); await flush(); assert.equal(f.nodes.jsonCopy.textContent, 'Copié');
  f.timers[0](); assert.equal(f.nodes.jsonCopy.textContent, 'Copié'); f.timers[1](); assert.equal(f.nodes.jsonCopy.textContent, 'Copier');
});

test('successful render still overwrites one last-result storage key and storage denial does not block formatting', () => {
  const f = actualTool(); f.edit(newInput); f.submit(); assert.equal(f.stored.size, 1); assert.equal(f.stored.get('afrotools_json_formatter_fr_v1'), f.nodes.jsonOutput.value);
  const last = f.stored.get('afrotools_json_formatter_fr_v1'); f.edit(''); f.submit(); assert.equal(f.stored.get('afrotools_json_formatter_fr_v1'), last);
  const denied = actualTool({ storageDenied: true }); assert.deepEqual(JSON.parse(denied.nodes.jsonOutput.value), JSON.parse(oldInput)); assert.equal(denied.nodes.jsonValidity.textContent, 'Valide');
});


test('Download resets an already successful Copy label before its guarded old timer runs', async () => {
  const f = actualTool(); f.click('jsonCopy'); await flush(); assert.equal(f.nodes.jsonCopy.textContent, 'Copié'); assert.equal(f.timers.length, 1);
  f.click('jsonDownload'); const status = f.nodes.jsonStatus.textContent; assert.match(status, /téléchargement/);
  assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); f.timers[0](); assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); assert.equal(f.nodes.jsonStatus.textContent, status);
});


test('a rejected second Copy cannot retain the old success label or message after its old timer runs', async () => {
  const f = actualTool({ deferred: true }); f.click('jsonCopy'); f.pending[0].resolve(); await flush(); assert.equal(f.nodes.jsonCopy.textContent, 'Copié');
  assert.match(f.nodes.jsonStatus.textContent, /Résultat copié/); f.click('jsonCopy'); assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); assert.match(f.nodes.jsonStatus.textContent, /Copie en cours/);
  f.pending[1].reject(Error('new synthetic denial')); await flush(); f.timers[0]();
  assert.equal(f.nodes.jsonCopy.textContent, 'Copier'); assert.equal(f.nodes.jsonOutput.selected, 1); assert.match(f.nodes.jsonStatus.textContent, /Copie automatique indisponible/);
  assert.doesNotMatch(f.nodes.jsonStatus.textContent, /Résultat copié/); assert.equal(f.nodes.jsonValidity.textContent, 'Valide');
});
