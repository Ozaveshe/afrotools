"use strict";

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

// Execute the maintained controller, not a test copy of its state transitions.
// Only the browser shell/network/rendering are replaced by deterministic fakes.
const html = fs.readFileSync(process.env.SEARCH_PAGE_SOURCE || path.join(__dirname, '../search/index.html'), 'utf8');
const source = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(script => script.includes('function setQuery('));
assert.ok(source, 'maintained search controller');
const ast = acorn.parse(source, { ecmaVersion: 'latest' });
const declarations = new Map();
const listeners = new Map();
let initialIntake;
function visit(node) {
  if (!node || typeof node !== 'object') return;
  const text = source.slice(node.start, node.end);
  if (node.type === 'FunctionDeclaration' && ['setQuery', 'pushURL', 'updateClearBtns', 'readURL', 'readPrivateSearchHandoff', 'startSearch'].includes(node.id.name)) declarations.set(node.id.name, text);
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'addEventListener' && node.callee.object.type === 'Identifier') {
    const key = node.callee.object.name + ':' + node.arguments[0]?.value;
    if (['searchInput:input', 'searchClear:click', 'document:keydown'].includes(key)) listeners.set(key, text);
  }
  if (node.type === 'FunctionExpression' && node.id?.name === 'init') {
    const prefix = [];
    for (const statement of node.body.body) {
      if (statement.type !== 'ExpressionStatement') break;
      prefix.push(source.slice(statement.start, statement.end));
    }
    initialIntake = prefix.join('\n');
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(ast);
assert.equal(declarations.size, 6);
assert.equal(listeners.size, 3);
assert.ok(initialIntake, 'actual initial URL/session intake');
const controller = [...declarations.values(), ...listeners.values()].join(';\n');

function fixture({ url = '/search/', ready = true, handoff } = {}) {
  let serial = 0;
  const timers = new Map(), events = new Map(), renders = [], urls = [], storageReads = [];
  const session = new Map(handoff ? [['afrotools.privateSearchHandoff.v1', JSON.stringify(handoff)]] : []);
  const ctx = {
    state: { query: '', filter: 'all', page: 1 }, isSearchReady: ready,
    privateSearchHandoffQuery: '', PRIVATE_SEARCH_HANDOFF_KEY: 'afrotools.privateSearchHandoff.v1',
    debounceTimer: undefined, registryUnavailableTimer: undefined,
    AFRO_TOOLS: [{ id: 'pdf-workspace', name: 'PDF Workspace' }],
    location: new URL(url, 'http://search.test'), URLSearchParams,
    history: { replaceState(_state, _title, next) { ctx.location = new URL(next, ctx.location); urls.push(next); } },
    sessionStorage: { getItem(key) { storageReads.push(key); return session.get(key) || null; }, removeItem(key) { session.delete(key); } },
    document: { activeElement: null, addEventListener(name, callback) { events.set('document:' + name, callback); } },
    searchInput: { value: '', focus() { ctx.document.activeElement = this; }, select() {}, addEventListener(name, callback) { events.set('input:' + name, callback); } },
    searchClear: { classList: { toggle() {} }, addEventListener(name, callback) { events.set('clear:' + name, callback); } },
    filterPanel: null, resultsEl: { setAttribute() {} }, sortSelect: { disabled: !ready },
    syncFilterPanelAccess() {}, syncFilterUI() {}, updateChipCounts() {},
    requestSearchIndexLoad() {}, requestFullSearchIndexLoad() {},
    setTimeout(callback, delay) { assert.equal(delay, 120); timers.set(++serial, callback); return serial; },
    clearTimeout(id) { timers.delete(id); },
    doRender() { renders.push({ query: ctx.state.query, input: ctx.searchInput.value, filter: ctx.state.filter }); },
  };
  ctx.window = ctx;
  vm.runInNewContext(controller + ';\n' + initialIntake, ctx);
  return {
    ctx, renders, urls, session, storageReads,
    type(value) { ctx.searchInput.value = value; events.get('input:input').call(ctx.searchInput); },
    clear() { events.get('clear:click')(); },
    escape() { ctx.searchInput.focus(); events.get('document:keydown')({ key: 'Escape' }); },
    flush() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); },
  };
}

test('ordinary input commits the current field value to state and URL after debounce', () => {
  const f = fixture(); f.type('PDF'); f.flush();
  assert.equal(f.ctx.state.query, 'PDF'); assert.equal(f.ctx.searchInput.value, 'PDF');
  assert.equal(f.urls.at(-1), '/search?q=PDF'); assert.equal(f.renders.at(-1).query, 'PDF');
});

