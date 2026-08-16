const assert = require('assert');

let scheduledModule;
assert.doesNotThrow(() => {
  scheduledModule = require('../netlify/functions/scheduled-send-jamb-daily');
}, 'the scheduled JAMB sender must initialize before Netlify invokes its handler');

assert.strictEqual(
  typeof scheduledModule.handler,
  'function',
  'the scheduled JAMB sender must export a handler'
);

console.log('scheduled-send-jamb-daily: ok');
