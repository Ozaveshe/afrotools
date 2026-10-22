const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../tools/cv-builder/js/cv-career-copilot.js'), 'utf8');
function load(target = {}) {
  const nodes = { 'cv-copilot-output': { innerHTML: '' }, 'cv-copilot-statusbar': { innerHTML: '' } };
  const data = { fn: 'Test', ln: 'Applicant', title: 'Excel Analyst', summary: 'Excel reporting and data analysis', email: 'test@example.invalid', skills: { h: 'Excel', s: '', t: '' }, exps: [], edus: [], projs: [], certs: [], langs: [] };
  const window = { CVApp: { getState: () => ({ country: 'NG', data }), calcScore: () => 50 } };
  const document = { readyState: 'loading', addEventListener() {}, getElementById: id => nodes[id] || null, createElement: () => ({ set textContent(value) { this.innerHTML = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); } }) };
  const localStorage = { getItem: key => key === 'afro_cv_copilot_target' ? JSON.stringify(target) : null };
  vm.runInNewContext(source, { window, document, localStorage });
  return { api: window.CVCareerCopilot, nodes };
}
test('a populated CV without a target remains unscored and uses structure guidance', () => {
  const { api } = load(); const result = api.analyze();
  assert.equal(result.match, null); assert.equal(result.keywords.length, 0);
  assert.equal(result.matched.length, 0); assert.equal(result.missing.length, 0);
  assert.equal(result.score, Math.round(.54 * result.ats + .26 * result.readability + .2 * result.completeness));
  assert.ok(result.actions.some(action => action.startsWith('Add a target role')));
});
test('company and industry alone cannot create a target score', () => {
  assert.equal(load({ company: 'Excel', industry: 'Excel' }).api.analyze().match, null);
});
test('whitespace targets remain unscored and request a real target', () => {
  const result = load({ role: '  ', jd: '\n  ' }).api.analyze();
  assert.equal(result.match, null); assert.ok(result.actions.some(action => action.startsWith('Add a target role')));
});
test('an explicit matching role receives a real score without employer-name penalties', () => {
  const result = load({ role: 'Excel', company: 'UnrelatedCompany' }).api.analyze();
  assert.equal(result.match, 100); assert.ok(result.matched.includes('excel'));
});
test('a genuine zero-overlap target remains zero rather than unscored', () => {
  const { api, nodes } = load({ role: 'Welding' });
  assert.equal(api.analyze().match, 0); api.render();
  assert.match(nodes['cv-copilot-statusbar'].innerHTML, /<span>Match<\/span><strong>0%/);
});
test('job-description gaps remain visible', () => {
  const result = load({ jd: 'Excel SQL' }).api.analyze();
  assert.equal(result.match, 50); assert.ok(result.missing.includes('sql'));
});
test('the visitor sees Not scored and an actionable instruction before targeting', () => {
  const { api, nodes } = load(); api.render();
  assert.match(nodes['cv-copilot-statusbar'].innerHTML, /<span>Match<\/span><strong>Not scored/);
  assert.match(nodes['cv-copilot-output'].innerHTML, /<span>Job match<\/span><strong>Not scored/);
  assert.match(nodes['cv-copilot-output'].innerHTML, /Add a target role or job description to compare/);
  assert.doesNotMatch(nodes['cv-copilot-output'].innerHTML, /null%/);
});

test('saved job rows distinguish an unscored match from a genuine zero', () => {
  const start = source.indexOf('function U(){');
  const end = source.indexOf('function G(', start);
  assert.ok(start >= 0 && end > start, 'saved-job renderer boundaries exist');
  function render(match) {
    let html = '';
    const context = { l: { pipeline: [{ id: 'synthetic', role: 'Analyst', match, score: 40 }] }, v: value => String(value ?? ''), N: () => 'black', z: (_title, content) => { html = content; }, e: { getElementById: () => null, querySelectorAll: () => [] } };
    vm.runInNewContext(source.slice(start, end) + ';U();', context);
    return html;
  }
  assert.match(render(null), /Match not scored/);
  assert.match(render(0), /Match 0%/);
  assert.match(render(50), /Match 50%/);
});

test('the full job tracker preserves unscored matches through load and shared-store writeback', () => {
  const tracker = fs.readFileSync(path.join(__dirname, '../tools/cv-builder/js/src/cv-job-tracker.js'), 'utf8');
  const store = { afro_cv_job_pipeline: JSON.stringify([null, 0, 50].map((match, index) => ({ id: 'test-' + index, role: 'Analyst', country: 'NG', match }))) };
  const localStorage = { getItem: key => store[key] || null, setItem: (key, value) => { store[key] = value; } };
  const window = {};
  vm.runInNewContext(tracker, { window, document: { readyState: 'loading', addEventListener() {} }, localStorage });
  const leads = window.CVJobTracker.load();
  assert.deepEqual(Array.from(leads, lead => lead.match), [null, 0, 50]);
  const start = tracker.indexOf('    function w() {');
  const end = tracker.indexOf('    function C(', start);
  assert.ok(start >= 0 && end > start, 'maintained persistence function exists');
  vm.runInNewContext(tracker.slice(start, end) + ';w();', { a: 'afro_cv_job_pipeline', c: { leads }, f: country => country, localStorage });
  assert.deepEqual(JSON.parse(store.afro_cv_job_pipeline).map(lead => lead.match), [null, 0, 50]);
});
