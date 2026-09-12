'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { testBatches, runTestBatches } = require('../scripts/run-tests');

const files = Array.from({ length: 900 }, (_, index) =>
  'tests/a-long-enrolled-regression-test-name-' + index + '.test.js');

test('large enrollment runs every file exactly once within the command budget', () => {
  const batches = testBatches(files);
  assert.ok(batches.length > 1);
  assert.deepEqual(batches.flat(), files);
  for (const batch of batches) {
    assert.ok(batch.length > 0);
    assert.ok(batch.reduce((size, file) => size + file.length * 2 + 3, 0) <= 24000);
  }
  assert.deepEqual(testBatches([]), []);
  assert.throws(() => testBatches(['x'.repeat(24000)]), /exceeds command budget/);
});

test('an early failing batch cannot be hidden by later successful batches', async () => {
  const enrolled = [];
  let calls = 0;
  const result = await runTestBatches(files, async (command, args) => {
    assert.equal(command, process.execPath);
    assert.deepEqual(args.slice(0, 3), [
      '--test', '--test-concurrency=4', '--test-timeout=120000',
    ]);
    enrolled.push(...args.slice(3));
    calls += 1;
    return calls === 1 ? 1 : 0;
  });
  assert.equal(result, 1);
  assert.ok(calls > 1);
  assert.deepEqual(enrolled, files);
  assert.equal(await runTestBatches(files, async () => 0), 0);
});

test('full JAMB evidence stays enrolled once with its own bounded runtime', async () => {
  const evidence = path.join('tests', 'jamb-answer-verification-evidence.test.js');
  const input = [files[0], evidence, files[1]];
  const enrolled = [];
  const result = await runTestBatches(input, async (command, args) => {
    const batch = args.slice(3);
    enrolled.push(...batch);
    if (batch.includes(evidence)) {
      assert.deepEqual(batch, [evidence]);
      assert.equal(args[2], '--test-timeout=600000');
      return 1;
    }
    assert.equal(args[2], '--test-timeout=120000');
    return 0;
  });
  assert.deepEqual(enrolled.sort(), input.sort());
  assert.equal(result, 1);
});
