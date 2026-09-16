'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function calculate(daily, hours = 6) {
  const context = {window: {}, OVERTIME_RULES: {TEST: {name: 'Synthetic', currency: 'USD', standardHours: {daily, weekly: 45}, overtimeRate: {weekday: 1.5}}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../engines/src/hr-engine.js'), 'utf8'), context);
  return context.window.AfroTools.HREngine.calculateOvertime({country: 'TEST', monthlySalary: 19485, overtimeHours: hours});
}
test('six overtime hours at 1.5 equal one recorded nine-hour day, with identical value', () => {
  const result = calculate(9);
  assert.equal(result.hourlyRate, 100);
  assert.equal(result.overtimePay, 900);
  assert.equal(result.timeOffEquivalent.hours, 9);
  assert.equal(result.timeOffEquivalent.days, 1);
  assert.equal(result.timeOffEquivalent.dailyValue, 900);
  assert.equal(result.timeOffEquivalent.cashEquivalent, result.overtimePay);
  assert.equal(result.timeOffEquivalent.hoursPerDayAssumed, false);
});
test('missing daily hours disclose the eight-hour assumption; zero hours stay zero', () => {
  const result = calculate(undefined);
  assert.equal(result.timeOffEquivalent.days, 1.125);
  assert.equal(result.timeOffEquivalent.hoursPerDayAssumed, true);
  assert.equal(calculate(9, 0).timeOffEquivalent.cashEquivalent, 0);
  assert.equal(calculate(9, 0).timeOffEquivalent.days, 0);
});
test('Swahili owner preserves the localized planning comparison', () => {
  const captured = new Map();
  const fakeFs = {...fs, mkdirSync() {}, writeFileSync(file, content) {captured.set(file.replace(/\\/g, '/'), content);}};
  const filename = path.join(__dirname, '../scripts/build-sw-salary-tool-pages.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {require: name => name === 'fs' ? fakeFs : require(name), __dirname: path.dirname(filename), process: {argv: []}, console});
  const html = [...captured].find(([file]) => file.endsWith('/sw/zana/kikokotoo-muda-wa-ziada/index.html'))[1];
  assert.ok(html.includes('Ulinganisho wa kupanga:'));
  assert.ok(html.includes('var comparison = result.timeOffEquivalent;'));
  assert.ok(!html.includes('cashIsBetter'));
  assert.ok(!html.includes('Planning comparison:'));
});
