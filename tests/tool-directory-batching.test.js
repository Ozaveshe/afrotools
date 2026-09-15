const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Exercise the page's real renderer with synthetic records and a minimal DOM.
const html = fs.readFileSync(path.join(__dirname, '../tools/index.html'), 'utf8');
const renderer = html.slice(html.indexOf('  var categoryLimits = {}'), html.indexOf("  container.addEventListener('click'"));
function fixture() {
  const summary = {};
  const context = {
    AFRO_TOOLS: Array.from({ length: 40 }, (_, i) => ({ name: 'Tool ' + i, desc: 'Utility', category: 'test', lang: i === 39 ? 'ha' : 'en', status: 'live', href: '/tool-' + i, priority: 40 - i })),
    AFRO_CATEGORIES: { test: { name: 'Test category' } },
    searchInput: { value: '' }, activeFilter: 'all', activeGoal: '',
    countryFilter: { value: 'all' }, statusFilter: { value: 'all' }, languageFilter: { value: 'all' }, sortFilter: { value: 'popular' },
    normalizeText: text => text.toLowerCase(), goalMatches: () => true,
    inferCountries: () => ['ALL'], statusKey: tool => tool.status,
    scoreToolSearch: (tool, tokens) => tokens.every(token => tool.name.toLowerCase().includes(token)) ? 1 : 0,
    updatedLabel: () => '2026-09-15', uiInitials: () => 'T', esc: text => text,
    BG_MAP: {}, ACCENT_MAP: {}, arrowSvg: '', container: {}, noResults: { style: {} },
    document: { getElementById: () => summary }, window: {}, updateGoalContext() {}
  };
  vm.createContext(context);
  vm.runInContext(renderer, context);
  return { context, summary, render: () => vm.runInContext('render()', context) };
}
test('directory expands without duplicates and resets batches when filters change', () => {
  const { context, summary, render } = fixture();
  render();
  assert.equal(summary.textContent, 'Showing 8 of 40 matching tools.');
  context.categoryLimits.test = 32;
  render();
  assert.equal(summary.textContent, 'Showing 32 of 40 matching tools.');
  const links = [...context.container.innerHTML.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(links).size, 32);
  context.sortFilter.value = 'name';
  render();
  assert.equal(summary.textContent, 'Showing 8 of 40 matching tools.');
});
test('search and language filters include records beyond the first batch', () => {
  const { context, summary, render } = fixture();
  context.searchInput.value = 'Tool 39';
  render();
  assert.equal(summary.textContent, 'Showing 1 of 1 matching tools.');
  assert.match(context.container.innerHTML, /href="\/tool-39"/);
  context.searchInput.value = '';
  context.languageFilter.value = 'ha';
  render();
  assert.equal(summary.textContent, 'Showing 1 of 1 matching tools.');
  context.searchInput.value = 'missing';
  render();
  assert.equal(context.noResults.style.display, 'block');
  assert.equal(summary.textContent, 'Showing 0 of 0 matching tools.');
});
