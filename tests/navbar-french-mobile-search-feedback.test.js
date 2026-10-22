const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/components/navbar.js'), 'utf8');
function between(start, end) {
  assert.equal(source.split(start).length, 2, `unique maintained source boundary: ${start}`);
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert.ok(last > first, `closing maintained source boundary: ${end}`);
  return source.slice(first, last);
}
const languageMethod = between('    _getLang() {', '\n    _ensureLocalizedMobileCss()')
  .trim().replace(/^_getLang\(\)/, 'function getLang()');
const registrySource = between('      let toolRegistryLoadPromise = null;', '      const getTools = () => {');
const feedbackSource = between('      const mobileSearchText = () => {', '      let _mobDebounce;');
const inputSource = between("      mobSearchInput?.addEventListener('input', () => {", '      // Clear mobile search when closing drawer');

// Run the actual locale method, registry loader and complete mobile input event
// handler. External DOM/script/timer boundaries are synthetic; no full navbar
// bootstrap, Auth, analytics network, browser, server or native UI is executed.
function mobilePage({ pathname = '/fr/', htmlLang = 'en', tools = [] } = {}) {
  const listeners = new Map();
  const timers = new Map();
  const queries = [];
  const captures = [];
  const documentListeners = new Map();
  const scripts = [];
  let nextTimer = 0;
  let registry = tools;
  const input = {
    value: '',
    addEventListener(name, handler) { listeners.set(name, handler); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); }
  };
  const results = { innerHTML: '' };
  const categories = { style: { display: '' } };
  const country = { style: { display: '' } };
  const business = { style: { display: '' } };
  const context = vm.createContext({
    window: { location: { pathname } },
    document: {
      documentElement: { lang: htmlLang },
      addEventListener(name, handler) {
        if (!documentListeners.has(name)) documentListeners.set(name, new Set());
        documentListeners.get(name).add(handler);
      },
      removeEventListener(name, handler) { documentListeners.get(name)?.delete(handler); },
      querySelector() { return scripts[0] || null; },
      createElement() { return { addEventListener() {} }; },
      head: { appendChild(script) { scripts.push(script); } }
    },
    navigator: { language: 'en-GB' },
    mobSearchInput: input,
    mobSearchResults: results,
    mobCategoriesWrap: categories,
    mobCountryBlock: country,
    mobBusinessBlock: business,
    setTimeout(handler, delay) {
      assert.ok(delay === 100 || delay === 200);
      timers.set(++nextTimer, { handler, delay }); return nextTimer;
    },
    clearTimeout(id) { timers.delete(id); },
    highlightMobileResult() {},
    searchTools(query) { queries.push(query); return registry; },
    Event: class { constructor(type) { this.type = type; } },
    escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    highlightMatch: value => value,
    captureSearch: (...args) => captures.push(args)
  });
  if (Array.isArray(tools)) context.AFRO_TOOLS = tools;
  const host = { _getLang: vm.runInContext(`(${languageMethod})`, context) };
  const attach = vm.runInContext(`(function() {
    ${registrySource}
    ${feedbackSource}
    let _mobDebounce;
    let _mobResultsQuery = '';
    ${inputSource}
    return {
      pendingQuery: () => _mobResultsQuery,
      ensureRegistry: ensureToolRegistry,
      registryPromise: () => toolRegistryLoadPromise
    };
  })`, context);
  const state = attach.call(host);
  return {
    input, results, categories, country, business, queries, captures, scripts,
    ...state,
    type(value) { input.value = value; input.dispatchEvent({ type: 'input' }); },
    flush() { const pending = [...timers.values()]; timers.clear(); for (const timer of pending) timer.handler(); },
    async resolveRegistry(value) {
      assert.ok(Array.isArray(value));
      registry = value;
      context.AFRO_TOOLS = value;
      for (const handler of documentListeners.get('afrotools:registry-ready') || []) handler();
      await Promise.resolve(); await Promise.resolve();
    },
    async timeoutRegistry() {
      let polls = 0;
      while ([...timers.values()].some(timer => timer.delay === 200)) {
        assert.ok(++polls <= 15, 'real loader retains its bounded 15-poll budget');
        const [id, timer] = [...timers.entries()].find(([, entry]) => entry.delay === 200);
        timers.delete(id); timer.handler();
      }
      assert.equal(polls, 15);
      await Promise.resolve(); await Promise.resolve();
    },
    pendingPolls: () => [...timers.values()].filter(timer => timer.delay === 200).length,
    registryListeners: () => documentListeners.get('afrotools:registry-ready')?.size || 0
  };
}

const demo = { href: '/fr/outil-exemple/', icon: 'X', name: 'Outil exemple', desc: 'Description de test' };

