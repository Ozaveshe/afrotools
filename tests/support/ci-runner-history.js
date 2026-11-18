'use strict';
const assert = require('node:assert/strict');
// Exact reviewed runner-assertion inverse for immutable historical checksum tests.
// No historical fixture, checksum, command or assertion is replaced wholesale.
const original = "  assert.ok(current.includes(inventory.originalVerifyYaml)); assert.ok(current.includes(inventory.originalSmokeYaml));\n";
const supported = "  // Retain the genuine historical fixture; permit only the supported OS pin.\n  // Commands, environment, timeout and all remaining block bytes stay exact.\n  for (const block of [inventory.originalVerifyYaml, inventory.originalSmokeYaml]) {\n    const oldRunner = '    runs-on: ubuntu-latest\\n';\n    const supportedRunner = '    runs-on: ubuntu-24.04\\n';\n    assert.equal(block.split(oldRunner).length, 2, 'Historical block must contain exactly one original runner');\n    const expected = block.replace(oldRunner, supportedRunner);\n    assert.equal(expected.replace(supportedRunner, oldRunner), block, 'Runner inverse must recover every original byte');\n    assert.ok(current.includes(expected), 'Only the explicit runner pin may differ from the original Verify/smoke block');\n  }\n  assert.deepEqual(current.match(/^    runs-on: .+$/gm), Array(5).fill('    runs-on: ubuntu-24.04'), 'All five native job definitions require the supported pinned runner');\n";
function restoreRunnerAssertion(text) {
  assert.equal(text.split(supported).length, 2, 'Exactly one reviewed supported-runner assertion block is required');
  return text.replace(supported, original);
}
module.exports = {restoreRunnerAssertion};
