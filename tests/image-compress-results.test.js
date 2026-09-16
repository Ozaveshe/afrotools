const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/lib/image-compress-studio.js'), 'utf8');
function functionSource(name, next) {
  const start = source.indexOf('    function ' + name + '(');
  const end = source.indexOf('    function ' + next + '(', start);
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}
test('size changes distinguish larger exports, savings and waiting', () => {
  const context = vm.createContext({});
  vm.runInContext(functionSource('savingsLabel', 'renderMetrics'), context);
  assert.equal(context.savingsLabel(1000, 1200, 1), '20.0% larger');
  assert.equal(context.savingsLabel(1000, 600, 0), '40% saved');
  assert.equal(context.savingsLabel(1000, 1000, 1), '0.0% saved');
  assert.equal(context.savingsLabel(1000, 0, 0), 'Waiting');
});
test('comparison slider reaches both edges and midpoint', () => {
  const context = vm.createContext({ compareSlider: { value: '0' }, afterImage: { style: {} }, compareLine: { style: {} } });
  vm.runInContext(functionSource('updateCompare', 'renderAll'), context);
  for (const value of [0, 50, 100]) {
    context.compareSlider.value = String(value);
    context.updateCompare();
    assert.equal(context.afterImage.style.clipPath, 'inset(0 0 0 ' + value + '%)');
    assert.equal(context.compareLine.style.left, value + '%');
  }
});