test('French mobile no-match feedback is native after the actual debounced input handler', () => {
  const page = mobilePage();
  page.type('  introuvable  ');
  assert.equal(page.results.innerHTML, '');
  page.flush();
  assert.match(page.results.innerHTML, /Aucun résultat trouvé/);
  assert.doesNotMatch(page.results.innerHTML, /No tools found/);
  assert.deepEqual(page.queries, ['introuvable']);
  assert.deepEqual(page.captures, [['introuvable', 0, 'navbar']]);
  assert.equal(page.categories.style.display, 'none');
});

test('French loading feedback transitions through the actual ready event to successful links', async () => {
  const page = mobilePage({ tools: null });
  page.type('exemple'); page.flush();
  assert.match(page.results.innerHTML, /Chargement…/);
  assert.doesNotMatch(page.results.innerHTML, /Loading tools/);
  assert.equal(page.country.style.display, 'none');
  await page.resolveRegistry([demo]);
  page.flush();
  assert.match(page.results.innerHTML, /href="\/fr\/outil-exemple\/"/);
  assert.match(page.results.innerHTML, /Outil exemple/);
  assert.equal(page.pendingQuery(), 'exemple');
});

test('French registry timeout reports a native error rather than falsely claiming no matching tools', async () => {
  const page = mobilePage({ tools: null });
  page.type('exemple'); page.flush();
  await page.timeoutRegistry();
  assert.match(page.results.innerHTML, /Une erreur s’est produite\./);
  assert.doesNotMatch(page.results.innerHTML, /Aucun résultat trouvé|No tools found|href=/);
  assert.equal(page.pendingQuery(), '');
  assert.equal(page.registryPromise(), null);
});

test('late registry failure cannot replace the current query feedback', async () => {
  const page = mobilePage({ tools: null });
  page.type('ancienne'); page.flush();
  const previous = page.results.innerHTML;
  page.type('nouvelle');
  await page.timeoutRegistry();
  assert.equal(page.results.innerHTML, previous);
  assert.equal(page.pendingQuery(), '');
});

test('unavailable registry reports exact existing localized error labels, distinct from ready empty arrays', async () => {
  for (const locale of ['en', 'fr', 'sw', 'ha', 'yo', 'hy']) {
    const page = mobilePage({ pathname: locale === 'en' || locale === 'hy' ? '/tools/' : `/${locale}/`, htmlLang: locale, tools: null });
    page.type('exemple'); page.flush();
    await page.timeoutRegistry();
    const catalogLocale = locale === 'hy' ? 'en' : locale;
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, `../lang/${catalogLocale}.json`), 'utf8'));
    assert.ok(page.results.innerHTML.includes(catalog.states.error), locale);
    assert.equal(page.registryPromise(), null);
    assert.equal(page.registryListeners(), 0);
    assert.equal(page.pendingPolls(), 0);
  }
});

test('real registry loader resets a null timeout and retries to a genuine ready empty array', async () => {
  const page = mobilePage({ tools: null });
  const first = page.ensureRegistry();
  assert.equal(page.ensureRegistry(), first, 'in-flight load is shared');
  await page.timeoutRegistry();
  assert.equal(await first, null);
  assert.equal(page.registryPromise(), null);
  const second = page.ensureRegistry();
  assert.notEqual(second, first, 'failure must not permanently poison later attempts');
  await page.resolveRegistry([]);
  const empty = await second;
  assert.ok(Array.isArray(empty));
  assert.equal(empty.length, 0);
  assert.equal(page.registryListeners(), 0);
  assert.equal(page.pendingPolls(), 0);
  page.type('introuvable'); page.flush();
  assert.match(page.results.innerHTML, /Aucun résultat trouvé/);
  assert.doesNotMatch(page.results.innerHTML, /Une erreur s’est produite/);
});

test('existing EN/SW/HA/YO and unsupported-language feedback remains unchanged', () => {
  for (const [locale, expected] of [
    ['en', 'No tools found'], ['sw', 'Hakuna zana iliyopatikana'],
    ['ha', 'Ba a sami kayan aiki ba'], ['yo', 'A kò rí irinṣẹ kankan'],
    ['hy', 'No tools found']
  ]) {
    const page = mobilePage({ pathname: locale === 'en' || locale === 'hy' ? '/tools/' : `/${locale}/`, htmlLang: locale });
    page.type('inexistant'); page.flush();
    assert.ok(page.results.innerHTML.includes(expected), locale);
  }
});

test('French successful query and clearing preserve result targets and directory visibility', () => {
  const page = mobilePage({ tools: [demo] });
  page.type('exemple'); page.flush();
  assert.match(page.results.innerHTML, /href="\/fr\/outil-exemple\/"/);
  assert.equal(page.pendingQuery(), 'exemple');
  page.type('   '); page.flush();
  assert.equal(page.results.innerHTML, '');
  assert.equal(page.pendingQuery(), '');
  assert.equal(page.categories.style.display, '');
  assert.equal(page.country.style.display, '');
  assert.equal(page.business.style.display, '');
});
