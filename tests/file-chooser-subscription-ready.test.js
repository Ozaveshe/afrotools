'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { keyboardFileChooser } = require('./support/file-chooser-subscription-ready');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// This is the transport ordering contract, not a simulated product/browser test.
function transport() {
  const ack = deferred(), chooser = deferred(), actions = [], requests = [];
  const chosen = { syntheticNativeChooser: true };
  const page = {
    _connection: { sendMessageToServer(object, method, params) {
      requests.push({ object, method, params }); return ack.promise;
    } },
    waitForEvent(event) {
      assert.equal(event, 'filechooser');
      this._connection.sendMessageToServer(this, 'updateSubscription', { event: 'fileChooser', enabled: true });
      return chooser.promise;
    },
    keyboard: { async press(key) { actions.push(key); chooser.resolve(chosen); } }
  };
  return { page, ack, chooser, actions, requests, chosen, send: page._connection.sendMessageToServer };
}

for (const key of ['Enter', 'Space']) {
  test('native ' + key + ' activation waits for the actual subscription ACK', async () => {
    const f = transport();
    const result = keyboardFileChooser(f.page, key);
    assert.equal(f.page._connection.sendMessageToServer, f.send, 'Temporary capture must restore synchronously');
    assert.equal(f.requests.length, 1);
    await Promise.resolve();
    assert.deepEqual(f.actions, [], 'No activation while ACK is pending');
    f.ack.resolve({});
    assert.equal(await result, f.chosen);
    assert.deepEqual(f.actions, [key]);
    assert.equal(f.page._connection.sendMessageToServer, f.send);
  });
}

test('subscription failure propagates unchanged and never activates input', async () => {
  const f = transport(), failure = new Error('synthetic subscription failure');
  const result = keyboardFileChooser(f.page, 'Enter');
  f.ack.reject(failure);
  await assert.rejects(result, error => error === failure);
  assert.deepEqual(f.actions, []);
  assert.equal(f.page._connection.sendMessageToServer, f.send);
});

test('missing subscription fails closed without keyboard activation', async () => {
  const f = transport();
  f.page.waitForEvent = () => f.chooser.promise;
  await assert.rejects(keyboardFileChooser(f.page, 'Enter'), /not captured synchronously/);
  assert.deepEqual(f.actions, []);
  assert.equal(f.page._connection.sendMessageToServer, f.send);
});

test('changed transport interface fails before registering a waiter', async () => {
  const f = transport(); let waiters = 0;
  f.page._connection.sendMessageToServer = null;
  f.page.waitForEvent = () => { waiters++; return f.chooser.promise; };
  await assert.rejects(keyboardFileChooser(f.page, 'Enter'), /interface changed/);
  assert.equal(waiters, 0); assert.deepEqual(f.actions, []);
});

test('unreviewed SDK fails closed before any transport or keyboard action', async () => {
  const source = fs.readFileSync(path.join(__dirname, 'support/file-chooser-subscription-ready.js'), 'utf8');
  const moduleObject = { exports: {} };
  vm.runInNewContext(source, { module: moduleObject, require(name) { assert.equal(name, 'playwright-core/package.json'); return { version: '1.60.0' }; } });
  const f = transport();
  await assert.rejects(moduleObject.exports.keyboardFileChooser(f.page, 'Enter'), /requires reviewed/);
  assert.equal(f.requests.length, 0); assert.deepEqual(f.actions, []);
});

test('synchronous native waiter failure restores the transport and propagates', async () => {
  const f = transport(), failure = new Error('synthetic native waiter failure');
  f.page.waitForEvent = () => { throw failure; };
  await assert.rejects(keyboardFileChooser(f.page, 'Enter'), error => error === failure);
  assert.equal(f.page._connection.sendMessageToServer, f.send); assert.deepEqual(f.actions, []);
});
