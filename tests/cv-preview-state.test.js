'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.CV_PREVIEW_SOURCE_ROOT || path.join(__dirname, '..');

function previewHarness() {
  const listeners = {}, timers = new Map(), classes = new Set();
  let time = 0, next = 0, mutation, state = { data: {} };
  const scroll = { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } } };
  const empty = { dataset: { polished: 'true' } };
  scroll.querySelector = selector => selector === '.cv-preview-empty-state' ? empty : null;
  const document = { readyState: 'loading', body: {},
    querySelector(selector) {
      return ({ '.cv-preview-scroll': scroll, '#cvpreview': {}, '.cv-preview-empty-state': empty,
        '.cv-export-drawer-backdrop': {} })[selector] || null;
    }, querySelectorAll() { return []; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
  };
  function timer(fn, delay, repeat) { const id = ++next; timers.set(id, { fn, at: time + delay, repeat }); return id; }
  const window = { CVApp: { getState: () => state }, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'tools/cv-builder/js/cv-export-empty-polish.js'), 'utf8'), {
    window, document, MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} },
    setTimeout: (fn, delay) => timer(fn, delay), clearTimeout: id => timers.delete(id),
    setInterval: (fn, delay) => timer(fn, delay, delay), clearInterval: id => timers.delete(id)
  });
  function advance(ms) {
    const end = time + ms;
    for (;;) {
      const due = [...timers].filter(([, item]) => item.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
      if (!due) break;
      time = due[1].at;
      if (due[1].repeat) due[1].at += due[1].repeat; else timers.delete(due[0]);
      due[1].fn();
    }
    time = end;
  }
  listeners.DOMContentLoaded[0]();
  advance(16000); // End the startup polling window, as on a visitor's longer editing session.
  return { advance, classes, set(data) { state = { data }; }, mutate() { mutation([]); },
    input() { listeners.input.forEach(fn => fn({})); }, change() { listeners.change.forEach(fn => fn({})); } };
}

for (const [label, data] of [['name', {fn:'Synthetic'}], ['education', {edus:[{deg:'BSc',sch:'Synthetic College'}]}],
  ['experience', {exps:[{t:'Assistant',c:'Synthetic Organisation'}]}]]) {
  test('live preview becomes visible during ongoing DOM updates after adding '+label, () => {
    const h = previewHarness();
    assert.equal(h.classes.has('cv-preview-polished-empty'), true);
    const before = JSON.stringify(data);
    h.input(); // Capture-phase input can precede the application's state update.
    h.set(data);
    for (let n=0;n<50;n++) { h.mutate(); h.advance(40); }
    assert.equal(h.classes.has('cv-preview-polished-empty'), false);
    assert.equal(JSON.stringify(data), before, 'visibility update leaves authored data intact');
  });
}
test('clearing a populated CV restores the placeholder while mutation traffic continues', () => {
  const h = previewHarness(); h.set({fn:'Synthetic'}); h.change(); h.advance(100);
  assert.equal(h.classes.has('cv-preview-polished-empty'), false);
  h.set({fn:' ',exps:[{t:' '}],edus:[{deg:' '}]}); h.input();
  for (let n=0;n<50;n++) { h.mutate(); h.advance(40); }
  assert.equal(h.classes.has('cv-preview-polished-empty'), true);
});
test('an unrelated DOM update does not expose a blank CV', () => {
  const h = previewHarness();
  for (let n=0;n<50;n++) { h.mutate(); h.advance(40); }
  assert.equal(h.classes.has('cv-preview-polished-empty'), true);
});

for (const [id, nameColor] of [['panAfricanMinimal', '#111827'], ['lagosCorporate', 'inherit']]) {
  test('document heading palette survives important site theme colors: '+id, () => {
    const window = { document: { documentElement: {lang:'en'} }, CVTemplates: {},
      CVApp: { esc: value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])) } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'tools/cv-builder/js/cv-pdf-templates.js'), 'utf8'), {window});
    const data = {fn:'Synthetic',ln:'Applicant',summary:'Authored summary',exps:[],edus:[],skills:{h:'Planning'}};
    const before = JSON.stringify(data), html = window.CVTemplates[id](data, '#0062cc');
    const headings = [...html.matchAll(/<h[12] style="([^"]*)">([^<]*)<\/h[12]>/g)];
    assert.ok(headings.length >= 2);
    assert.ok(headings[0][1].includes('color:'+nameColor+'!important;'));
    for (const [, style] of headings) assert.match(style, /color:[^;]+!important;/);
    assert.ok(html.includes('Authored summary'));
    assert.equal(JSON.stringify(data), before);
  });
}

for (const [id, expected] of [['accraGraduate','#1c1007'], ['diasporaInternational','#111827']]) {
  test('duplicate heading declarations retain the original final palette: '+id, () => {
    const window = { document: { documentElement: {lang:'en'} }, CVTemplates: {},
      CVApp: { esc: value => String(value || '') } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'tools/cv-builder/js/cv-pdf-templates.js'), 'utf8'), {window});
    const html = window.CVTemplates[id]({fn:'Synthetic',ln:'Applicant',exps:[],edus:[],skills:{}}, '#0062cc');
    const style = html.match(/<h1 style="([^"]*)"/)[1];
    const declarations = style.split(';').map(value => value.trim()).filter(value => /^color:/.test(value));
    const important = declarations.filter(value => /!important$/.test(value));
    const winner = (important.length ? important : declarations).at(-1).replace(/^color:|!important$/g,'');
    assert.equal(winner, expected, 'late intended color wins over redundant inherited color');
  });
}
