const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const owner = process.env.CV_EXPORT_FOCUS_SOURCE || path.join(__dirname, '../tools/cv-builder/js/cv-export-empty-polish.js');
const source = fs.readFileSync(owner, 'utf8');
function setup() {
  const listeners = {}, classes = new Set();
  const document = { readyState: 'complete', activeElement: null, body: {} };
  function element(name, options = {}) {
    const attrs = {};
    return Object.assign({ name, tagName: 'BUTTON', type: 'button', tabIndex: 0, disabled: false, checked: false, form: null,
      classList: { add() {}, remove() {}, toggle() {} }, style: {}, dataset: {}, visibility: 'visible', visible: true,
      getClientRects() { return this.visible ? [{}] : []; }, closest() { return this.inert ? {} : null; },
      setAttribute(k, v) { attrs[k] = v; }, hasAttribute(k) { return Object.hasOwn(attrs, k); },
      focus() { document.activeElement = this; }, addEventListener() {},
    }, options);
  }
  const first = element('Close'), middle = element('Filename', { tagName: 'INPUT', type: 'text' }), last = element('Page break', { tagName: 'INPUT', type: 'checkbox' });
  const controls = [first, middle, last], opener = element('Export opener'), outside = element('Background contact link');
  const readiness = element('readiness'), title = element('title'), note = element('note');
  const shell = element('Export CV', { parentNode: document.body, children: controls,
    contains(el) { return el === this || controls.includes(el); },
    querySelectorAll() { return controls; },
    querySelector(selector) { if (selector.includes('cv-export-readiness')) return readiness; if (selector.includes('cv-export-title')) return title; if (selector.includes('cv-export-note')) return note; return first; },
  });
  const nested = element('ATS Plain Version', { visible: false });
  document.body.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) };
  document.body.appendChild = () => {};
  document.querySelector = selector => selector === '.cv-export-options' ? shell : selector === '.cv-export-drawer-backdrop' ? element('Backdrop') : null;
  document.querySelectorAll = selector => selector.includes('[role="dialog"]') ? [shell, nested] : [];
  document.addEventListener = (type, fn) => (listeners[type] ||= []).push(fn);
  const window = { addEventListener() {}, CVApp: { esc: value => String(value), getState: () => ({ data: {}, template: 'plain', country: 'NG' }) } };
  vm.runInNewContext(source, { window, document, console, getComputedStyle: el => ({ visibility: el.visibility }), setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0 });
  function key(value, shiftKey = false, defaultPrevented = false) {
    const event = { key: value, shiftKey, defaultPrevented, preventDefault() { this.defaultPrevented = true; } };
    for (const listener of listeners.keydown || []) listener(event);
    return event;
  }
  function open() { opener.focus(); window.CVBuilderPolish.openExportPanel({ currentTarget: opener }); }
  return { document, window, listeners, shell, controls, first, middle, last, opener, outside, nested, element, key, open, isOpen: () => classes.has('cv-export-drawer-open') };
}
test('Tab from last export control wraps to Close', () => { const h = setup(); h.open(); h.last.focus(); assert.equal(h.key('Tab').defaultPrevented, true); assert.equal(h.document.activeElement, h.first); });
test('Shift+Tab from Close wraps to last visible export control', () => { const h = setup(); h.open(); h.first.focus(); assert.equal(h.key('Tab', true).defaultPrevented, true); assert.equal(h.document.activeElement, h.last); });
test('middle native controls retain normal Tab behavior', () => { const h = setup(); h.open(); h.middle.focus(); assert.equal(h.key('Tab').defaultPrevented, false); assert.equal(h.key('ArrowLeft').defaultPrevented, false); assert.equal(h.document.activeElement, h.middle); });
test('hidden disabled negative-tabindex inert and visibility-hidden controls do not become boundaries', () => { const h = setup(); h.open(); for (const options of [{ visible: false }, { disabled: true }, { tabIndex: -1 }, { inert: true }, { visibility: 'hidden' }, { type: 'hidden' }]) h.controls.push(h.element('Unavailable', options)); h.last.focus(); h.key('Tab'); assert.equal(h.document.activeElement, h.first); h.first.focus(); h.key('Tab', true); assert.equal(h.document.activeElement, h.last); });
test('newly inserted select and textarea controls update the boundary without reinstalling listeners', () => { const h = setup(); h.open(); const select = h.element('Select', { tagName: 'SELECT' }), textarea = h.element('Notes', { tagName: 'TEXTAREA' }); h.controls.push(select, textarea); h.first.focus(); h.key('Tab', true); assert.equal(h.document.activeElement, textarea); textarea.focus(); h.key('Tab'); assert.equal(h.document.activeElement, h.first); });
test('Escape closes active drawer and restores its opener', () => { const h = setup(); h.open(); assert.equal(h.isOpen(), true); h.last.focus(); h.key('Escape'); assert.equal(h.isOpen(), false); assert.equal(h.document.activeElement, h.opener); });
test('closed export drawer does not steal other keyboard or Escape focus', () => { const h = setup(); h.open(); h.window.CVBuilderPolish.closeExportPanel(); h.outside.focus(); assert.equal(h.key('Tab').defaultPrevented, false); h.key('Escape'); assert.equal(h.document.activeElement, h.outside); });
test('nested ATS dialog keeps its Tab and Escape lifecycle, then parent containment resumes', () => { const h = setup(); h.open(); h.nested.visible = true; h.nested.focus(); assert.equal(h.key('Tab').defaultPrevented, false); h.key('Escape'); assert.equal(h.isOpen(), true); assert.equal(h.document.activeElement, h.nested); h.nested.visible = false; h.first.focus(); h.key('Tab', true); assert.equal(h.document.activeElement, h.last); });
test('already-handled nested events do not close parent export drawer', () => { const h = setup(); h.open(); h.key('Escape', false, true); assert.equal(h.isOpen(), true); });
test('zero enabled controls gives the dialog a programmatic focus fallback', () => { const h = setup(); h.open(); h.controls.forEach(x => { x.disabled = true; }); h.outside.focus(); assert.equal(h.key('Tab').defaultPrevented, true); assert.equal(h.document.activeElement, h.shell); assert.equal(h.shell.hasAttribute('tabindex'), true); });
test('background focus is recovered into drawer in the requested direction', () => { const h = setup(); h.open(); h.outside.focus(); h.key('Tab'); assert.equal(h.document.activeElement, h.first); h.outside.focus(); h.key('Tab', true); assert.equal(h.document.activeElement, h.last); });
test('checked radio is the tab boundary for its native group, not later unchecked peers', () => { const h = setup(); h.open(); const selected = h.element('Compact', { tagName: 'INPUT', type: 'radio', name: 'density', checked: true }), unchecked = h.element('One page', { tagName: 'INPUT', type: 'radio', name: 'density' }); h.controls.push(selected, unchecked); selected.focus(); h.key('Tab'); assert.equal(h.document.activeElement, h.first); h.first.focus(); h.key('Tab', true); assert.equal(h.document.activeElement, selected); });
test('reopening returns to first control without duplicate key handlers', () => { const h = setup(); h.open(); h.key('Escape'); h.open(); assert.equal(h.document.activeElement, h.first); assert.equal(h.listeners.keydown.length, 1); h.first.focus(); h.key('Tab', true); assert.equal(h.document.activeElement, h.last); });
