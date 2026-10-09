'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { hasVisibleInventoryCount } = require('../scripts/verify-afrokitchen-cuisine-intelligence');

test('inventory count accepts visible case and markup variations', () => {
  for (const html of ['55 country hubs', '55 COUNTRY HUBS', '<strong>55</strong> Country hubs', '55&nbsp;country hubs']) {
    assert.equal(hasVisibleInventoryCount(html, 55, 'country hubs'), true);
  }
});
test('inventory count rejects wrong counts, missing wording and script-only claims', () => {
  for (const html of ['54 country hubs', '56 COUNTRY HUBS', '155 country hubs', '55 countries', 'country hubs', '<script>"55 country hubs"</script>', '<div data-label="55 country hubs">Browse countries</div>']) {
    assert.equal(hasVisibleInventoryCount(html, 55, 'country hubs'), false, html);
  }
});