test('Clear supersedes a pending typed query and keeps the field, URL and results cleared', () => {
  const f = fixture(); f.type('PDF'); f.clear(); f.flush();
  assert.equal(f.ctx.state.query, ''); assert.equal(f.ctx.searchInput.value, '');
  assert.equal(f.urls.at(-1), '/search'); assert.equal(f.renders.at(-1).query, '');
  assert.equal(f.ctx.document.activeElement, f.ctx.searchInput);
});

test('Escape supersedes pending input through the actual keyboard handler', () => {
  const f = fixture(); f.type('PDF'); f.escape(); f.flush();
  assert.equal(f.ctx.state.query, ''); assert.equal(f.ctx.searchInput.value, '');
  assert.equal(f.urls.at(-1), '/search'); assert.equal(f.renders.at(-1).query, '');
});

test('an explicit replacement query cannot be overwritten by an older typed value', () => {
  const f = fixture(); f.type('PDF'); f.ctx.setQuery('Kenya PAYE'); f.flush();
  assert.equal(f.ctx.state.query, 'Kenya PAYE'); assert.equal(f.ctx.searchInput.value, 'Kenya PAYE');
  assert.equal(f.urls.at(-1), '/search?q=Kenya+PAYE'); assert.equal(f.renders.at(-1).query, 'Kenya PAYE');
});

test('continued typing and keyboard deletion retain only the newest pending value', () => {
  const f = fixture(); f.type('PDF'); f.type('VAT'); f.flush();
  assert.equal(f.ctx.state.query, 'VAT');
  f.type('PDF'); f.type(''); f.flush(); assert.equal(f.ctx.state.query, '');
});

test('initial URL query and filter still initialize before a delayed index becomes ready', () => {
  const f = fixture({ url: '/search/?q=Kenya%20PAYE&f=financial', ready: false });
  assert.equal(f.ctx.state.query, 'Kenya PAYE'); assert.equal(f.ctx.searchInput.value, 'Kenya PAYE');
  assert.equal(f.ctx.state.filter, 'financial'); assert.equal(f.ctx.startSearch(), true);
  assert.equal(f.ctx.state.query, 'Kenya PAYE'); assert.equal(f.ctx.state.filter, 'financial');
});

test('first index readiness preserves text typed before the input debounce runs', () => {
  const f = fixture({ ready: false }); f.type('PDF'); f.ctx.startSearch();
  assert.equal(f.ctx.searchInput.value, 'PDF'); f.flush();
  assert.equal(f.ctx.state.query, 'PDF'); assert.equal(f.ctx.searchInput.value, 'PDF');
  assert.equal(f.renders.at(-1).query, 'PDF'); assert.equal(f.urls.at(-1), '/search?q=PDF');
});

test('first index readiness cannot restore the initial URL over a replacement query', () => {
  const f = fixture({ url: '/search/?q=VAT', ready: false }); f.ctx.setQuery('PDF');
  f.ctx.startSearch(); f.flush(); assert.equal(f.ctx.state.query, 'PDF'); assert.equal(f.ctx.searchInput.value, 'PDF');
});

test('Clear before initial index completion remains cleared when readiness arrives', () => {
  const f = fixture({ url: '/search/?q=VAT', ready: false }); f.type('PDF'); f.clear();
  f.ctx.startSearch(); f.flush(); assert.equal(f.ctx.state.query, ''); assert.equal(f.ctx.searchInput.value, '');
});

test('private session handoff initializes once and never returns over a visitor edit', () => {
  const f = fixture({ url: '/search/?source=ask_private', ready: false, handoff: { query: 'PDF Workspace', createdAt: Date.now() } });
  assert.equal(f.ctx.searchInput.value, 'PDF Workspace'); assert.equal(f.session.size, 0);
  assert.equal(f.urls.at(-1), '/search/');
  f.type('VAT'); f.ctx.startSearch(); assert.equal(f.ctx.searchInput.value, 'VAT'); f.flush();
  assert.equal(f.ctx.state.query, 'VAT'); assert.equal(f.storageReads.length, 1);
});

test('failed or repeated readiness checks preserve current visitor input', () => {
  const f = fixture({ ready: false }); f.type('PDF'); f.ctx.AFRO_TOOLS = [];
  assert.equal(f.ctx.startSearch(), false); assert.equal(f.ctx.searchInput.value, 'PDF');
  f.ctx.AFRO_TOOLS = [{}]; assert.equal(f.ctx.startSearch(), true); f.flush();
  f.ctx.startSearch(); assert.equal(f.ctx.searchInput.value, 'PDF'); assert.equal(f.ctx.state.query, 'PDF');
});
