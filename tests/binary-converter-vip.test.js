const assert = require('node:assert/strict');
const engine = require('../tools/binary-converter/binary-converter-engine.js');

function output(conversion, base) {
  return conversion.outputs.find(item => item.base === base);
}

function run() {
  const binary = engine.convert('1010', 2, [2, 8, 10, 16]);
  assert.equal(binary.ok, true);
  assert.equal(output(binary, 10).value, '10');
  assert.equal(output(binary, 8).value, '12');
  assert.equal(output(binary, 16).value, 'A');

  const hex = engine.convert('FF', 16, [2, 8, 10, 16]);
  assert.equal(output(hex, 2).value, '11111111');
  assert.equal(output(hex, 8).value, '377');
  assert.equal(output(hex, 10).value, '255');

  const exactFraction = engine.convert('10.625', 10, [2, 8, 10, 16]);
  assert.equal(output(exactFraction, 2).value, '1010.101');
  assert.equal(output(exactFraction, 16).value, 'A.A');
  assert.equal(output(exactFraction, 2).exact, true);

  const repeating = engine.convert('0.1', 10, [2], { maxFractionDigits: 32 });
  assert.equal(output(repeating, 2).value, '0.0(0011)');
  assert.equal(output(repeating, 2).repeating, true);

  const truncated = engine.convert('0.1', 10, [2], { maxFractionDigits: 2 });
  assert.equal(output(truncated, 2).value, '0.00…');
  assert.equal(output(truncated, 2).truncated, true);

  const large = engine.convert('9007199254740993', 10, [16, 10]);
  assert.equal(output(large, 16).value, '20000000000001');
  assert.equal(output(large, 10).value, '9007199254740993');

  const negative = engine.convert('-1010', 2, [10, 16]);
  assert.equal(output(negative, 10).value, '-10');
  assert.equal(output(negative, 16).value, '-A');

  assert.match(engine.parse('2', 2).error, /not valid in base 2/);
  assert.match(engine.parse('0b101', 2).error, /Choose the input base/);
  assert.match(engine.parse('1.2.3', 10).error, /one radix point/);
  assert.match(engine.parse('1 000', 10).error, /Remove spaces/);
  assert.match(engine.parse('10', 1).error, /base from 2 to 36/);
  assert.match(engine.parse('1'.repeat(513), 2).error, /512 digits/);

  const min8 = engine.twosComplement(-128n, 8);
  assert.equal(min8.ok, true);
  assert.equal(min8.bits, '10000000');
  assert.equal(engine.twosComplement(-129n, 8).ok, false);
  assert.equal(engine.twosComplement(127n, 8).bits, '01111111');

  const bitwise = engine.bitwise32('42', '27');
  assert.equal(bitwise.ok, true);
  assert.equal(bitwise.operations.find(item => item.name === 'AND').decimal, 10);
  assert.match(engine.bitwise32('42x', '27').error, /decimal integer/);
  assert.match(engine.bitwise32('2147483648', '0').error, /signed 32-bit/);

  const add = engine.binaryArithmetic(
    '100000000000000000000000000000000000000000000000000001',
    '1',
    'add',
  );
  assert.equal(add.ok, true);
  assert.equal(add.decimal, '9007199254740994');
  assert.equal(engine.binaryArithmetic('102', '1', 'add').ok, false);

  console.log('binary-converter-vip: 27 checks passed');
}

run();
