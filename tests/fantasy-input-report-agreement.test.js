const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const sports = require('../assets/js/sports-toolkit.js');
const config = sports.tools['fantasy-football'];
function scenario() {
  const elements = {};
  config.fields.filter(f => f.id).forEach(f => { elements[f.id] = {
    id: 'sports-' + f.id, value: String(f.value), error: '',
    setCustomValidity(v) { this.error = v; }, setAttribute() {}, removeAttribute() {}, focus() {}, reportValidity() {}
  }; });
  const listeners = {}, results = { textContent: 'old report', hidden: false };
  const form = { elements, appendChild() {}, querySelector() { return null; }, addEventListener(type, fn) { listeners[type] = fn; } };
  const document = { body: { getAttribute() { return 'fantasy-football'; } }, readyState: 'loading', documentElement: {},
    getElementById(id) { return id === 'sports-tool-form' ? form : id === 'sports-results' ? results : null; },
    createElement() { return { setAttribute() {} }; }, addEventListener() {} };
  const window = { addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/pages/day9-sports-safety.js'), 'utf8'), {
    document, window, MutationObserver: class { observe() {} }
  });
  function event(type) { let stopped = false; const e = { target: { closest() { return true; } }, preventDefault() {}, stopImmediatePropagation() { stopped = true; } }; if (listeners[type]) listeners[type](e); return stopped; }
  function calculate(values) { Object.entries(values).forEach(([k,v]) => { elements[k].value = String(v); });
    if (event('submit')) return null;
    const inputs = Object.fromEntries(Object.entries(elements).map(([k,v]) => [k,v.value]));
    return { inputs, result: sports.calculate('fantasy-football', inputs) };
  }
  return { elements, results, event, calculate };
}
test('unsupported numeric representations cannot reach scoring or report inputs', () => {
  for (const [field, value] of [['goals','1e1'], ['minutes','1e2'], ['playerPrice','0.01'], ['bonus','4'], ['goals','-1'], ['goals','1.5'], ['startProbability','101'], ['fixtureDifficulty','6']]) {
    const s = scenario(); assert.equal(s.calculate({[field]:value}), null, field + '=' + value);
    assert.ok(s.elements[field].error); assert.equal(s.results.textContent, ''); assert.equal(s.results.hidden, true);
  }
});
test('accepted raw inputs agree with actual toolkit score and per-price metric', () => {
  const s = scenario(); assert.equal(s.calculate({goals:'1e1'}), null);
  const {inputs,result} = s.calculate({goals:'10',minutes:'100',playerPrice:'0.1',bonus:'3'});
  assert.equal(inputs.goals,'10'); assert.equal(inputs.minutes,'100'); assert.equal(inputs.bonus,'3');
  assert.equal(result.heroValue,'56 pts'); assert.equal(result.metrics.find(x=>x.label==='Minutes').value, inputs.minutes);
  assert.equal(result.metrics.find(x=>x.label==='Value').value,(56/Number(inputs.playerPrice)).toFixed(2));
  assert.ok(result.rows.some(x=>x[0]==='Goals scored' && x[1]==='+50 pts'));
  assert.ok(result.rows.some(x=>x[0]==='Bonus points' && x[1]==='+3 pts'));
});
test('genuine deductions and 120 minutes remain supported, including negative totals', () => {
  const s=scenario(), {result}=s.calculate({goals:'0',minutes:'120',cleanSheet:'no',bonus:'0',redCards:'1',ownGoals:'1',penaltyMisses:'1'});
  assert.equal(result.heroValue,'-5 pts'); assert.equal(result.metrics.find(x=>x.label==='Minutes').value,'120');
  assert.ok(s.calculate({penaltySaves:'2'}));
});
test('edits clear stale export DOM and valid change/reset can restore rendering', () => {
  const s=scenario(); s.elements.goals.value='2'; s.event('input'); assert.equal(s.results.textContent,''); assert.equal(s.results.hidden,true);
  assert.equal(s.event('change'),false); assert.equal(s.results.hidden,false);
  assert.equal(s.calculate({goals:'-1'}),null); s.event('click'); assert.equal(s.elements.goals.error,''); assert.equal(s.results.hidden,false);
});
