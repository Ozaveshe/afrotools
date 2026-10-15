'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let checks = 0;
for (const code of fs.readdirSync(path.join(root, 'data/agriculture')).filter(f => /^[a-z]{2}-agri-data\.js$/.test(f))) {
  const context = vm.createContext({ window: { AfroTools: {} } });
  for (const file of ['data/agriculture/crop-database.js', 'data/agriculture/seed-data.js', 'data/agriculture/seed-data-extension.js', `data/agriculture/${code}`, ...['irrigation', 'seed-rate', 'fertilizer', 'crop-yield'].map(f => `engines/src/${f}-engine.js`)]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  const api = context.window.AfroTools, country = api.countryData;
  const input = { cropId: 'maize', regionId: country.regions[0].id, farmSizeHa: 1, irrigationMethod: 'furrow', month: 0, growthStage: 'flowering', plantingMethod: 'direct', seedQuality: 'improved', fieldConditions: 'average', intercrop: 'sole', soilType: 'loamy' };
  const calls = [
    p => api.IrrigationEngine.calculate(p, country, api.cropDatabase.crops),
    p => api.SeedRateEngine.calculate(p, api.seedData, code.slice(0, 2).toUpperCase(), country),
    p => api.FertilizerEngine.calculate(p, country, api.cropDatabase),
    p => api.CropYieldEngine.calculate(p, country, api.cropDatabase)
  ];
  for (const calculate of calls) for (const farmSizeHa of ['', ' ', 0, -1, Infinity, NaN, 'abc', null, undefined]) {
    assert.equal(calculate({ ...input, farmSizeHa }).error, true, `${code}: invalid area ${farmSizeHa}`); checks++;
  }
  for (const field of ['rowSpacing_cm', 'plantSpacing_cm', 'seedsPerHole']) for (const value of [0, -1, Infinity, 'abc']) {
    assert.equal(calls[1]({ ...input, [field]: value }).error, true); checks++;
  }
  assert.equal(calls[1]({ ...input, seedsPerHole: 1.5 }).error, true); checks++;
  for (const field of ['organicMatter', 'P_ppm', 'K_ppm']) for (const value of [-1, Infinity, 'abc']) {
    assert.equal(calls[2]({ ...input, soilTest: { [field]: value } }).error, true); checks++;
  }
  for (const value of [0, -1, Infinity, 'abc']) { assert.equal(calls[2]({ ...input, targetYieldPerHa: value }).error, true); checks++; }
  for (const month of [-1, 13, 1.5, Infinity]) { assert.equal(calls[0]({ ...input, month }).error, true); checks++; }
  assert.equal(calls[0]({ ...input, irrigationMethod: 'unknown' }).error, true); checks++;
}
console.log(`Agriculture invalid-input regression: ${checks} checks passed.`);

// English farm-profit / fish-farming controllers must reject invalid area before engine invocation.
// Execute the real generator-owned controller bodies; a sentinel stops valid calls at the engine boundary.
(function verifyEnglishProfitAreaControllers() {
  const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const root = path.resolve(__dirname, '..');
  for (const family of ['farm-profit', 'fish-farming']) {
    const source = fs.readFileSync(path.join(root, 'scripts', `generate-${family}-pages.js`), 'utf8');
    const farm = family === 'farm-profit', areaId = farm ? 'inpFarm' : 'inpArea';
    const errorId = farm ? 'profitAreaError' : 'fishAreaError', resultId = farm ? 'resultsPanel' : 'resultsWrap';
    const helperStart = source.indexOf(farm ? '  function invalidateFarmAreaResult()' : '  function invalidateFishAreaResult()');
    const functionStart = source.indexOf(farm ? '  window.calculate = function () {' : '  function calculate() {');
    const functionEnd = farm ? source.indexOf('\n  };\n\n})();', functionStart) + '\n  };'.length : source.indexOf('\n  // ── render', functionStart);
    assert.ok(functionStart >= 0 && functionEnd > functionStart, `${family}: controller extraction`);
    const nodes = new Map(), engineStop = {}, calls = [];
    function node(id) {
      if (!nodes.has(id)) {
        const classes = new Set(['on']), attrs = {}, handlers = {};
        nodes.set(id, { value: '0', textContent: '', focused: false, checked: false,
          classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
          setAttribute: (k,v) => { attrs[k]=v; }, removeAttribute: k => { delete attrs[k]; }, getAttribute: k => attrs[k],
          focus() { this.focused=true; }, addEventListener: (type,fn) => { handlers[type]=fn; }, handlers });
      }
      return nodes.get(id);
    }
    node('areaUnit').textContent='(m²)';
    const engine = { calculate: inputs => { calls.push(inputs); throw engineStop; } };
    const context = vm.createContext({ window: { AquaData:{}, AquaROI:engine }, $:node, ENG:engine, CD:{}, FC:{}, D:null, COUNTRY_CODE:'NG', alert:message=>assert.fail(`Unexpected alert: ${message}`) });
    // Baseline lacks helpers: still execute its original controller and detect the engine call.
    if (helperStart >= 0 && helperStart < functionStart) vm.runInContext(source.slice(helperStart,functionStart),context);
    vm.runInContext(source.slice(functionStart,functionEnd),context);
    const calculate = farm ? context.window.calculate : context.calculate;
    const minimumInvalid = farm ? '0.01' : '0.5';
    for (const value of ['', ' ', '0', '-1', minimumInvalid, 'Infinity', 'NaN', '1e309', 'abc']) {
      node(areaId).value=value; node(areaId).focused=false; node(resultId).classList.add('on');
      let caught; try { calculate(); } catch (error) { caught=error; }
      assert.equal(calls.length,0,`${family}: invalid area ${JSON.stringify(value)} must not invoke engine`);
      assert.equal(caught,undefined,`${family}: invalid calculation must recover without throwing`);
      assert.equal(node(resultId).classList.contains('on'),false,`${family}: stale result hidden`);
      assert.ok(node(errorId).textContent.length>0,`${family}: visible error text`);
      assert.equal(node(areaId).getAttribute('aria-invalid'),'true');
      assert.equal(node(areaId).focused,true);
    }
    node(areaId).value=farm?'2':'200';
    let caught; try { calculate(); } catch(error) { caught=error; }
    assert.equal(caught,engineStop,`${family}: valid input reaches existing engine`);
    assert.equal(calls.length,1);
    assert.equal(calls[0][farm?'farmSizeHa':'pondArea'],farm?2:200);
    assert.equal(node(errorId).textContent,'');
    assert.equal(node(areaId).getAttribute('aria-invalid'),undefined);
    for (const event of ['input','change']) {
      node(resultId).classList.add('on'); node(errorId).textContent='old error'; node(areaId).setAttribute('aria-invalid','true');
      assert.equal(typeof node(areaId).handlers[event],'function'); node(areaId).handlers[event]();
      assert.equal(node(resultId).classList.contains('on'),false);
      assert.equal(node(errorId).textContent,'');
      assert.equal(node(areaId).getAttribute('aria-invalid'),undefined);
    }
    assert.match(source,new RegExp(`id="${areaId}"[^>]*aria-describedby="${errorId}"`));
    assert.match(source,new RegExp(`id="${errorId}"[^>]*role="alert"`));
    console.log(`English ${family} real controller: 9 invalid values, valid engine handoff and input/change recovery passed.`);
  }
})();
