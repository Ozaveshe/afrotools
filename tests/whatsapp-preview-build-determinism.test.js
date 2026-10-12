const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts/build-whatsapp-payroll-preview.js');
function generate(reverse, crlf) {
  let output;
  const proxy = Object.create(fs);
  proxy.readdirSync = (...args) => {
    const entries = fs.readdirSync(...args).sort();
    return reverse ? entries.reverse() : entries;
  };
  proxy.readFileSync = (...args) => {
    const source = fs.readFileSync(...args);
    if (typeof source !== 'string') return source;
    const normalized = source.replace(/\r\n/g, '\n');
    return crlf ? normalized.replace(/\n/g, '\r\n') : normalized;
  };
  proxy.mkdirSync = () => {};
  proxy.writeFileSync = (file, source) => {
    assert.equal(file, path.join(root, 'assets/js/pages/whatsapp-payroll-preview.js'));
    output = source;
  };
  vm.runInNewContext(proxy.readFileSync(script, 'utf8'), {
    require: name => name === 'fs' ? proxy : require(name),
    __dirname: path.dirname(script), process: { argv: [] }, Buffer,
    console: { log() {} },
  });
  assert.equal(typeof output, 'string');
  return output;
}
test('payroll preview is identical across directory orders and checkout line endings', () => {
  const expected = generate(false, false);
  for (const reverse of [false, true]) {
    for (const crlf of [false, true]) assert.equal(generate(reverse, crlf), expected);
  }
  assert.ok(!expected.includes('\r'));
  assert.equal(fs.readFileSync(path.join(root, 'assets/js/pages/whatsapp-payroll-preview.js'), 'utf8'), expected);
});
