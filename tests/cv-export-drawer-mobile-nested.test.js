'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(process.env.CV_DRAWER_CSS || path.join(root, 'tools/cv-builder/css/cv-export-empty-polish.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'tools/cv-builder/js/cv-ats-plain-mode.js'), 'utf8');
// Execute the maintained modal opener and its actual attached callbacks. The
// tiny DOM models focus/events only; it does not implement containment logic.
const openSource = source.slice(source.indexOf('    function u() {'), source.indexOf('    function f() {'));
assert.match(openSource, /function closePlain/);

function setup() {
  const events = {};
  const open = new Set();
  const document = { activeElement: null, querySelector: () => overlay };
  function node(name) {
    return { name, isConnected: true, value: '', focus() { document.activeElement = this; } };
  }
  const opener = node('ATS plain opener');
  const close = node('Close');
  const editor = node('Editable ATS CV text');
  const copyButton = node('Copy');
  const txt = node('Download TXT');
  const pdf = node('Download ATS Plain PDF');
  const controls = [close, editor, copyButton, txt, pdf];
  const overlay = {
    classList: { add: x => open.add(x), remove: x => open.delete(x) },
    addEventListener(type, fn) { (events[type] ||= []).push(fn); },
    querySelector: () => editor,
    querySelectorAll: () => controls,
  };
  const context = { e: document, s: () => 'Synthetic local CV', copy: {}, t: {} };
  vm.runInNewContext(openSource + '\nthis.openModal = u;', context);
  opener.focus();
  context.openModal();
  function key(key, shiftKey = false) {
    const event = { key, shiftKey, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    for (const fn of events.keydown || []) fn(event);
    return event;
  }
  function click(target) { for (const fn of events.click || []) fn({ target }); }
  return { document, context, opener, close, editor, pdf, overlay, open, key, click };
}

test('drawer Close stays in normal flow rather than covering scrolled export controls', () => {
  const rule = css.match(/\.cv-export-drawer-close\{([^}]+)\}/)[1];
  assert.match(rule, /(?:^|;)position:static(?:;|$)/);
  assert.doesNotMatch(rule, /position:(?:sticky|fixed|absolute)/);
  assert.match(css, /\.cv-export-drawer-close:focus-visible/);
});
test('actual nested ATS opener focuses editable text and remembers its parent opener', () => {
  const h = setup();
  assert.equal(h.document.activeElement, h.editor);
  assert.equal(h.overlay.__returnFocus, h.opener);
  assert.equal(h.editor.value, 'Synthetic local CV');
  assert.equal(h.open.has('open'), true);
});
test('actual nested ATS Tab wraps last control to Close', () => {
  const h = setup(); h.pdf.focus();
  assert.equal(h.key('Tab').prevented, true);
  assert.equal(h.document.activeElement, h.close);
});
test('actual nested ATS ShiftTab wraps Close to final PDF control', () => {
  const h = setup(); h.close.focus();
  assert.equal(h.key('Tab', true).prevented, true);
  assert.equal(h.document.activeElement, h.pdf);
});
test('Escape closes only nested modal, stops parent Escape, and restores opener', () => {
  const h = setup(); const event = h.key('Escape');
  assert.equal(event.prevented, true); assert.equal(event.stopped, true);
  assert.equal(h.open.has('open'), false);
  assert.equal(h.document.activeElement, h.opener);
});
test('Close and backdrop return focus; reopening refreshes return target without duplicate listeners', () => {
  const h = setup();
  h.click({ closest: selector => selector === '[data-export-close]' ? h.close : null });
  assert.equal(h.document.activeElement, h.opener);
  h.pdf.focus(); h.context.openModal();
  assert.equal(h.document.activeElement, h.editor);
  h.overlay.closest = () => null; h.click(h.overlay);
  assert.equal(h.document.activeElement, h.pdf);
  assert.equal(h.open.has('open'), false);
});
