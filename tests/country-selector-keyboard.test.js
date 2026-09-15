'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function setup() {
  let Selector;
  const document = { readyState: 'loading', documentElement: { getAttribute: () => 'en' }, addEventListener() {} };
  const customElements = { get() {}, define(name, value) { Selector = value; } };
  const window = { AFRICAN_COUNTRIES: [{ code: 'NG', name: 'Nigeria', slug: 'nigeria' }], customElements, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/components/country-selector.js'), 'utf8'), {
    window, document, customElements, HTMLElement: class {}, setTimeout: fn => fn()
  });
  const selector = new Selector();
  const listeners = {};
  const element = className => ({
    classList: { contains: value => value === className },
    closest(value) { return value === '.' + className ? this : null; },
    setAttribute() {},
    focus() { selector.shadowRoot.activeElement = this; }
  });
  const trigger = element('cs-trigger');
  const search = element('cs-search');
  const options = [element('cs-option'), element('cs-option')];
  const panel = { hidden: false };
  selector.shadowRoot = {
    activeElement: search,
    addEventListener: (name, fn) => { listeners[name] = fn; },
    querySelector: query => ({ '.cs-trigger': trigger, '.cs-search': search, '.cs-panel': panel })[query],
    querySelectorAll: () => options
  };
  selector._open = true;
  selector.bind();
  function key(value, target = selector.shadowRoot.activeElement) {
    let prevented = false;
    listeners.keydown?.({ key: value, target, preventDefault() { prevented = true; }, stopPropagation() {} });
    return prevented;
  }
  return { selector, trigger, search, options, panel, key };
}

test('Escape closes the country picker and restores its trigger focus', () => {
  const fixture = setup();
  assert.equal(fixture.key('Escape'), true);
  assert.equal(fixture.selector._open, false);
  assert.equal(fixture.panel.hidden, true);
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.trigger);
});

test('arrow keys enter filtered options, move between them, and return to search', () => {
  const fixture = setup();
  fixture.key('ArrowDown');
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.options[0]);
  fixture.key('ArrowDown');
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.options[1]);
  fixture.key('ArrowUp');
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.options[0]);
  fixture.key('ArrowUp');
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.search);
  assert.equal(fixture.key('a'), false, 'ordinary typing must remain native');
});

test('Home and End navigate options without taking over search editing or Tab', () => {
  const fixture = setup();
  assert.equal(fixture.key('Home'), false);
  fixture.key('ArrowDown');
  fixture.key('End');
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.options[1]);
  fixture.key('Home');
  assert.equal(fixture.selector.shadowRoot.activeElement, fixture.options[0]);
  assert.equal(fixture.key('Tab'), false);
  fixture.selector.shadowRoot.querySelectorAll = () => [];
  assert.equal(fixture.key('ArrowDown', fixture.search), false);
});
