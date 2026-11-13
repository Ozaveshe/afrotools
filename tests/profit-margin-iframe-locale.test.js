'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../widgets/financial/profit-margin.js'), 'utf8');
function mount(pathname, search) {
  const footer = { href: 'https://afrotools.com/tools/profit-margin/', textContent: 'Open full tool' };
  const document = { documentElement: { lang: 'en' }, title: 'Gross Margin Calculator', querySelector: () => footer };
  const nodes = { '#aw-res': {}, '#aw-status': {}, '#aw-calc': { addEventListener() {} } };
  const root = { innerHTML: '', querySelector: selector => nodes[selector], querySelectorAll: () => [] };
  const window = { location: { pathname, search } };
  vm.runInNewContext(source, { window, document, URLSearchParams, Intl });
  window.AfroWidgets.profit_margin(root);
  return { root, document, footer };
}
for (const suffix of ['.html', '']) {
  test('French opt-in initializes metadata and controls on iframe alias ' + (suffix || '(extensionless)'), () => {
    const view = mount('/widgets/iframe/financial-profit-margin' + suffix, '?lang=fr');
    assert.match(view.root.innerHTML, /Calculateur de marge brute/);
    assert.equal(view.document.documentElement.lang, 'fr');
    assert.equal(view.document.title, 'Calculateur de marge brute - AfroTools');
    assert.equal(new URL(view.footer.href).pathname, '/fr/tools/marge-beneficiaire/');
    assert.match(view.footer.textContent, /Ouvrir le calculateur complet/);
  });
  test('Default English remains on iframe alias ' + (suffix || '(extensionless)'), () => {
    const view = mount('/widgets/iframe/financial-profit-margin' + suffix, '');
    assert.match(view.root.innerHTML, /Gross Margin Calculator/);
    assert.equal(view.document.documentElement.lang, 'en');
    assert.equal(new URL(view.footer.href).pathname, '/tools/profit-margin/');
  });
}
test('Locale query on an unrelated route does not change this widget locale', () => {
  const view = mount('/widgets/iframe/other-widget.html', '?lang=fr');
  assert.match(view.root.innerHTML, /Gross Margin Calculator/);
  assert.equal(view.document.documentElement.lang, 'en');
});
test('Unsupported iframe locale keeps English', () => {
  const view = mount('/widgets/iframe/financial-profit-margin', '?lang=unknown');
  assert.match(view.root.innerHTML, /Gross Margin Calculator/);
  assert.equal(view.document.documentElement.lang, 'en');
});
