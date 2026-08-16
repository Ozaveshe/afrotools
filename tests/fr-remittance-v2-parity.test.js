'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'fr', 'tools', 'transfert-v2', 'index.html'), 'utf8');
const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const routePolicy = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'registry', 'route-policy.json'), 'utf8')
);
const decision = routePolicy.canonicalDecisions.find(
  (row) => row.id === 'french-remittance-v2-duplicate-alias'
);

assert.ok(decision, 'French retired remittance decision must stay explicit');
assert.strictEqual(decision.source, '/fr/tools/transfert-v2/');
assert.strictEqual(decision.destination, '/fr/tools/transfert-argent/');
assert.strictEqual(decision.statusCode, 301);
assert.match(
  redirects,
  /^\/fr\/tools\/transfert-v2\/\s+\/fr\/tools\/transfert-argent\/\s+301!$/m
);
assert.match(
  html,
  /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/tools\/transfert-argent\/">/
);
assert.match(
  html,
  /<meta property="og:url" content="https:\/\/afrotools\.com\/fr\/tools\/transfert-argent\/">/
);

console.log('fr-remittance-v2 retired alias contract: ok');
