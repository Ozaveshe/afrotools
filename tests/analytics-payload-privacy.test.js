'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const vm = require('vm');

test('general analytics never emit raw search or error text', function() {
  const events = [];
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'js', 'lib', 'analytics.js'),
    'utf8'
  );
  const sandbox = {
    URL,
    URLSearchParams,
    Date,
    Math,
    Set,
    String,
    console,
    setTimeout,
    clearInterval,
    localStorage: { getItem: () => 'accepted' },
    sessionStorage: {
      getItem: () => '1',
      setItem: () => {},
    },
    document: {
      readyState: 'loading',
      body: null,
      referrer: '',
      addEventListener: () => {},
      querySelector: () => null,
    },
  };
  sandbox.window = {
    gtag: function(command, eventName, payload) {
      if (command === 'event') events.push({ eventName, payload });
    },
    requestIdleCallback: function(callback) { callback(); },
    location: { pathname: '/', search: '', origin: 'https://afrotools.com' },
    AfroTools: {},
  };

  vm.runInNewContext(source, sandbox, { filename: 'analytics.js' });
  const analytics = sandbox.window.AfroTools.analytics;
  const sensitive = 'Ada private@example.com salary 950000';
  analytics.trackSearch(sensitive, 2, 'navbar');
  analytics.trackSearchNoResults(sensitive, 'navbar');
  analytics.trackError('salary-tool', 'validation', sensitive);

  assert.strictEqual(events.length, 3);
  for (const event of events) {
    const serialized = JSON.stringify(event);
    assert.ok(!serialized.includes(sensitive));
    assert.ok(!Object.prototype.hasOwnProperty.call(event.payload, 'query'));
    assert.ok(!Object.prototype.hasOwnProperty.call(event.payload, 'error_message'));
  }
  assert.strictEqual(events[0].payload.query_length, sensitive.length);
  assert.strictEqual(events[2].payload.error_message_length, sensitive.length);
});
